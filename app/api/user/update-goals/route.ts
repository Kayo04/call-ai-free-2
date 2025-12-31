import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Erro" }, { status: 401 });

    const newGoals = await req.json();

    await connectDB();
    const updateQuery: any = {};
    
    // Atualiza dinamicamente qualquer meta que envies
    for (const key in newGoals) {
        updateQuery[`goals.${key}`] = newGoals[key];
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateQuery },
      { new: true }
    );

    return NextResponse.json({ message: "Atualizado", goals: user.goals });

  } catch (error) {
    return NextResponse.json({ message: "Erro" }, { status: 500 });
  }
}