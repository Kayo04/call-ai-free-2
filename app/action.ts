'use server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analisarImagemAction(base64Image: string) {
  // 1. Tenta ler a chave (seja GEMINI_API_KEY ou GOOGLE_API_KEY)
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ ERRO: Nenhuma API Key encontrada no .env.local");
    return { error: "Configuração em falta: API Key não encontrada." };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const imagemLimpa = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    // 👇 MUDANÇA CRÍTICA: Usar 'gemini-1.5-flash-latest' para evitar erro 404
    const model = genAI.getGenerativeModel({ 
       model: "gemini-flash-latest",       generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Analisa esta imagem de comida como um nutricionista rigoroso.
    Identifica o prato e estima os valores nutricionais totais.

    Se não for possível ver tudo, faz uma estimativa educada baseada em porções padrão.

    Responde OBRIGATORIAMENTE com este JSON (apenas números inteiros):
    {
      "nome": "Nome do Prato",
      "descricao": "Breve descrição dos ingredientes",
      "calorias": 0,
      "proteina": 0,
      "hidratos": 0,
      "gordura": 0,

      "fibra": 0,
      "acucar": 0,
      "sodio": 0,
      "colesterol": 0,
      "potassio": 0,
      "calcio": 0,
      "ferro": 0,
      "vitaminaC": 0,
      "vitaminaD": 0
    }
    
    Notas:
    - Sódio, Colesterol, Potássio, Cálcio, Ferro, VitC são em mg.
    - Vitamina D é em iu.
    - Açúcar e Fibra são em gramas.
    - Se for água ou zero, coloca 0.
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imagemLimpa, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Limpeza para garantir que o JSON vem limpo
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return { data: JSON.parse(text) };

  } catch (error: any) {
    console.error("Erro AI Detalhado:", error);
    
    // Ajuda a perceber o erro se acontecer de novo
    if (error.message.includes("404")) {
        return { error: "Erro de Modelo (404). Tenta reiniciar o servidor." };
    }
    if (error.message.includes("429")) {
        return { error: "Muitos pedidos. Tenta daqui a pouco." };
    }
    
    return { error: "Erro técnico: " + error.message };
  }
}