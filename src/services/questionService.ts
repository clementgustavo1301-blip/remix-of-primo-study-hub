import { supabase } from "@/integrations/supabase/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const CACHE_KEY = "last_generated_question";
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || "");

export const generateAndCacheQuestions = async (
  subject: string,
  topic: string,
  difficulty: string = 'medium',
  userId: string | undefined,
  bypassCache: boolean = false
) => {
  console.log(`🚀 Iniciando: ${topic} (${subject}) - Bypass Cache: ${bypassCache}`);

  // 1. Check Cache (Database) - Only if NOT bypassing
  if (!bypassCache) {
    try {
      const { data: existing, error } = await supabase
        .from('questions_pool')
        .select('content')
        .eq('subject', subject)
        .eq('topic', topic)
        .eq('difficulty', difficulty)
        .limit(5); // Fetch more to avoid repetition

      if (existing && existing.length > 0) {
        // Return a random one from the cached pool
        const randomIndex = Math.floor(Math.random() * existing.length);
        console.log("✅ ACHOU NO BANCO! Retornando questão aleatória do cache.");
        return existing[randomIndex].content;
      }
    } catch (err) {
      console.warn("Erro ao buscar cache", err);
    }
  }

  // 2. Gera com IA
  try {
    // --- Model Selection Strategy ---
    // Switched to Flash for speed as primary model
    const primaryModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Define instruções extras baseadas na dificuldade escolhida
    let instrucaoNivel = "";

    if (difficulty === 'hard') {
      instrucaoNivel = `
        NÍVEL DIFÍCIL (HIGH STAKES / MED SCHOOL):
        - Utilize textos-base longos, complexos (artigos científicos, literatura clássica, dados estatísticos).
        - As questões devem exigir INTERDISCIPLINARIDADE (ex: Biologia com Química, História com Sociologia).
        - As alternativas incorretas (distratores) devem ser muito plausíveis, exigindo precisão conceitual.
        - Exija raciocínio lógico avançado e análise crítica, não apenas memorização.
        - Evite perguntas diretas ("O que é X?"). Prefira situações-problema.`;
    } else {
      instrucaoNivel = `
        NÍVEL PADRÃO (ENEM / VESTIBULAR):
        - Foco em interpretação de texto e aplicação de conceitos em situações do cotidiano.
        - Dificuldade balanceada para o aluno médio.
        - Contextualize a questão (situação prática).`;
    }

    const prompt = `
      Atue como um elaborador sênior do INEP (Brasil).
      Crie UMA questão de múltipla escolha INÉDITA sobre "${topic}" (${subject}).
      
      INSTRUÇÕES DE DIFICULDADE:
      ${instrucaoNivel}

      REGRAS OBRIGATÓRIAS:
      1. Idioma: Português do Brasil.
      2. Estrutura: Texto-base Obrigatório + Enunciado/Comando + 5 Alternativas.
      3. O Texto-base deve ser rico e não apenas uma frase solta.
      4. Formatação: 
         - As opções ("options") DEVEM conter APENAS o texto da resposta. NÃO inclua "A)", "B)", "a.", etc.
         - A resposta correta ("correctAnswer") DEVE ser o índice numérico (0 para A, 1 para B, etc).
      5. Explicação: Forneça uma explicação detalhada e educativa.

      Responda APENAS JSON Array com 1 objeto, SEM markdown:
      [
        {
          "question": "Texto base completo... \\n\\n Comando da questão...",
          "options": ["Texto A", "Texto B", "Texto C", "Texto D", "Texto E"],
          "correctAnswer": 0,
          "explanation": "Explicação detalhada..."
        }
      ]
    `;

    console.log("Tentando gerar com Gemini 1.5 Flash...");
    const result = await primaryModel.generateContent(prompt);

    const text = result.response.text().replace(/```json|```/g, "").trim();
    // Sanitize json string if needed
    const cleanJson = text.replace(/^json\s*/, "");
    const json = JSON.parse(cleanJson);

    console.log("✅ Sucesso com IA!");

    // 3. Salva no Banco
    if (userId && Array.isArray(json) && json.length > 0) {
      // Save specifically this question
      const questionToSave = json[0];
      // We wrap it in an array to match the expected 'content' format if logic expects array, 
      // OR we save just the object if that's how we want to query it. 
      // Looking at legacy code, it returns `json` which is an array `[{...}]`.

      const { error } = await supabase.from('questions_pool').insert({
        created_by: userId,
        subject,
        topic,
        difficulty,
        content: json, // Save the array as received
        is_public: true
      });
      if (error) console.error("❌ Erro ao salvar:", error);
      else console.log("💾 Salvo no banco com sucesso!");
    }

    return json;

  } catch (error: any) {
    console.error("❌ CRITICAL AI ERROR:", error);

    // Tratamento específico de Cota (429)
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Limite do serviço de IA atingido temporariamente. Tente novamente em instantes.");
    }

    throw new Error(`Falha ao gerar questões: ${error.message || "Erro desconhecido"}`);
  }
};

export const getLastCachedQuestion = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Return if less than 24 hours old
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Erro ao ler cache local", e);
  }
  return null;
};
