import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Erro auth" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Se não tiver log, cria um vazio
    if (!user.dailyLog) user.dailyLog = { date: new Date(), meals: [], calories: 0 };

    const lastLogDate = new Date(user.dailyLog.date || Date.now());
    const today = new Date();
    
    // Verifica se é o mesmo dia
    const isSameDay = lastLogDate.getDate() === today.getDate() && 
                      lastLogDate.getMonth() === today.getMonth() && 
                      lastLogDate.getFullYear() === today.getFullYear();

    if (!isSameDay) {
      // 1. O DIA MUDOU! Arquivar dia anterior
      if (user.dailyLog.calories > 0) {
        const goal = user.goals?.calories || 2000;
        const metGoal = user.dailyLog.calories >= (goal * 0.9) && user.dailyLog.calories <= (goal * 1.1);
        
        user.history.push({
            date: lastLogDate,
            calories: user.dailyLog.calories,
            protein: user.dailyLog.protein,
            carbs: user.dailyLog.carbs,
            fat: user.dailyLog.fat,
            meals: user.dailyLog.meals,
            metGoal: metGoal
        });
        
        if (user.history.length > 60) user.history.shift();
      }
      
      // 2. Resetar para o novo dia (ZERAR TUDO)
      user.dailyLog = {
        date: today,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        meals: [] // Lista vazia para o novo dia
      };

      await user.save();
    }

    // Retorna o log (seja ele o antigo ou o novo a zeros)
    // O .toObject() é CRÍTICO para a lista de refeições funcionar no frontend
    return NextResponse.json({ dailyLog: user.dailyLog.toObject() });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}