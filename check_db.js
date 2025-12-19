
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Using anon key is enough for public/RLS check if open, or service role if needed (but we only have anon in file usually)

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("Checking database connection...");

    // Check Flashcards
    const { count: flashcardsCount, error: flashError } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true });

    if (flashError) console.error("Error checking flashcards:", flashError.message);
    else console.log(`Flashcards found: ${flashcardsCount}`);

    // Check Essays
    const { count: essaysCount, error: essayError } = await supabase
        .from('essays')
        .select('*', { count: 'exact', head: true });

    if (essayError) console.error("Error checking essays:", essayError.message);
    else console.log(`Essays found: ${essaysCount}`);

    // Check Saved Questions
    const { count: questionsCount, error: questionsError } = await supabase
        .from('saved_questions')
        .select('*', { count: 'exact', head: true });

    if (questionsError) console.error("Error checking saved_questions:", questionsError.message);
    else console.log(`Saved Questions found: ${questionsCount}`);
}

checkData();
