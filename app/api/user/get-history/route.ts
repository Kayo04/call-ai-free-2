import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "@/lib/authOptions"; // Ajusta o caminho se o teu authOptions estiver noutro lado

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ history: [] });

    await connectDB();
    // Vamos buscar APENAS o histórico deste utilizador
    const user = await User.findOne({ email: session.user.email }).select('history dailyLog');

    if (!user) return NextResponse.json({ history: [] });

    return NextResponse.json({ 
        history: user.history || [], 
        dailyLog: user.dailyLog 
    });

  } catch (error) {
    return NextResponse.json({ history: [] }, { status: 500 });
  }
}