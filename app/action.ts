'use server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analisarImagemAction(base64Image: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return { error: "Erro: API Key não encontrada." };

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const imagemLimpa = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    // Usamos o flash-latest para aguentar os teus amigos todos sem bloquear
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest", 
      generationConfig: { responseMimeType: "application/json" }
    });

    // 🔥 O SEGREDO ESTÁ AQUI: O PROMPT RIGOROSO 🔥
    const prompt = `Analisa esta comida como um nutricionista profissional e rigoroso.
    SEJA EXTREMAMENTE ESPECÍFICO. Não sejas genérico.

    REGRAS:
    1. Nome: Se for fruta, diz a cor/tipo (ex: "Maçã Verde Granny Smith" e não apenas "Maçã").
    2. Descrição: Se for um prato misturado (ex: Bacalhau à Brás), tens de separar os ingredientes principais e estimar o peso de cada um (ex: "Composto por ~100g de bacalhau, ~50g de batata palha, ~30g de cebola e ovo").

    Responde APENAS com este JSON:
    {
      "nome": "Nome Muito Específico",
      "descricao": "Lista detalhada dos ingredientes e seus pesos estimados",
      "calorias": 0, // Valor numérico total
      "proteina": 0, // Valor numérico total
      "gordura": 0, // Valor numérico total
      "hidratos": 0, // Valor numérico total
      "peso_estimado": "Peso total do prato (ex: 350g)"
    }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imagemLimpa, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    let text = response.text();
    
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return { data: JSON.parse(text) };

  } catch (error: any) {
    console.error("Erro AI:", error.message);
    
    if (error.message.includes("429") || error.message.includes("Quota")) {
        return { error: "⚠️ Muita gente a usar! Espera 10 segundos." };
    }
    
    return { error: "Erro: " + error.message };
  }
}