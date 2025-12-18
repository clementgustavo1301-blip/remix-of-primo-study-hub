import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || "");

console.log("Inicializando Gemma 3 4b IT...");
const model = genAI.getGenerativeModel({
  model: "gemma-3-4b-it"
}, {
  apiVersion: "v1beta"
});

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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 1. Critérios Oficiais (As 5 Competências)
const CRITERIOS_ENEM = `
COMPETÊNCIA 1 (Norma Culta): Exige domínio da gramática, ortografia e registro formal. Evitar gírias e repetições.
COMPETÊNCIA 2 (Tema e Repertório): Compreender a proposta e usar repertório sociocultural produtivo (citações, dados, história).
COMPETÊNCIA 3 (Argumentação): Selecionar, relacionar e interpretar fatos, opiniões e argumentos em defesa de um ponto de vista. Projeto de texto estratégico.
COMPETÊNCIA 4 (Coesão): Uso variado e preciso de conectivos (Ex: "Outrossim", "Sob esse viés", "Portanto", "Nesse contexto").
COMPETÊNCIA 5 (Proposta de Intervenção): Deve conter 5 elementos: AGENTE (quem?), AÇÃO (o quê?), MEIO/MODO (como?), EFEITO (para quê?) e DETALHAMENTO.
`;

// 2. Exemplos de Referência (Shot Prompting)
const EXEMPLOS_NOTA_1000 = `
REF 1 (Tema: Registro Civil): Tese clara sobre invisibilidade + Repertório (Bobbio/Vidas Secas) + Proposta completa (Agente: Estado, Ação: Mutirão, Meio: Parceria, Efeito: Cidadania).
REF 2 (Tema: Herança Africana): Tese sobre desvalorização cultural + Repertório (Cão Tinhoso/Krenak) + Conclusão com proposta detalhada para o MEC.
`;

// --- Helper ---

const parseJSON = (text: string) => {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON", e);
    return null;
  }
};

// --- Functions ---

export const generateFlashcards = async (topic: string, count: number = 5): Promise<AIResponse<Flashcard[]>> => {
  try {
    const prompt = `
      Você é um especialista em vestibular de Medicina (UERN/ENEM).
      Crie ${count} flashcards sobre "${topic}".
      Responda APENAS um JSON Array válido: [{"front": "Pergunta", "back": "Resposta"}]
      Responda estritamente em JSON válido.
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
    const prompt = `
      Você é um mentor estratégico para Medicina. Sua base de conhecimento é o ENEM. Seu objetivo é otimizar a nota do aluno focando no que dá mais pontos (Teoria de Resposta ao Item + Pesos da UERN). Personalize o estudo baseado nas dificuldades informadas.
      
      PERSONALIDADE NO CHAT:
      - Responda dúvidas baseadas na Matriz de Referência do ENEM.
      - Só mencione a UERN quando for falar de Pesos (Ex: 'Foque nisso pois vale peso 3 na sua cota') ou bônus regional.
      - Não invente que a UERN tem uma prova própria diferente do ENEM.
      
      Responda a: ${message}
    `;
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
      Você é um especialista em vestibular de Medicina (UERN/ENEM).
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
      Responda estritamente em JSON válido.
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
      console.error("ERRO 404: Verifique se o modelo 'gemini-1.5-flash' está disponível para sua API Key.");
    }
    return { data: null, error: e.message };
  }
};

export const createStudyPlan = async (
  hoursPerDay: number,
  university: string,
  course: string,
  difficulties: Record<string, string>, // { 'Natureza': 'Difícil', 'Humanas': 'Fácil', ... }
  daysCount: number = 7
): Promise<AIResponse<StudyTask[]>> => {
  const today = new Date();

  // 1. TENTATIVA COM IA
  try {
    const preferences = { focus: `${course} na ${university}` };

    const model = genAI.getGenerativeModel({
      model: "gemma-3-4b-it",
    }, { apiVersion: "v1beta" });

    const prompt = `Atue como mentor do ENEM. Crie um plano de estudos de ${daysCount} dias focado em: ${preferences.focus || 'Geral'}.
    Considere estas dificuldades: ${JSON.stringify(difficulties)}.
    
    Retorne APENAS um Array JSON puro neste formato, sem markdown:
    [
      { "day_offset": 1, "subject": "Matemática", "topic": "Funções", "duration": 90 },
      { "day_offset": 2, "subject": "Redação", "topic": "Estrutura", "duration": 60 }
    ]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("AI Response Raw:", text);

    // Extração segura do JSON (busca apenas o conteúdo entre [ e ])
    // Encontra o PRIMEIRO '[' e o ÚLTIMO ']' para ignorar texto extra
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    let jsonBlock = "[]";
    if (firstBracket !== -1 && lastBracket !== -1) {
      jsonBlock = text.substring(firstBracket, lastBracket + 1);
    }

    const data = JSON.parse(jsonBlock);

    if (Array.isArray(data) && data.length > 0) {
      const tasks = data.map((item: any) => {
        const taskDate = new Date(today);
        taskDate.setDate(today.getDate() + (item.day_offset || 1));

        return {
          id: crypto.randomUUID(),
          title: `${item.subject} - ${item.topic}`,
          date: taskDate.toISOString().split('T')[0],
          completed: false,
          category: item.subject,
          duration: item.duration || 60
        };
      });
      return { data: tasks, error: null };
    }
  } catch (error) {
    console.warn("Falha na IA, ativando plano de fallback:", error);
  }

  // 2. PLANO DE EMERGÊNCIA (FALLBACK)
  // Executa se a IA falhar, garantindo que o usuário sempre receba tarefas
  console.log("Gerando cronograma local de fallback...");
  const fallbackPlan = [
    { sub: "Matemática", topic: "Matemática Básica" },
    { sub: "Natureza", topic: "Ecologia" },
    { sub: "Humanas", topic: "História do Brasil" },
    { sub: "Linguagens", topic: "Interpretação de Texto" },
    { sub: "Redação", topic: "Estrutura Dissertativa" },
    { sub: "Natureza", topic: "Química Geral" },
    { sub: "Matemática", topic: "Estatística" }
  ];

  const tasks = fallbackPlan.map((item, index) => {
    const taskDate = new Date(today);
    taskDate.setDate(today.getDate() + (index + 1)); // Gera para os próximos dias

    return {
      id: crypto.randomUUID(),
      title: `${item.sub} - ${item.topic}`,
      date: taskDate.toISOString().split('T')[0],
      completed: false,
      category: item.sub,
      duration: 60
    };
  });

  return { data: tasks, error: null };
};
