import { supabase } from "@/integrations/supabase/client";

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
  subject: string;
  topic: string;
  duration_minutes: number;
  date: string;
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
    const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-question', {
      body: { topic, type: 'flashcards' }
    });

    if (functionError) throw new Error(functionError.message);
    if (functionData?.error) throw new Error(functionData.error);

    const data = functionData?.data;
    if (!Array.isArray(data)) throw new Error("Formato inválido");
    
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || "Erro ao gerar flashcards" };
  }
};

export const sendMessageToChat = async (message: string, history: ChatMessage[] = []): Promise<string> => {
  try {
    const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-question', {
      body: { 
        type: 'chat',
        message,
        history
      }
    });

    if (functionError) throw new Error(functionError.message);
    return functionData?.data || "Desculpe, não consegui processar sua mensagem.";
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
    const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-question', {
      body: { 
        type: 'essay',
        text,
        theme
      }
    });

    if (functionError) throw new Error(functionError.message);
    if (functionData?.error) throw new Error(functionData.error);

    const data = functionData?.data;
    if (!data || typeof data.score !== 'number') throw new Error("Resposta inválida da IA");
    
    return { data, error: null };
  } catch (e: any) {
    console.error("Erro na correção:", e);
    return { data: null, error: e.message };
  }
};

export const createStudyPlan = async (
  hoursPerDay: number,
  university: string,
  course: string,
  difficulties: string[],
  daysCount: number = 7
): Promise<AIResponse<StudyPlanResult>> => {
  try {
    const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-question', {
      body: { 
        type: 'study_plan',
        hoursPerDay,
        university,
        course,
        difficulties,
        daysCount
      }
    });

    if (functionError) throw new Error(functionError.message);
    if (functionData?.error) throw new Error(functionData.error);

    const data = functionData?.data;
    
    // Handle both old format (array) and new format (object with summary + tasks)
    if (Array.isArray(data)) {
      return { 
        data: { 
          summary: "Cronograma gerado com sucesso!", 
          tasks: data 
        }, 
        error: null 
      };
    }
    
    if (data && data.tasks) {
      return { data, error: null };
    }

    throw new Error("Formato inválido");
  } catch (e: any) {
    console.error("Erro ao criar plano:", e);
    return { data: null, error: e.message };
  }
};
