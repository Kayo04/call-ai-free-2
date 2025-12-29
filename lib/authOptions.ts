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
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        // @ts-ignore
        session.user.id = token.sub;
        // @ts-ignore
        session.user.onboardingCompleted = token.onboardingCompleted;
        // @ts-ignore
        session.user.goals = token.goals;
        // @ts-ignore
        session.user.dailyLog = token.dailyLog; // 👇 Passar o log diário
      }
      return session;
    },
    
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // @ts-ignore
        token.onboardingCompleted = user.onboardingCompleted;
        // @ts-ignore
        token.goals = user.goals;
        // @ts-ignore
        token.dailyLog = user.dailyLog;
      }

      if (!user && token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email }).lean();
        
        if (dbUser) {
           // @ts-ignore
           token.onboardingCompleted = dbUser.onboardingCompleted;
           // @ts-ignore
           token.goals = dbUser.goals;
           
           // 👇 Lógica inteligente: Se mudou o dia, reseta o contador no visual
           // @ts-ignore
           const logDate = new Date(dbUser.dailyLog?.date || 0);
           const today = new Date();
           const isSameDay = logDate.getDate() === today.getDate() && 
                             logDate.getMonth() === today.getMonth() && 
                             logDate.getFullYear() === today.getFullYear();
           
           // @ts-ignore
           token.dailyLog = isSameDay ? dbUser.dailyLog : { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }
      }

      if (trigger === "update" && session) {
        if (session.onboardingCompleted !== undefined) token.onboardingCompleted = session.onboardingCompleted;
        if (session.goals) token.goals = session.goals;
        if (session.dailyLog) token.dailyLog = session.dailyLog; // Atualiza log
      }

      return token;
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};  