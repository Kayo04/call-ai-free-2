import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Erro auth" }, { status: 401 });

    const data = await req.json();

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) return NextResponse.json({ message: "Utilizador não encontrado" }, { status: 404 });

    // --- CORREÇÃO DE SEGURANÇA ---
    // Se o user for antigo e não tiver dailyLog, inicializa-o agora para não dar erro
    if (!user.dailyLog) {
      user.dailyLog = {
        date: new Date(),
        calories: 0, protein: 0, carbs: 0, fat: 0,
        fiber: 0, sugar: 0, sodium: 0
      };
    }
    // -----------------------------

    const lastLogDate = new Date(user.dailyLog.date || Date.now());
    const today = new Date();
    
    // Verifica se é o mesmo dia (ignora horas)
    const isSameDay = lastLogDate.getDate() === today.getDate() && 
                      lastLogDate.getMonth() === today.getMonth() && 
                      lastLogDate.getFullYear() === today.getFullYear();

    if (!isSameDay) {
      // Arquivar dia anterior no histórico se tiver dados
      if (user.dailyLog.calories > 0) {
        const goal = user.goals?.calories || 2000;
        const metGoal = user.dailyLog.calories >= (goal * 0.9) && user.dailyLog.calories <= (goal * 1.1);
        
        user.history.push({
            date: lastLogDate,
            calories: user.dailyLog.calories,
            protein: user.dailyLog.protein,
            carbs: user.dailyLog.carbs,
            fat: user.dailyLog.fat,
            metGoal: metGoal
        });
        
        // Limita histórico a 60 dias
        if (user.history.length > 60) user.history.shift();
      }
      
      // Reseta para o novo dia com a refeição atual
      user.dailyLog = { ...data, date: today };
    } else {
      // Soma à refeição de hoje
      user.dailyLog.calories = (user.dailyLog.calories || 0) + (data.calories || 0);
      user.dailyLog.protein = (user.dailyLog.protein || 0) + (data.protein || 0);
      user.dailyLog.carbs = (user.dailyLog.carbs || 0) + (data.carbs || 0);
      user.dailyLog.fat = (user.dailyLog.fat || 0) + (data.fat || 0);
      
      // Micros opcionais
      user.dailyLog.fiber = (user.dailyLog.fiber || 0) + (data.fiber || 0);
      user.dailyLog.sugar = (user.dailyLog.sugar || 0) + (data.sugar || 0);
      user.dailyLog.sodium = (user.dailyLog.sodium || 0) + (data.sodium || 0);
      
      user.dailyLog.date = today;
    }

    await user.save();
    return NextResponse.json({ message: "Adicionado!", dailyLog: user.dailyLog });

  } catch (error) {
    console.error("Erro ao adicionar refeição:", error); // Isto ajuda a ver o erro no terminal
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}