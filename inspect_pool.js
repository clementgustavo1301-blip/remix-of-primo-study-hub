
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectPool() {
    console.log("Inspecting questions_pool...");
    const { data, error } = await supabase
        .from('questions_pool')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error inspecting pool:", error);
    } else {
        console.log("Pool sample:", JSON.stringify(data, null, 2));
    }
}

inspectPool();
