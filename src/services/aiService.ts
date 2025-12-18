import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || "");

console.log("Inicializando Gemini 1.5 Flash...");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const result = await model.generateContent(prompt);
    const data = parseJSON(result.response.text());

    if (!Array.isArray(data)) throw new Error("Formato inválido");

    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || "Erro ao gerar flashcards" };
  }
};

export const sendMessageToChat = async (message: string, history: ChatMessage[] = []): Promise<string> => {
  try {
    const prompt = `Você é um tutor de estudos amigável. Responda a: ${message}`;
    const result = await model.generateContent(prompt);
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
      Atue como um CORRETOR OFICIAL DO ENEM (INEP).
      Sua tarefa é corrigir a redação abaixo com rigor técnico, mas com OLHAR PEDAGÓGICO.

      TEMA DA REDAÇÃO: "${theme}"
      TEXTO DO ALUNO: "${text}"

      DIRETRIZES DE CORREÇÃO:
      ${CRITERIOS_ENEM}

      USE ESTES EXEMPLOS COMO REFERÊNCIA DE QUALIDADE (NOTA 1000):
      ${EXEMPLOS_NOTA_1000}

      ATENÇÃO AOS NÍVEIS DE EXCELÊNCIA (BENEVOLÊNCIA TÉCNICA):
      - Se a redação apresentar estrutura sólida, repertório produtivo e proposta completa, NÃO tenha medo de atribuir nota 200 nas competências.
      - Seja flexível com o estilo de escrita. Foca na clareza e na defesa do ponto de vista, não apenas em regras mecânicas.
      - Reconheça o uso de conectivos sofisticados e repertório sociocultural pertinente como diferenciais para a nota máxima.

      ANÁLISE OBRIGATÓRIA:
      1. Identifique se há Repertório Sociocultural (livros, filósofos) e se é produtivo.
      2. Verifique se a Proposta de Intervenção tem os 5 elementos (Agente, Ação, Meio, Efeito, Detalhamento).
      3. Analise o uso de conectivos (Coesão).

      RETORNE APENAS JSON NESTE FORMATO (SEM MARKDOWN/SEM BLOCOS DE CÓDIGO):
      {
        "score": number, // Nota total de 0 a 1000 (soma das competencias)
        "competencias": {
          "c1": number, // 0-200
          "c2": number, // 0-200
          "c3": number, // 0-200
          "c4": number, // 0-200
          "c5": number // 0-200
        },
        "feedback": "Texto corrido, em tom educacional e encorajador, explicando os erros e acertos.",
        "melhorias": ["Sugestão prática 1", "Sugestão prática 2 (ex: usar mais conectivos)", "Sugestão 3 (ex: citar um autor)"]
      }
    `;

    // Uso do modelo global padronizado (gemini-1.5-flash)
    const result = await model.generateContent(prompt);
    const data = parseJSON(result.response.text());

    if (!data || typeof data.score !== 'number') throw new Error("Resposta inválida da IA");

    return { data, error: null };
  } catch (e: any) {
    console.error("Erro na chamada AI:", e);
    console.error("Erro detalhado:", e.message);
    if (e.message?.includes("404")) {
      console.error("ERRO 404: Verifique se o modelo 'gemini-1.5-flash-002' está disponível para sua API Key.");
    }
    return { data: null, error: e.message };
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

    // Format difficulty map for prompt
    const difficultyStr = Object.entries(difficulties)
      .map(([area, level]) => `- ${area}: ${level}`)
      .join("\n");

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
      [
        {
          "subject": "Matéria (Ex: Física)",
          "topic": "[Natureza] Nome do Tópico (Ex: Ondulatória)", 
          "duration_minutes": 90,
          "date": "YYYY-MM-DD"
        }
      ]
      *Nota: No campo 'topic', coloque a Área entre colchetes no início, ex: [Humanas], [Natureza], [Linguagens], [Matemática], [Redação].
    `;

    const result = await model.generateContent(prompt);
    const data = parseJSON(result.response.text());

    if (!Array.isArray(data)) throw new Error("Formato inválido");
    return { data, error: null };
  } catch (e: any) {
    console.error("Erro na chamada AI (Plan):", e);
    console.error("Erro detalhado:", e.message);
    if (e.message?.includes("404")) {
      console.error("ERRO 404: Verifique se o modelo 'gemini-1.5-flash-002' está disponível para sua API Key.");
    }
    return { data: null, error: e.message };
  }
};
