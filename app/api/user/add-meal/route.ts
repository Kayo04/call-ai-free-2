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

    // Se não houver log de hoje, cria um
    if (!user.dailyLog) {
        user.dailyLog = { date: new Date(), meals: [], calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    // Criar o objeto da refeição com TUDO
    const newMeal = {
        name: data.name,
        calories: Number(data.calories) || 0,
        protein: Number(data.protein) || 0,
        carbs: Number(data.carbs) || 0,
        fat: Number(data.fat) || 0,
        
        // Novos Nutrientes
        fiber: Number(data.fiber) || 0,
        sugar: Number(data.sugar) || 0,
        sodium: Number(data.sodium) || 0,
        cholesterol: Number(data.cholesterol) || 0,
        potassium: Number(data.potassium) || 0,
        calcium: Number(data.calcium) || 0,
        iron: Number(data.iron) || 0,
        vitC: Number(data.vitC) || 0,
        vitD: Number(data.vitD) || 0,

        // Hora
        time: data.time || new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };

    // Adiciona à lista
    user.dailyLog.meals.push(newMeal);

    // Atualiza os totais do dia
    user.dailyLog.calories += newMeal.calories;
    user.dailyLog.protein += newMeal.protein;
    user.dailyLog.carbs += newMeal.carbs;
    user.dailyLog.fat += newMeal.fat;
    
    // Atualiza totais dos novos nutrientes (se tiveres campos para eles no dailyLog)
    if (newMeal.fiber) user.dailyLog.fiber = (user.dailyLog.fiber || 0) + newMeal.fiber;
    if (newMeal.sugar) user.dailyLog.sugar = (user.dailyLog.sugar || 0) + newMeal.sugar;
    if (newMeal.sodium) user.dailyLog.sodium = (user.dailyLog.sodium || 0) + newMeal.sodium;
    
    // Marca que o dailyLog foi modificado (importante para o Mongoose guardar arrays mistos)
    user.markModified('dailyLog');

    await user.save();

    return NextResponse.json({ message: "Refeição adicionada", dailyLog: user.dailyLog });

  } catch (error) {
    console.error("Erro ao adicionar refeição:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}