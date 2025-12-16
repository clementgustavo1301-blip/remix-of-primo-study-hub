import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

async function callLovableAI(messages: Array<{ role: string; content: string }>, tools?: unknown[], tool_choice?: unknown) {
  const body: Record<string, unknown> = {
    model: 'google/gemini-2.5-flash',
    messages,
  };

  if (tools) {
    body.tools = tools;
    body.tool_choice = tool_choice;
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI Gateway Error:', response.status, errorText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  return response.json();
}

async function correctEssay(content: string, theme?: string) {
  const systemPrompt = `Você é um corretor de redações do ENEM especializado. Avalie a redação nas 5 competências:
- C1: Domínio da norma culta
- C2: Compreensão do tema e aplicação de conceitos
- C3: Seleção e organização de informações
- C4: Conhecimento dos mecanismos linguísticos
- C5: Proposta de intervenção

Para cada competência, dê uma nota de 0 a 200 (múltiplos de 40) e um feedback específico.
Calcule a nota total (soma das 5 competências, máximo 1000).`;

  const tools = [{
    type: 'function',
    function: {
      name: 'essay_evaluation',
      description: 'Retorna a avaliação estruturada da redação',
      parameters: {
        type: 'object',
        properties: {
          score: { type: 'number', description: 'Nota total de 0 a 1000' },
          competencies: {
            type: 'object',
            properties: {
              c1: { type: 'object', properties: { score: { type: 'number' }, feedback: { type: 'string' } }, required: ['score', 'feedback'] },
              c2: { type: 'object', properties: { score: { type: 'number' }, feedback: { type: 'string' } }, required: ['score', 'feedback'] },
              c3: { type: 'object', properties: { score: { type: 'number' }, feedback: { type: 'string' } }, required: ['score', 'feedback'] },
              c4: { type: 'object', properties: { score: { type: 'number' }, feedback: { type: 'string' } }, required: ['score', 'feedback'] },
              c5: { type: 'object', properties: { score: { type: 'number' }, feedback: { type: 'string' } }, required: ['score', 'feedback'] },
            },
            required: ['c1', 'c2', 'c3', 'c4', 'c5']
          },
          generalFeedback: { type: 'string', description: 'Feedback geral sobre a redação' }
        },
        required: ['score', 'competencies', 'generalFeedback']
      }
    }
  }];

  const userMessage = theme 
    ? `Tema: ${theme}\n\nRedação:\n${content}`
    : `Redação:\n${content}`;

  const response = await callLovableAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    tools,
    { type: 'function', function: { name: 'essay_evaluation' } }
  );

  const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  throw new Error('Failed to parse essay evaluation');
}

async function generateFlashcards(topic: string, count: number) {
  const systemPrompt = `Você é um especialista em criar flashcards educacionais para estudantes de vestibular.
Crie flashcards claros, concisos e educativos sobre o tema solicitado.
Cada flashcard deve ter uma pergunta/conceito na frente e a resposta/explicação no verso.`;

  const tools = [{
    type: 'function',
    function: {
      name: 'create_flashcards',
      description: 'Cria flashcards educacionais',
      parameters: {
        type: 'object',
        properties: {
          flashcards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                front: { type: 'string', description: 'Pergunta ou conceito' },
                back: { type: 'string', description: 'Resposta ou explicação' }
              },
              required: ['front', 'back']
            }
          }
        },
        required: ['flashcards']
      }
    }
  }];

  const response = await callLovableAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Crie ${count} flashcards sobre: ${topic}` }
    ],
    tools,
    { type: 'function', function: { name: 'create_flashcards' } }
  );

  const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    const result = JSON.parse(toolCall.function.arguments);
    return result.flashcards;
  }

  throw new Error('Failed to generate flashcards');
}

async function createStudyPlan(hoursPerDay: number, focus: string, weakness: string, daysCount: number) {
  const today = new Date();
  const dates = Array.from({ length: daysCount }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  const systemPrompt = `Aja como um coach de estudos especialista em vestibulares e ENEM.
Crie um cronograma de estudos altamente personalizado e eficiente.

REGRAS IMPORTANTES:
1. Distribua as matérias focando MAIS nas dificuldades citadas pelo aluno
2. Alterne entre matérias "pesadas" (exatas) e "leves" (humanas) para evitar fadiga mental
3. Cada bloco de estudo deve ter entre 45-90 minutos (não ultrapassar 90min por sessão)
4. O total de minutos por dia deve corresponder às horas disponíveis
5. Seja ESPECÍFICO nos tópicos (ex: "Cinemática - MRU e MRUV" em vez de apenas "Física")
6. Inclua revisões de conteúdos importantes`;

  const tools = [{
    type: 'function',
    function: {
      name: 'create_schedule',
      description: 'Cria cronograma de estudos personalizado',
      parameters: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                subject: { type: 'string', description: 'Matéria (ex: Matemática, Física, Português, Redação, etc)' },
                topic: { type: 'string', description: 'Tópico específico e detalhado para estudo' },
                duration_minutes: { type: 'number', description: 'Duração em minutos (45-90)' },
                date: { type: 'string', description: 'Data no formato YYYY-MM-DD' }
              },
              required: ['subject', 'topic', 'duration_minutes', 'date']
            }
          }
        },
        required: ['tasks']
      }
    }
  }];

  const weaknessInfo = weakness ? `As dificuldades do aluno são: ${weakness}. Foque MAIS nessas matérias.` : '';

  const response = await callLovableAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Crie um cronograma de estudos para os próximos ${daysCount} dias.

INFORMAÇÕES DO ALUNO:
- Objetivo/Foco: ${focus}
- Horas disponíveis por dia: ${hoursPerDay}
${weaknessInfo}

Datas disponíveis: ${dates.join(', ')}

Crie múltiplas tarefas por dia (blocos de estudo de 45-90 minutos cada) totalizando aproximadamente ${hoursPerDay} horas por dia.
Priorize as dificuldades do aluno mas mantenha um cronograma equilibrado.` }
    ],
    tools,
    { type: 'function', function: { name: 'create_schedule' } }
  );

  const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    const result = JSON.parse(toolCall.function.arguments);
    return result.tasks;
  }

  throw new Error('Failed to create study plan');
}

async function answerQuestion(question: string, context?: string, history?: Array<{ role: string; content: string }>) {
  const systemPrompt = `Você é um tutor educacional especializado em ajudar estudantes de vestibular.
Responda de forma clara, didática e completa.
Use formatação Markdown para melhorar a legibilidade.
Se relevante, dê exemplos práticos e analogias para facilitar o entendimento.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(history || []),
  ];

  if (context) {
    messages.push({ role: 'user', content: `Contexto:\n${context}\n\nPergunta: ${question}` });
  } else {
    messages.push({ role: 'user', content: question });
  }

  const response = await callLovableAI(messages);
  return response.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();

    let result;
    switch (action) {
      case 'correct_essay':
        result = await correctEssay(payload.content, payload.theme);
        break;
      case 'generate_flashcards':
        result = await generateFlashcards(payload.topic, payload.count || 5);
        break;
      case 'create_study_plan':
        result = await createStudyPlan(payload.hoursPerDay, payload.focus, payload.weakness || '', payload.daysCount || 7);
        break;
      case 'answer_question':
        result = await answerQuestion(payload.question, payload.context, payload.history);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI Service Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
