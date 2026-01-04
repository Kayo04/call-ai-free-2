'use server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analisarImagemAction(base64Image: string) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) return { error: "Erro: API Key não encontrada." };

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const imagemLimpa = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    // Usamos o modelo Flash (rápido), mas com instruções de leitura
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest", 
      generationConfig: { responseMimeType: "application/json" }
    });

    // 👇 PROMPT DE ALTA PRECISÃO PARA SUPLEMENTOS
    // ... dentro da função analisarImagemAction ...

    // 👇 MUDANÇA: "números (decimais permitidos)" em vez de "inteiros"
    const prompt = `
    Tu és um Nutricionista Perito com capacidades avançadas de leitura de rótulos (OCR).
    Analisa esta imagem.

    REGRAS DE OURO:
    1. **SUPLEMENTOS E EMBALAGENS:**
       - LÊ O TEXTO DA IMAGEM.
       - Se a embalagem diz "500mg", é 500.
       - Se vires "1.5mg de Zinco", PRESERVA O DECIMAL. Responde 1.5, não arredondes para 2.
       - Procura ativamente por: "Zinco", "Zinc", "Magnesium", "B12", etc.
    
    2. **COMIDA NO PRATO:**
       - Estima os valores nutricionais.

    Responde OBRIGATORIAMENTE com este JSON (números podem ter decimais, ex: 1.5):
    {
      "nome": "Nome Exato",
      "descricao": "Descrição curta",
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
    `;
// ...

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
    return { error: "Erro: " + error.message };
  }
}