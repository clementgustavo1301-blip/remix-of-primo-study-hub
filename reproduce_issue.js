import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        let value = valueParts.join('=');
        value = value.trim().replace(/^["'](.*)["']$/, '$1'); // Remove quotes
        envConfig[key.trim()] = value;
    }
});

const apiKey = envConfig.VITE_GOOGLE_API_KEY;

if (!apiKey) {
    console.error("API Key not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`\nTesting model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    try {
        const result = await model.generateContent("Hello, are you there?");
        console.log(`✅ Success with ${modelName}`);
        console.log("Response:", result.response.text());
        return true;
    } catch (error) {
        console.error(`❌ Failed with ${modelName}`);
        console.error("Error:", error.message);
        return false;
    }
}

async function run() {
    console.log("Starting model tests...");

    // Test the primary model (gemini-1.5-flash)
    await testModel("gemini-1.5-flash");

    // Test the fallback model (gemini-1.5-pro)
    await testModel("gemini-1.5-pro");

    // Test a standard model that should work
    await testModel("gemini-1.5-flash");
}

run();
