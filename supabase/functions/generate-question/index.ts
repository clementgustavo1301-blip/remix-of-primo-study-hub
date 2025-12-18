import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { subject, topic, difficulty, type } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "flashcards") {
      systemPrompt = "Você é um especialista em criar flashcards educacionais em português brasileiro.";
      userPrompt = `Crie 5 flashcards sobre "${topic}". Responda APENAS um JSON Array válido: [{"front": "Pergunta", "back": "Resposta"}]`;
    } else if (type === "study_plan") {
      const { hoursPerDay, university, course, difficulties, daysCount } = body;
      const today = new Date();
      const dates = Array.from({ length: daysCount || 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d.toISOString().split('T')[0];
      });
      
      systemPrompt = "Você é um estrategista do ENEM e SISU especializado em criar cronogramas de estudo personalizados.";
      userPrompt = `
        Gere um cronograma de ${daysCount || 7} dias.
        Use as datas: ${dates.join(", ")}
        
        ALUNO:
        - Curso Desejado: ${course || "Medicina"}
        - Faculdade: ${university || "Federal"}
        - Disponibilidade: ${hoursPerDay || 4}h/dia
        - Áreas de dificuldade: ${difficulties?.join(", ") || "não informado"}

        REGRAS:
        1. Priorize as áreas de dificuldade
        2. Use tópicos que mais caem no ENEM
        3. Distribua bem as matérias ao longo dos dias

        RESPONDA APENAS JSON (SEM MARKDOWN):
        {
          "summary": "Resumo da estratégia em 1 frase",
          "tasks": [
            {"subject": "Matemática", "topic": "[Matemática] Função Quadrática", "duration_minutes": 90, "date": "YYYY-MM-DD"}
          ]
        }
      `;
    } else {
      // Default: generate questions
      const hard = difficulty === 'hard';
      const instrucaoNivel = hard 
        ? "NÍVEL DIFÍCIL: Use textos-base longos e complexos. Exija interdisciplinaridade. Distratores muito sutis."
        : "NÍVEL PADRÃO ENEM: Interpretação de texto e aplicação direta de conceitos.";

      systemPrompt = "Você é um elaborador sênior do INEP especializado em criar questões estilo ENEM.";
      userPrompt = `
        Crie 5 questões de múltipla escolha sobre "${topic || subject}" (${subject}).
        
        INSTRUÇÕES: ${instrucaoNivel}

        REGRAS OBRIGATÓRIAS:
        1. Idioma: Português do Brasil
        2. Estrutura: Texto-base + Comando + 5 Alternativas
        3. As options NÃO devem conter letras (A, B, etc), apenas o texto
        4. correctAnswer é índice numérico (0 para 1ª alternativa, 1 para 2ª, etc.)

        RESPONDA APENAS JSON Array válido (SEM blocos de código markdown):
        [
          {
            "question": "Texto base... \\n\\n Comando da questão...",
            "options": ["Texto da alt A", "Texto da alt B", "Texto da alt C", "Texto da alt D", "Texto da alt E"],
            "correctAnswer": 0,
            "explanation": "Explicação detalhada citando a competência exigida."
          }
        ]
      `;
    }

    console.log(`Calling Lovable AI for type: ${type || 'questions'}, subject: ${subject}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde alguns segundos e tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    const cleaned = content.replace(/```json|```/g, "").trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      // Try to extract JSON from the response
      const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.error("Failed to parse AI response:", cleaned);
        throw new Error("Invalid AI response format");
      }
    }

    console.log("AI response parsed successfully");

    return new Response(JSON.stringify({ data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-question:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
