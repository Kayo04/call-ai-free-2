import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

    const data = await req.json();
    
    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) return NextResponse.json({ message: "Utilizador não encontrado" }, { status: 404 });

    // Garante que o dailyLog existe
    if (!user.dailyLog) {
        user.dailyLog = { date: new Date(), meals: [], calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    // 1. Criar a Refeição (Mapeando os nomes da IA para a BD)
    const newMeal = {
        name: data.name,
        calories: Number(data.calories) || 0,
        protein: Number(data.protein) || 0,
        carbs: Number(data.carbs) || 0,
        fat: Number(data.fat) || 0,
        
        // Nutrientes Clássicos
        fiber: Number(data.fiber) || 0,
        sugar: Number(data.sugar) || 0,
        sodium: Number(data.sodium) || 0,
        cholesterol: Number(data.cholesterol) || 0,
        potassium: Number(data.potassium) || 0,
        calcium: Number(data.calcium) || 0,
        iron: Number(data.iron) || 0,
        vitC: Number(data.vitC) || 0,
        vitD: Number(data.vitD) || 0,

        // 👇 NOVOS (Atenção: A IA manda 'magnesio'/'zinco', a BD guarda 'magnesium'/'zinc')
        magnesium: Number(data.magnesium) || 0,
        zinc: Number(data.zinc) || 0,
        omega3: Number(data.omega3) || 0,
        vitB12: Number(data.vitB12) || 0,
        vitB9: Number(data.vitB9) || 0,
        selenium: Number(data.selenium) || 0,

        time: data.time || new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };

    // Adiciona à lista de refeições
    user.dailyLog.meals.push(newMeal);

    // 2. SOMAR TUDO AO TOTAL DO DIA (Era aqui que faltava código!)
    user.dailyLog.calories += newMeal.calories;
    user.dailyLog.protein += newMeal.protein;
    user.dailyLog.carbs += newMeal.carbs;
    user.dailyLog.fat += newMeal.fat;
    
    // Somas dos Micros Antigos
    user.dailyLog.fiber = (user.dailyLog.fiber || 0) + newMeal.fiber;
    user.dailyLog.sugar = (user.dailyLog.sugar || 0) + newMeal.sugar;
    user.dailyLog.sodium = (user.dailyLog.sodium || 0) + newMeal.sodium;
    
    // 👇 SOMAS DOS NOVOS (Isto vai corrigir os zeros no histórico!)
    if (newMeal.magnesium) user.dailyLog.magnesium = (user.dailyLog.magnesium || 0) + newMeal.magnesium;
    if (newMeal.zinc) user.dailyLog.zinc = (user.dailyLog.zinc || 0) + newMeal.zinc;
    if (newMeal.omega3) user.dailyLog.omega3 = (user.dailyLog.omega3 || 0) + newMeal.omega3;
    if (newMeal.vitB12) user.dailyLog.vitB12 = (user.dailyLog.vitB12 || 0) + newMeal.vitB12;
    if (newMeal.vitB9) user.dailyLog.vitB9 = (user.dailyLog.vitB9 || 0) + newMeal.vitB9;
    if (newMeal.selenium) user.dailyLog.selenium = (user.dailyLog.selenium || 0) + newMeal.selenium;
    
    // Somas das Vitaminas
    if (newMeal.vitC) user.dailyLog.vitC = (user.dailyLog.vitC || 0) + newMeal.vitC;
    if (newMeal.vitD) user.dailyLog.vitD = (user.dailyLog.vitD || 0) + newMeal.vitD;
    
    user.markModified('dailyLog');
    await user.save();

    return NextResponse.json({ message: "Guardado com sucesso", dailyLog: user.dailyLog });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return NextResponse.json({ message: "Erro ao guardar" }, { status: 500 });
  }
}