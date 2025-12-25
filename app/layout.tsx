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

// ✅ Metadata da PWA
export const metadata: Metadata = {
  title: "NutriScan",
  description: "Análise nutricional inteligente",
  manifest: "/manifest.json",
};

// ✅ Viewport (modo app nativa)
export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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

        {/* ✅ Registo correto do Service Worker */}
        {/* ✅ Registo do Service Worker CORRIGIDO */}
{/* ✅ Registo do Service Worker CORRIGIDO */}
        {/* ✅ Registo do Service Worker (Versão Limpa) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js').then(
                    function(registration) {
                      console.log('Service Worker registado com sucesso:', registration.scope);
                    },
                    function(err) {
                      console.log('Falha ao registar Service Worker:', err);
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
