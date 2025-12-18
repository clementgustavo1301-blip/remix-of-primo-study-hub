import { supabase } from "@/integrations/supabase/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || "");

export const generateAndCacheQuestions = async (
  subject: string,
  topic: string,
  difficulty: string = 'medium',
  userId: string | undefined
) => {
  console.log(`🚀 Iniciando: ${topic} (${subject})`);

  // 1. Check Cache (Database)
  try {
    const { data: existing, error } = await supabase
      .from('questions_pool')
      .select('content')
      .eq('subject', subject)
      .eq('topic', topic)
      .eq('difficulty', difficulty)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log("✅ ACHOU NO BANCO!");
      return existing[0].content;
    }
  } catch (err) {
    console.warn("Erro ao buscar cache", err);
  }

  // 2. Gera com IA
  console.log("Inicializando Gemini 1.5 Flash...");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  // Define instruções extras baseadas na dificuldade escolhida
  let instrucaoNivel = "";

  if (difficulty === 'hard') {
    instrucaoNivel = `
      NÍVEL DIFÍCIL (HIGH STAKES):
      - Utilize textos-base longos, complexos, acadêmicos ou com linguagem técnica.
      - As questões devem exigir INTERDISCIPLINARIDADE (relacionar com outras matérias).
      - As alternativas incorretas (distratores) devem ser muito plausíveis e sutis.
      - Exija raciocínio lógico avançado, não apenas memória.`;
  } else {
    instrucaoNivel = `
      NÍVEL PADRÃO (ENEM):
      - Foco em interpretação de texto e aplicação direta de conceitos.
      - Dificuldade balanceada para o aluno médio.`;
  }

  const prompt = `
    Atue como um elaborador sênior do INEP.
    Crie 5 questões de múltipla escolha sobre "${topic}" (${subject}).
    
    INSTRUÇÕES DE DIFICULDADE:
    ${instrucaoNivel}

    REGRAS OBRIGATÓRIAS:
    1. Idioma: Português do Brasil.
    2. Estrutura: Texto-base + Comando + 5 Alternativas.
    3. Formatação: 
       - As opções ("options") DEVEM conter APENAS o texto da resposta. NÃO inclua "A)", "B)", "a.", etc.
       - A resposta correta ("correctAnswer") DEVE ser o índice numérico (0 para A, 1 para B, 2 para C, etc).

    Responda APENAS JSON Array válido, SEM blocos de código ou markdown:
    [
      {
        "question": "Texto base... \\n\\n Comando da questão...",
        "options": ["Texto da alternativa A", "Texto da alternativa B", "Texto da alternativa C", "Texto da alternativa D", "Texto da alternativa E"],
        "correctAnswer": 0,
        "explanation": "Explicação detalhada citando a competência exigida."
      }
    ]
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json|```/g, "").trim();
  const json = JSON.parse(text);

  // 3. Salva no Banco
  if (userId) {
    const { error } = await supabase.from('questions_pool').insert({
      created_by: userId,
      subject, topic, difficulty,
      content: json,
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
    throw new Error("Limite do modelo experimental atingido. Aguarde um momento.");
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
