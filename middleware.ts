import { withAuth } from "next-auth/middleware";

export default withAuth({
  // Redireciona para a página de login se não estiver autenticado
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // O Matcher diz ONDE é que a segurança deve atuar
  // Aqui dizemos: "Protege tudo, MENOS o login, a api, as imagens, o favicon e o manifesto"
  matcher: [
    "/((?!login|api|_next/static|_next/image|favicon.ico|manifest.json|Musab.jpg).*)",
  ],
};