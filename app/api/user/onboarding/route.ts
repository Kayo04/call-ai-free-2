import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; 
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "@/lib/authOptions"; // 👈 CORRIGIDO: Vem da lib agora

export async function POST(req: Request) {
  try {
    // Agora isto já funciona sem dar erro
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const data = await req.json();
    const { age, weight, height, gender, activity, goal, speed } = data;

    // --- A MATEMÁTICA (Mifflin-St Jeor) ---
    let bmr = (10 * Number(weight)) + (6.25 * Number(height)) - (5 * Number(age));
    
    if (gender === 'male') bmr += 5;
    else bmr -= 161;

    const activityMultipliers: any = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
    };
    
    let tdee = bmr * (activityMultipliers[activity] || 1.2);
    let calories = Math.round(tdee);
    
    if (goal === 'lose') calories -= (speed === 'fast' ? 500 : 250);
    else if (goal === 'gain') calories += (speed === 'fast' ? 500 : 250);

    const protein = Math.round((calories * 0.3) / 4);
    const carbs = Math.round((calories * 0.35) / 4);
    const fat = Math.round((calories * 0.35) / 9);

    await connectDB();
    
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        onboardingCompleted: true,
        info: { age, weight, height, gender, activity, goal },
        goals: { calories, protein, carbs, fat }
      }
    );

    return NextResponse.json({ message: "Sucesso!", goals: { calories } }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erro ao guardar." }, { status: 500 });
  }
}