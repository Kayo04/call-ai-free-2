'use server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analisarImagemAction(base64Image: string) {
  // ✅ CORREÇÃO: Ler da variável de ambiente, nunca escrever aqui!
  const apiKey = process.env.GEMINI_API_KEY; 

  if (!apiKey) {
    console.error("ERRO: GEMINI_API_KEY não encontrada nas variáveis de ambiente.");
    return { error: "Erro de configuração no servidor (API Key em falta)." };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Limpar cabeçalho do base64 se existir
  const imagemLimpa = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

  try {
    console.log("--> A tentar com gemini-2.0-flash...");
    
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" } 
    });

    const result = await model.generateContent([
      "Analisa esta imagem de comida. Devolve JSON: {nome, calorias, proteina, gordura, hidratos, peso_estimado}",
      { inlineData: { data: imagemLimpa, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    const text = response.text();
    
    return { data: JSON.parse(text) };

  } catch (error: any) {
    console.error("ERRO PRIMÁRIO:", error.message);
    
    // --- PLANO B ---
    if (error.message.includes("404") || error.message.includes("429")) {
        try {
            console.log("--> Plano B: gemini-1.5-flash...");
            const modelB = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });
            
            const resultB = await modelB.generateContent([
                "Analisa comida. JSON: {nome, calorias, proteina, gordura, hidratos, peso_estimado}",
                { inlineData: { data: imagemLimpa, mimeType: "image/jpeg" } }
            ]);
            
            const textB = resultB.response.text();
            return { data: JSON.parse(textB) };
            
        } catch (errorB: any) {
            return { error: "Erro final: " + errorB.message };
        }
    }

    return { error: "Erro de leitura: " + error.message };
  }
}