import { supabase } from "@/integrations/supabase/client";

const AI_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-service`;

interface AIResponse<T> {
  data: T | null;
  error: string | null;
}

async function callAI<T>(action: string, payload: Record<string, unknown>): Promise<AIResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-service', {
      body: { action, ...payload }
    });

    if (error) {
      console.error('AI Service Error:', error);
      return { data: null, error: error.message };
    }

    return { data: data as T, error: null };
  } catch (err) {
    console.error('AI Service Error:', err);
    return { data: null, error: 'Erro ao conectar com a IA' };
  }
}

export interface EssayFeedback {
  score: number;
  competencies: {
    c1: { score: number; feedback: string };
    c2: { score: number; feedback: string };
    c3: { score: number; feedback: string };
    c4: { score: number; feedback: string };
    c5: { score: number; feedback: string };
  };
  generalFeedback: string;
}

export async function correctEssay(content: string, theme?: string): Promise<AIResponse<EssayFeedback>> {
  return callAI<EssayFeedback>('correct_essay', { content, theme });
}

export interface Flashcard {
  front: string;
  back: string;
}

export async function generateFlashcards(topic: string, count: number = 5): Promise<AIResponse<Flashcard[]>> {
  return callAI<Flashcard[]>('generate_flashcards', { topic, count });
}

export interface StudyTask {
  subject: string;
  topic: string;
  duration_minutes: number;
  date: string;
}

export async function createStudyPlan(
  hoursPerDay: number, 
  focus: string, 
  weakness: string = "",
  daysCount: number = 7
): Promise<AIResponse<StudyTask[]>> {
  return callAI<StudyTask[]>('create_study_plan', { hoursPerDay, focus, weakness, daysCount });
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function answerQuestion(
  question: string, 
  context?: string,
  history?: ChatMessage[]
): Promise<AIResponse<string>> {
  return callAI<string>('answer_question', { question, context, history });
}
