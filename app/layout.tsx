import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; // 👈 IMPORTANTE: Importar o ficheiro novo

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NutriScan",
  description: "Análise nutricional inteligente",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NutriScan",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/Musab.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        {/* 👇 AQUI ESTÁ A MUDANÇA: Envolvemos tudo com <Providers> */}
        <Providers>
          {children}
        </Providers>

        {/* Script do Service Worker (Mantém igual) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js').then(
                    function(registration) {
                      console.log('SW registado:', registration.scope);
                    },
                    function(err) {
                      console.log('SW falhou:', err);
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