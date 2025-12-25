'use server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analisarImagemAction(base64Image: string) {
  // ⚠️ TEM A CERTEZA QUE A CHAVE AQUI É A ...LuCU
  const apiKey = "AIzaSyBZmU7L6hXhQ9suH0yVh7O1P7i7IIYLuCU"; 

  if (!apiKey) return { error: "Chave API não configurada." };

  // 1. Definimos isto AQUI EM CIMA (fora do try/catch)
  // Assim o 'Plano A' e o 'Plano B' conseguem ambos usar estas variáveis
  const genAI = new GoogleGenerativeAI(apiKey);
  const imagemLimpa = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

  try {
    // --- PLANO A: Tentar o Gemini 2.0 Flash ---
    console.log("--> A tentar com gemini-2.0-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      "Analisa esta imagem de comida. Devolve JSON: {nome, calorias, proteina, gordura, hidratos, peso_estimado}",
      { inlineData: { data: imagemLimpa, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    const text = response.text().replace(/```json|```/g, '').trim();
    
    return { data: JSON.parse(text) };

  } catch (error: any) {
    console.error("ERRO NO PLANO A:", error.message);
    
    // --- PLANO B: Se o A falhar, tentamos o Flash Latest ---
    // Agora este bloco já não vai dar erro vermelho porque já conhece 'genAI' e 'imagemLimpa'
    if (error.message.includes("404") || error.message.includes("429") || error.message.includes("not found")) {
        try {
            console.log("--> A ativar Plano B (gemini-flash-latest)...");
            const modelB = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            
            const resultB = await modelB.generateContent([
                "Analisa esta imagem de comida. Devolve JSON: {nome, calorias, proteina, gordura, hidratos, peso_estimado}",
                { inlineData: { data: imagemLimpa, mimeType: "image/jpeg" } }
            ]);
            
            const textB = resultB.response.text().replace(/```json|```/g, '').trim();
            return { data: JSON.parse(textB) };
            
        } catch (errorB: any) {
            return { error: "Tudo falhou. Erro final: " + errorB.message };
        }
    }

    return { error: error.message };
  }
}