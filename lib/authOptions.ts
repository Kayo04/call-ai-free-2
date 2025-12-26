// lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Dados inválidos");
        }
        await connectDB();
        const user = await User.findOne({ email: credentials.email }).select("+password");
        if (!user || !user.password) throw new Error("Email ou password errados");
        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) throw new Error("Password errada");
        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  // ... (início do ficheiro igual)

  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        // @ts-ignore
        session.user.id = token.sub;
        // @ts-ignore
        session.user.onboardingCompleted = token.onboardingCompleted; 
      }
      return session;
    },
    
    // 👇 AQUI É A MUDANÇA IMPORTANTE
    async jwt({ token, user, trigger, session }) {
      // 1. No Login inicial
      if (user) {
        // @ts-ignore
        token.onboardingCompleted = user.onboardingCompleted;
      }

      // 2. Quando chamamos update() no frontend
      if (trigger === "update" && session?.onboardingCompleted) {
        token.onboardingCompleted = session.onboardingCompleted;
      }

      return token;
    },
  },
  
// ... (resto do ficheiro igual)
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};