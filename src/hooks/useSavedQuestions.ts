import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";


export interface SavedQuestion {
  id: string;
  user_id: string;
  content: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
  subject: string;
  topic: string | null;
  is_correct: boolean;
  created_at: string;
}

export function useSavedQuestions() {
  const { user } = useAuth();
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedQuestions = async () => {
    if (!user) {
      setSavedQuestions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("saved_questions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedQuestions((data || []) as SavedQuestion[]);
    } catch (error) {
      console.error("Error fetching saved questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveQuestion = async (question: {
    content: SavedQuestion["content"];
    subject: string;
    topic?: string;
    is_correct: boolean;
  }) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const { data, error } = await supabase
        .from("saved_questions")
        .insert({
          user_id: user.id,
          content: question.content,
          subject: question.subject,
          topic: question.topic || null,
          is_correct: question.is_correct,
        })
        .select()
        .single();

      if (error) throw error;

      setSavedQuestions((prev) => [data as SavedQuestion, ...prev]);
      return { error: null };
    } catch (error) {
      console.error("Error saving question:", error);
      return { error: error as Error };
    }
  };

  useEffect(() => {
    fetchSavedQuestions();
  }, [user]);

  return { savedQuestions, loading, saveQuestion, refetch: fetchSavedQuestions };
}
