import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; 
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const data = await req.json();
    const { age, weight, height, gender, activity, goal, targetWeight, targetDate, bodyFat } = data;

    // ---------------------------------------------------------
    // 1. TMB (Mifflin-St Jeor)
    // ---------------------------------------------------------
    let bmr = (10 * Number(weight)) + (6.25 * Number(height)) - (5 * Number(age));
    if (gender === 'male') bmr += 5;
    else bmr -= 161;

    // ---------------------------------------------------------
    // 2. TDEE
    // ---------------------------------------------------------
    const activityMultipliers: any = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725,
    };
    const tdee = bmr * (activityMultipliers[activity] || 1.2);

    // ---------------------------------------------------------
    // 3. LÓGICA "GREEK GOD" (Corrigida e Refinada)
    // ---------------------------------------------------------
    let finalCalories = tdee;
    let adjustedGoal = goal; 

    // --- REGRA DE OURO: DETEÇÃO DE FASE ---
    // Se tens > 15% de gordura, NÃO podes fazer Bulking. Ponto final.
    // Ignoramos se o user escolheu "Gain" ou "Maintain".
    // Forçamos "CUT" para limpar a cintura e mostrar os abdominais.
    if (bodyFat && Number(bodyFat) > 15) {
        adjustedGoal = 'cut_aesthetic'; 
    }

    // --- CÁLCULO DE CALORIAS ---
    
    if (adjustedGoal === 'cut_aesthetic') {
        // Défice Agressivo mas Seguro (-400 a -500 kcal)
        // Para ti: 2400 - 400 = 2000 kcal (O alvo perfeito)
        finalCalories = tdee - 400;
    } 
    else if (adjustedGoal === 'lose') {
        // Lógica normal de perda de peso (se BF < 15 mas quer perder mais)
        finalCalories = tdee - 500;
    }
    else if (adjustedGoal === 'recomp') {
        finalCalories = tdee - 200;
    }
    else if (adjustedGoal === 'gain') {
        // Só entra aqui se BF <= 15%. Lean Bulk controlado.
        finalCalories = tdee + 250; 
    }

    // Proteção mínima de segurança (nunca baixar de 1500 para homens)
    if (finalCalories < 1500 && gender === 'male') finalCalories = 1500;

    finalCalories = Math.round(finalCalories);

    // ---------------------------------------------------------
    // 4. MACROS (Matemática Fixa, não Percentagens)
    // ---------------------------------------------------------
    
    const weightNum = Number(weight);
    let proteinGrams = 0;
    let fatGrams = 0;
    let carbsGrams = 0;

    // A: PROTEÍNA (A prioridade)
    // Cut/Recomp: 2.3g a 2.5g por kg (Para segurar músculo no défice)
    // Bulk: 1.8g a 2.0g por kg
    let proteinMultiplier = 2.0;
    
    if (adjustedGoal === 'cut_aesthetic' || adjustedGoal === 'lose') {
        proteinMultiplier = 2.4; // Ex: 62kg * 2.4 = ~148g (Perfeito)
    } else if (adjustedGoal === 'recomp') {
        proteinMultiplier = 2.2;
    } else {
        proteinMultiplier = 1.8;
    }

    proteinGrams = Math.round(weightNum * proteinMultiplier);

    // B: GORDURA (O ajuste fino do teu amigo)
    // Em vez de dar percentagem livre (que dava 101g), fixamos gramas por corpo.
    // Cut: 0.9g a 1.0g por kg (Suficiente para hormonas, baixo para poupar kcal)
    // Bulk: 1.0g a 1.2g por kg
    let fatMultiplier = 1.0; 
    
    if (adjustedGoal === 'cut_aesthetic') {
        fatMultiplier = 0.9; // Ex: 62kg * 0.9 = ~56g (Muito melhor que 101g)
    }

    fatGrams = Math.round(weightNum * fatMultiplier);

    // C: HIDRATOS (O resto das calorias vai tudo para aqui para treinares bem)
    const caloriesUsed = (proteinGrams * 4) + (fatGrams * 9);
    const remainingCalories = finalCalories - caloriesUsed;
    
    // Garante que não dá negativo (matemática defensiva)
    carbsGrams = Math.max(0, Math.round(remainingCalories / 4));

    // ---------------------------------------------------------
    // 5. GRAVAR NA BD
    // ---------------------------------------------------------
    await connectDB();
    
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        onboardingCompleted: true,
        info: { age, weight, height, gender, activity, goal: adjustedGoal, targetWeight, targetDate, bodyFat }, 
        goals: { 
            calories: finalCalories, 
            protein: proteinGrams, 
            carbs: carbsGrams, 
            fat: fatGrams 
        }
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ 
      message: "Plano Estético Atualizado!", 
      adjustedGoal: adjustedGoal, 
      goals: { calories: finalCalories, protein: proteinGrams, carbs: carbsGrams, fat: fatGrams } 
    }, { status: 200 });

  } catch (error) {
    console.error("Erro no onboarding:", error);
    return NextResponse.json({ message: "Erro ao guardar." }, { status: 500 });
  }
}