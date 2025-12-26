import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login', // Dizemos ao NextAuth que a nossa página de login é esta
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };