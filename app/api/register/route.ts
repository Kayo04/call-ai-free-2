import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Faltam dados." }, { status: 400 });
    }

    await connectDB();

    // Verifica se já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json({ message: "Email já registado." }, { status: 400 });
    }

    // Encripta a password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o utilizador (com onboarding a false)
    await User.create({
      name,
      email,
      password: hashedPassword,
      onboardingCompleted: false, // Força a ir para as perguntas depois
    });

    return NextResponse.json({ message: "Criado com sucesso!" }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ message: "Erro no registo." }, { status: 500 });
  }
}