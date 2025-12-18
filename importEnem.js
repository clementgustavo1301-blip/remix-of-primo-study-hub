import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// ⚠️ IMPORTANTE: Use a chave SERVICE_ROLE aqui para ter permissão de escrita total
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = "COLE_SUA_SERVICE_ROLE_KEY_AQUI"; // Não use a anon key!

if (!supabaseUrl || !supabaseKey || supabaseKey.includes("COLE_SUA")) {
    console.error("❌ ERRO: Você precisa configurar a URL e a SERVICE_ROLE_KEY no script.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const YEARS = [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016];

async function importAllYears() {
    console.log("🚀 Iniciando importação do ENEM...");

    for (const year of YEARS) {
        const url = `https://raw.githubusercontent.com/wgenial/enem-json/master/${year}/${year}.json`;
        console.log(`\n📅 Baixando ano ${year}...`);

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            const data = await response.json();

            console.log(`   ✅ ${data.length} questões encontradas. Processando...`);

            const questions = data.map(q => ({
                subject: q.discipline || q.area || 'Geral',
                topic: `ENEM ${year}`,
                difficulty: 'medium',
                is_public: true,
                content: {
                    question: q.title || q.context || "Sem enunciado",
                    options: [
                        q.alternatives.a || "A", q.alternatives.b || "B",
                        q.alternatives.c || "C", q.alternatives.d || "D", q.alternatives.e || "E"
                    ],
                    correctAnswer: q.correctAlternative || "?",
                    explanation: `Questão do ENEM ${year}`
                }
            }));

            // Batch Insert (Lote de 50)
            for (let i = 0; i < questions.length; i += 50) {
                const batch = questions.slice(i, i + 50);
                const { error } = await supabase.from('questions_pool').insert(batch);
                if (error) console.error(`   ❌ Erro lote ${i}:`, error.message);
            }
            console.log(`   💾 Ano ${year} salvo!`);

        } catch (err) {
            console.error(`   ⚠️ Falha em ${year}:`, err.message);
        }
    }
    console.log("\n🏁 FIM DA IMPORTAÇÃO!");
}

importAllYears();
