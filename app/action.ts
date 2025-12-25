'use server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analisarImagemAction(base64Image: string) {
  // A TUA CHAVE (A que termina em ...LuCU)
  const apiKey = "AIzaSyBZmU7L6hXhQ9suH0yVh7O1P7i7IIYLuCU"; 

  if (!apiKey) return { error: "Chave API não configurada." };

  const genAI = new GoogleGenerativeAI(apiKey);
  const imagemLimpa = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

  try {
    console.log("--> A tentar com gemini-2.0-flash (Modo JSON)...");
    
    // ⚠️ MUDANÇA IMPORTANTE: Adicionei generationConfig para forçar JSON
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
    
    // Agora o texto vem limpo, é só fazer parse
    return { data: JSON.parse(text) };

  } catch (error: any) {
    console.error("ERRO PRIMÁRIO:", error.message);
    
    // --- PLANO B (Segurança) ---
    if (error.message.includes("404") || error.message.includes("429")) {
        try {
            console.log("--> Plano B: gemini-flash-latest...");
            const modelB = genAI.getGenerativeModel({ 
                model: "gemini-flash-latest",
                generationConfig: { responseMimeType: "application/json" }
            });
            
            const resultB = await modelB.generateContent([
                "Analisa esta imagem de comida. Devolve JSON: {nome, calorias, proteina, gordura, hidratos, peso_estimado}",
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