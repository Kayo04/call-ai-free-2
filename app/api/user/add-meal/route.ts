import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Erro auth" }, { status: 401 });

    const { calories, protein, carbs, fat } = await req.json();

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    // Verificar se é um novo dia
    const lastLogDate = new Date(user.dailyLog?.date || 0);
    const today = new Date();
    const isSameDay = lastLogDate.getDate() === today.getDate() && 
                      lastLogDate.getMonth() === today.getMonth() && 
                      lastLogDate.getFullYear() === today.getFullYear();

    if (!isSameDay) {
      // Se for outro dia, reseta e começa com esta refeição
      user.dailyLog = {
        date: today,
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat)
      };
    } else {
      // Se for o mesmo dia, soma
      user.dailyLog.calories += Number(calories);
      user.dailyLog.protein += Number(protein);
      user.dailyLog.carbs += Number(carbs);
      user.dailyLog.fat += Number(fat);
      user.dailyLog.date = today; // Atualiza hora
    }

    await user.save();

    return NextResponse.json({ message: "Adicionado!", dailyLog: user.dailyLog });

  } catch (error) {
    return NextResponse.json({ message: "Erro ao adicionar" }, { status: 500 });
  }
}