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

    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Inicializar array se não existir
    if (!user.dailyLog) user.dailyLog = { date: new Date(), meals: [] };
    if (!user.dailyLog.meals) user.dailyLog.meals = [];

    const lastLogDate = new Date(user.dailyLog.date || Date.now());
    const today = new Date();
    
    const isSameDay = lastLogDate.getDate() === today.getDate() && 
                      lastLogDate.getMonth() === today.getMonth() && 
                      lastLogDate.getFullYear() === today.getFullYear();

    if (!isSameDay) {
      // 1. Arquivar dia anterior
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
      
      // 2. Novo Dia
      user.dailyLog = {
        date: today,
        calories: Number(data.calories),
        protein: Number(data.protein),
        carbs: Number(data.carbs),
        fat: Number(data.fat),
        fiber: Number(data.fiber || 0),
        sugar: Number(data.sugar || 0),
        sodium: Number(data.sodium || 0),
        meals: [{ 
            name: data.name || "Refeição",
            calories: Number(data.calories),
            protein: Number(data.protein),
            carbs: Number(data.carbs),
            fat: Number(data.fat)
        }]
      };

    } else {
      // 3. Mesmo Dia: Adicionar à lista
      user.dailyLog.calories = (user.dailyLog.calories || 0) + (data.calories || 0);
      user.dailyLog.protein = (user.dailyLog.protein || 0) + (data.protein || 0);
      user.dailyLog.carbs = (user.dailyLog.carbs || 0) + (data.carbs || 0);
      user.dailyLog.fat = (user.dailyLog.fat || 0) + (data.fat || 0);
      user.dailyLog.fiber = (user.dailyLog.fiber || 0) + (data.fiber || 0);
      user.dailyLog.sugar = (user.dailyLog.sugar || 0) + (data.sugar || 0);
      user.dailyLog.sodium = (user.dailyLog.sodium || 0) + (data.sodium || 0);
      user.dailyLog.date = today;

      user.dailyLog.meals.push({
          name: data.name || "Refeição",
          calories: Number(data.calories),
          protein: Number(data.protein),
          carbs: Number(data.carbs),
          fat: Number(data.fat)
      });
    }

    await user.save();

    // 👇👇👇 A CORREÇÃO ESTÁ AQUI EM BAIXO 👇👇👇
    // O .toObject() é obrigatório para a lista passar para o frontend!
    return NextResponse.json({ 
        message: "Adicionado!", 
        dailyLog: user.dailyLog.toObject() 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}