import 'dotenv/config';
import fetch from 'node-fetch';

const apiKey = process.env.VITE_GOOGLE_API_KEY;

if (!apiKey) {
    console.error('❌ Erro: VITE_GOOGLE_API_KEY não encontrada no arquivo .env');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log(`🔍 Verificando modelos disponíveis para a chave fornecida...`);

try {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Erro na API (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.models) {
        console.log("⚠️ Nenhum modelo encontrado.");
    } else {
        console.log("✅ Modelos disponíveis que suportam 'generateContent':");
        const availableModels = data.models
            .filter(model => model.supportedGenerationMethods.includes("generateContent"))
            .map(model => model.name.replace("models/", ""));

        availableModels.forEach(name => console.log(`- ${name}`));
    }

} catch (error) {
    console.error(`❌ Falha na requisição:`, error.message);
}
