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
    // 3. LÓGICA "GREEK GOD"
    // ---------------------------------------------------------
    let finalCalories = tdee;
    let adjustedGoal = goal; 

    // Se tens > 15% de gordura, força CUT ou RECOMP
    if (bodyFat && Number(bodyFat) > 15) {
        adjustedGoal = 'cut_aesthetic'; 
    }

    if (adjustedGoal === 'cut_aesthetic') {
        finalCalories = tdee - 400;
    } 
    else if (adjustedGoal === 'lose') {
        finalCalories = tdee - 500;
    }
    else if (adjustedGoal === 'recomp') {
        finalCalories = tdee - 200;
    }
    else if (adjustedGoal === 'gain') {
        finalCalories = tdee + 250; 
    }

    if (finalCalories < 1500 && gender === 'male') finalCalories = 1500;
    finalCalories = Math.round(finalCalories);

    // ---------------------------------------------------------
    // 4. MACROS
    // ---------------------------------------------------------
    const weightNum = Number(weight);
    let proteinGrams = 0;
    let fatGrams = 0;
    let carbsGrams = 0;

    let proteinMultiplier = 2.0;
    if (adjustedGoal === 'cut_aesthetic' || adjustedGoal === 'lose') {
        proteinMultiplier = 2.4; 
    } else if (adjustedGoal === 'recomp') {
        proteinMultiplier = 2.2;
    } else {
        proteinMultiplier = 1.8;
    }

    proteinGrams = Math.round(weightNum * proteinMultiplier);

    let fatMultiplier = 1.0; 
    if (adjustedGoal === 'cut_aesthetic') {
        fatMultiplier = 0.9;
    }
    fatGrams = Math.round(weightNum * fatMultiplier);

    const caloriesUsed = (proteinGrams * 4) + (fatGrams * 9);
    const remainingCalories = finalCalories - caloriesUsed;
    carbsGrams = Math.max(0, Math.round(remainingCalories / 4));

    // ---------------------------------------------------------
    // 5. GRAVAR NA BD (COM PROTEÇÃO DE DADOS)
    // ---------------------------------------------------------
    await connectDB();
    
    // 👇 PASSO DE SEGURANÇA: Buscar o utilizador primeiro
    const currentUser = await User.findOne({ email: session.user.email });
    
    // Recupera as metas que já existiam (Zinco, Magnésio, etc.)
    // Se não existir nada, cria objeto vazio.
    const existingGoals = currentUser?.goals ? JSON.parse(JSON.stringify(currentUser.goals)) : {};

    // Fundir as metas antigas com os novos cálculos
    const mergedGoals = {
        ...existingGoals, // Mantém o que já lá estava
        calories: finalCalories, // Atualiza só os macros principais
        protein: proteinGrams,
        carbs: carbsGrams,
        fat: fatGrams 
    };
    
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        onboardingCompleted: true,
        info: { age, weight, height, gender, activity, goal: adjustedGoal, targetWeight, targetDate, bodyFat }, 
        goals: mergedGoals // Gravamos o objeto fundido
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ 
      message: "Plano Atualizado (Nutrientes Mantidos)!", 
      adjustedGoal: adjustedGoal, 
      goals: mergedGoals 
    }, { status: 200 });

  } catch (error) {
    console.error("Erro no onboarding:", error);
    return NextResponse.json({ message: "Erro ao guardar." }, { status: 500 });
  }
}