'use server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analisarImagemAction(base64Image: string) {
  // ... (Mantém a tua parte da API Key igualzinha como tens) ...
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return { error: "Erro: API Key não encontrada." };

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const imagemLimpa = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;

    // 👇 MANTÉM O TEU MODELO QUE GOSTAS (ex: gemini-1.5-flash-latest)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest", // <--- O TEU MODELO PREFERIDO FICA AQUI
      generationConfig: { responseMimeType: "application/json" }
    });

    // 👇 AQUI ESTÁ O SEGREDO: O PROMPT NOVO COM OS NUTRIENTES NOVOS
    const prompt = `
    Analisa esta imagem de comida.
    Responde OBRIGATORIAMENTE com este JSON (apenas números inteiros):
    {
      "nome": "Nome do Prato",
      "descricao": "Breve descrição",
      "calorias": 0,
      "proteina": 0, "hidratos": 0, "gordura": 0,
      "fibra": 0, "acucar": 0, "sodio": 0, "colesterol": 0, 
      "potassio": 0, "calcio": 0, "ferro": 0, "vitaminaC": 0, "vitaminaD": 0,
      "magnesio": 0, "zinco": 0, "omega3": 0, "vitaminaB12": 0, "vitaminaB9": 0, "selenio": 0
    }
    Notas de Unidades: 
    - Omega3, Sódio, Potássio, Cálcio, Ferro, VitC, Magnésio, Zinco em mg.
    - VitB12, VitB9, Selénio em mcg.
    - VitD em iu. 
    - Resto em g.
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imagemLimpa, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return { data: JSON.parse(text) };

  } catch (error: any) {
    // ... (Mantém o teu tratamento de erros) ...
    return { error: "Erro: " + error.message };
  }
}