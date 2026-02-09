import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || "");

// --- Model Strategy ---
// Usando Gemini 1.5 Flash como modelo primário para melhor estabilidade e velocidade
const primaryModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generateWithFallback = async (prompt: string) => {
  try {
    console.log("Tentando Gemma-3-27b-it...");
    const result = await primaryModel.generateContent(prompt);
    console.log("✅ Gemma Success");
    return result;
  } catch (e: any) {
    console.warn("⚠️ Erro no modelo primário:", e.message);

    // Check for API Key validity before fallback
    if (e.message?.includes("API_KEY_INVALID") || e.message?.includes("API key expired")) {
      console.error("❌ API Key Expired or Invalid");
      throw new Error("Sua chave da API do Google (Gemini) expirou ou é inválida. Atualize no arquivo .env");
    }

    try {
      console.warn("⚠️ Fallback para Gemma-3-27b-it (tentativa 2)");
      const result = await fallbackModel.generateContent(prompt);
      console.log("✅ Fallback Success");
      return result;
    } catch (fallbackError: any) {
      if (fallbackError.message?.includes("API_KEY_INVALID") || fallbackError.message?.includes("API key expired")) {
        throw new Error("Sua chave da API do Google (Gemini) expirou ou é inválida. Atualize no arquivo .env");
      }
      throw fallbackError;
    }
  }
};

const EXEMPLOS_REFERENCIA = `
EXEMPLO 1 (Arthur Sanches - Cuidado Invisível):
"Conforme estudos demográficos realizados pelo Instituto Brasileiro de Geografia e Estatística (IBGE)... [IA: Note o uso de Zygmunt Bauman e Djamila Ribeiro]. Intervenção: Ministério da Cidadania propagar dados."

EXEMPLO 2 (Sabrina Shimizu - Herança Africana):
"O livro “Nós matamos o cão tinhoso” de Luís Bernardo Honwana retrata a sociedade moçambicana... [IA: Note a estrutura cíclica e citações de Krenak e Chauí]. Intervenção: Parceria ME e MEC para eventos culturais."

EXEMPLO 3 (Gabriel Borges - Registro Civil):
"Norberto Bobbio, cientista político italiano, afirma que a democracia... [IA: Note a citação de Vidas Secas e Marx]. Intervenção: Mutirão 'Meu Registro, Minha Identidade'."
`;

const CRITERIOS_ENEM = `
# PERSONA
Você é um Corretor Especialista do ENEM. Sua correção é técnica, mas justa.
Você DEVE atribuir nota 1000 se o texto for excelente, mesmo com 1 ou 2 desvios gramaticais irrelevantes (tolerância oficial).

# COMPETÊNCIAS (0-200 pontos):
1.  **Norma Culta:** Aceite até 2 desvios leves (vírgula, crase) para nota 200, desde que o texto seja fluido e complexo.
2.  **Tema/Repertório:** OBRIGATÓRIO repertório legitimado (Livros, Filósofos, Leis). Se usar bem, nota 200.
3.  **Argumentação:** Defesa consistente da tese.
4.  **Coesão:** Uso variado de conectivos (Nesse contexto, Outrossim).
5.  **Intervenção:** SE TIVER OS 5 ELEMENTOS (Agente, Ação, Meio, Efeito, Detalhamento), A NOTA É 200. Não penalize subjetivamente.

# REGRAS MATEMÁTICAS:
- Nota final DEVE ser múltiplo de 20 (ex: 880, 920, 960, 1000).
- NUNCA use números quebrados (ex: 925).

# SAÍDA JSON:
{
  "score": number,
  "feedback": "Texto corrido motivador.",
  "melhorias": ["Dica 1", "Dica 2"],
  "competencias": { "c1": number, "c2": number, "c3": number, "c4": number, "c5": number }
}
`;

// Função auxiliar para limpar Markdown e extrair apenas o objeto JSON
function cleanAndParseJSON(text: string): any {
  try {
    // 1. Encontra o primeiro '[' e o último ']' (ou '{' e '}')
    // Adaptado para suportar arrays (pedido) e objetos (existente)
    const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);

    if (!jsonMatch) {
      throw new Error("Nenhum JSON (array ou objeto) encontrado na resposta.");
    }

    // 2. Pega apenas a parte que corresponde ao JSON
    const cleanJson = jsonMatch[0];

    // 3. Tenta fazer o parse
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Falha ao limpar/parsear JSON:", error);
    console.log("Texto original recebido:", text); // Log para debug
    throw new Error("Erro ao processar resposta da IA.");
  }
}


