import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ Metadata da PWA (AGORA COM SUPORTE IPHONE)
export const metadata: Metadata = {
  title: "NutriScan",
  description: "Análise nutricional inteligente",
  manifest: "/manifest.json",
  // 👇 CONFIGURAÇÕES NOVAS PARA IPHONE
  appleWebApp: {
    capable: true, // Faz o site abrir como app (sem barras do Safari)
    statusBarStyle: "black-translucent", // Barra de topo transparente/preta
    title: "NutriScan",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/Musab.jpg", // 👈 O iPhone vai usar a tua foto como ícone!
  },
};

// ✅ Viewport (modo app nativa)
export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Impede o zoom com os dedos (parece mais app nativa)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        {/* ✅ Registo do Service Worker (Versão Final Limpa) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js').then(
                    function(registration) {
                      console.log('Service Worker registado:', registration.scope);
                    },
                    function(err) {
                      console.log('Falha SW:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}