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
    const { age, weight, height, gender, activity, goal, targetWeight, targetDate } = data;

    // 1. TMB
    let bmr = (10 * Number(weight)) + (6.25 * Number(height)) - (5 * Number(age));
    if (gender === 'male') bmr += 5;
    else bmr -= 161;

    // 2. TDEE
    const activityMultipliers: any = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725,
    };
    const tdee = bmr * (activityMultipliers[activity] || 1.2);

    // 3. Cálculo da Dieta
    let dailyCalories = tdee;

    if (goal !== 'maintain' && targetWeight && targetDate) {
      const currentKg = Number(weight);
      const targetKg = Number(targetWeight);
      const weightDifference = Math.abs(currentKg - targetKg);
      const totalCaloriesToShift = weightDifference * 7700;

      const today = new Date();
      const target = new Date(targetDate);
      const diffTime = target.getTime() - today.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      if (days > 0) {
        const dailyDeficit = totalCaloriesToShift / days;
        const safeDeficit = Math.min(dailyDeficit, 1000); // Máximo 1000kcal de défice por segurança

        if (goal === 'lose') dailyCalories = tdee - safeDeficit;
        else dailyCalories = tdee + safeDeficit;
      }
    }

    const finalCalories = Math.round(dailyCalories);

    // 4. Macros (30/35/35)
    const protein = Math.round((finalCalories * 0.3) / 4);
    const carbs = Math.round((finalCalories * 0.35) / 4);
    const fat = Math.round((finalCalories * 0.35) / 9);

    // 5. GRAVAR NA BD
    await connectDB();
    
    // Atualiza e retorna o documento novo (new: true)
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        onboardingCompleted: true,
        info: { age, weight, height, gender, activity, goal, targetWeight, targetDate },
        goals: { calories: finalCalories, protein, carbs, fat }
      },
      { new: true, upsert: true } // Força a atualização
    );

    return NextResponse.json({ 
      message: "Sucesso!", 
      goals: { calories: finalCalories, protein, carbs, fat } 
    }, { status: 200 });

  } catch (error) {
    console.error("Erro no onboarding:", error);
    return NextResponse.json({ message: "Erro ao guardar." }, { status: 500 });
  }
}