// Função auxiliar para converter arquivo em GenerativePart
async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve({
          inlineData: { data: reader.result.split(',')[1], mimeType: file.type }
        });
      } else {
        reject(new Error("Falha ao ler arquivo"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- Types ---

export interface AIResponse<T> {
  data: T | null;
  error: string | null;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface EssayFeedback {
  score: number;
  competencias: {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
  };
  feedback: string;
  melhorias: string[];
}

export interface StudyTask {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  category: string;
  duration: number;
}

export interface StudyPlanResult {
  summary: string;
  tasks: StudyTask[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// --- Functions ---

export const generateFlashcards = async (topic: string, count: number = 5): Promise<AIResponse<Flashcard[]>> => {
  try {
    const prompt = `
      Crie ${count} flashcards sobre "${topic}".
      Responda APENAS um JSON Array válido: [{"front": "Pergunta", "back": "Resposta"}]
    `;
    const result = await generateWithFallback(prompt);
    const data = cleanAndParseJSON(result.response.text());

    if (!Array.isArray(data)) throw new Error("Formato inválido");

    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || "Erro ao gerar flashcards" };
  }
};

export const sendMessageToChat = async (message: string, history: ChatMessage[] = []): Promise<string> => {
  try {
    const prompt = `Você é um tutor de estudos amigável. Responda a: ${message}`;
    const result = await generateWithFallback(prompt);
    return result.response.text();
  } catch (e) {
    console.error("Chat error", e);
    return "Desculpe, não consegui processar sua mensagem agora.";
  }
};

export const answerQuestion = async (
  question: string,
  context?: string,
  history?: ChatMessage[]
): Promise<AIResponse<string>> => {
  try {
    const response = await sendMessageToChat(question, history || []);
    return { data: response, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
};

export const correctEssay = async (text: string, theme: string = "Tema Livre"): Promise<AIResponse<EssayFeedback>> => {
  try {
    const prompt = `
      ${EXEMPLOS_REFERENCIA}
      ${CRITERIOS_ENEM}
      
      Agora, aja como o corretor oficial e avalie esta redação:
      TEMA: ${theme}
      TEXTO DO ALUNO: "${text}"
    `;

    // Uso do modelo com fallback
    const result = await generateWithFallback(prompt);
    const rawData = cleanAndParseJSON(result.response.text());

    if (!rawData || typeof rawData.score !== 'number') {
      throw new Error("Resposta inválida da IA");
    }

    // --- CORREÇÃO DO BUG 220 ---
    const clamp = (num: number) => Math.min(Math.max(num, 0), 200);

    // Normaliza cada competência
    rawData.competencias.c1 = clamp(rawData.competencias.c1);
    rawData.competencias.c2 = clamp(rawData.competencias.c2);
    rawData.competencias.c3 = clamp(rawData.competencias.c3);
    rawData.competencias.c4 = clamp(rawData.competencias.c4);
    rawData.competencias.c5 = clamp(rawData.competencias.c5);

    // Recalcula o total para garantir soma correta
    rawData.score =
      rawData.competencias.c1 +
      rawData.competencias.c2 +
      rawData.competencias.c3 +
      rawData.competencias.c4 +
      rawData.competencias.c5;
    // --- FIM DA CORREÇÃO ---

    // Map new JSON format to EssayFeedback interface
    const data: EssayFeedback = {
      score: rawData.score,
      competencias: {
        c1: rawData.competencias.c1,
        c2: rawData.competencias.c2,
        c3: rawData.competencias.c3,
        c4: rawData.competencias.c4,
        c5: rawData.competencias.c5,
      },
      feedback: rawData.feedback,
      melhorias: rawData.melhorias || []
    };

    return { data, error: null };
  } catch (e: any) {
    console.error("Erro na chamada AI:", e);
    console.error("Erro detalhado:", e.message);
    if (e.message?.includes("404")) {
      console.error("ERRO 404: Verifique se o modelo 'gemma-3-27b-it' está disponível para sua API Key.");
    }
    return { data: null, error: e.message };
  }
};

export const transcribeImage = async (imageFile: File): Promise<string> => {
  try {
    // Usando explicitamente o modelo Gemma
    const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" }, { apiVersion: "v1beta" });
    const imagePart = await fileToGenerativePart(imageFile);

    const prompt = "Você é um especialista em transcrição de manuscritos. Transcreva EXATAMENTE o que está escrito nesta folha de redação. Não adicione saudações, não corrija o texto, apenas retorne o texto transcrito linha por linha.";

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (e: any) {
    console.error("Erro na transcrição:", e);
    throw new Error("Não foi possível ler o manuscrito. Tente uma foto mais nítida.");
  }
};

export const createStudyPlan = async (
  hoursPerDay: number,
  university: string,
  course: string,
  difficulties: string[],
  daysCount: number = 7
): Promise<AIResponse<StudyTask[]>> => {
  try {
    const todayStr = new Date().toLocaleDateString("pt-BR");

    // Format difficulty list for prompt
    const difficultyStr = difficulties.length > 0
      ? difficulties.map(d => `- ${d}`).join("\n")
      : "Nenhuma dificuldade específica relatada.";

    const prompt = `
      Atue como um ESTRATEGISTA DO ENEM e SISU.
      Gere um cronograma de ${daysCount} dias começando em ${todayStr}.
      
      ALUNO:
      - Curso Desejado: ${course}
      - Faculdade: ${university}
      - Disponibilidade: ${hoursPerDay}h/dia
      
      DIFICULDADE POR ÁREA DO CONHECIMENTO:
      ${difficultyStr}

      REGRAS DE PESOS E PRIORIDADE (ALGORITMO SISU):
      1. Identifique os pesos do SISU para ${course} na ${university} (ou use padrão da área).
      2. Crie um SCORE DE PRIORIDADE para cada área: (Peso da Área × Dificuldade do Aluno).
         - Dificuldade "Difícil" aumenta muito a necessidade de estudo.
         - Dificuldade "Fácil" sugere apenas revisão.
      3. Áreas com SCORE MAIOR = Mais tempo (90-120min) e maior frequência.
      4. Áreas com SCORE MENOR = Revisão rápida (45-60min) e resolução de questões.

      CONTEÚDO:
      - Utilize APENAS os tópicos que MAIS CAÍRAM no ENEM nos últimos 5 anos.
      - Distribua as tarefas sequencialmente a partir de ${todayStr}.

      RESPOSTA ESPERADA (JSON PURO, SEM MARKDOWN, SEM BLOCOS DE CÓDIGO):
      {
        "summary": "Breve resumo da estratégia (1-2 frases) focada no SISU",
        "tasks": [
          {
            "subject": "Matéria (Ex: Física)",
            "topic": "[Natureza] Nome do Tópico (Ex: Ondulatória)", 
            "duration_minutes": 90,
            "date": "YYYY-MM-DD"
          }
        ]
      }
      *Nota: No campo 'topic', coloque a Área entre colchetes no início, ex: [Humanas], [Natureza], [Linguagens], [Matemática], [Redação].
    `;

    const result = await generateWithFallback(prompt);
    const data = cleanAndParseJSON(result.response.text());

    if (data && data.tasks) {
      console.log("ESTRUTURA DO JSON RECEBIDO: Objeto com", data.tasks.length, "tarefas");
    } else if (Array.isArray(data)) {
      console.log("ESTRUTURA DO JSON RECEBIDO (Array):", data.length, "itens");
    } else {
      console.log("ESTRUTURA DO JSON RECEBIDO (Desconhecida):", data);
    }

    return { data, error: null };
  } catch (e: any) {
    console.error("Erro na chamada AI (Plan):", e);
    console.error("Erro detalhado:", e.message);
    if (e.message?.includes("404")) {
      console.error("ERRO 404: Verifique se o modelo 'gemma-3-27b-it' está disponível para sua API Key.");
    }
    return { data: null, error: e.message };
  }
};
