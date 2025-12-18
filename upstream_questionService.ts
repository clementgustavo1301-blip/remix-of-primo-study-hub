import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "last_generated_question";

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

  // 2. Generate with AI via Edge Function
  console.log("Chamando Lovable AI...");
  
  const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-question', {
    body: { subject, topic, difficulty, type: 'questions' }
  });

  if (functionError) {
    console.error("Edge function error:", functionError);
    throw new Error(functionError.message || "Erro ao gerar questões");
  }

  if (functionData?.error) {
    console.error("AI error:", functionData.error);
    throw new Error(functionData.error);
  }

  const json = functionData?.data;
  
  if (!json || !Array.isArray(json)) {
    throw new Error("Formato inválido retornado pela IA");
  }

  // 3. Save to Database
  if (userId) {
    const { error } = await supabase.from('questions_pool').insert({
      created_by: userId,
      subject, 
      topic, 
      difficulty,
      content: json,
    });
    if (error) console.error("❌ Erro ao salvar:", error);
    else console.log("💾 Salvo no banco com sucesso!");
  }

  // 4. Save to localStorage
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      question: json[0],
      subject,
      topic,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("Erro ao salvar no localStorage", e);
  }

  return json;
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
