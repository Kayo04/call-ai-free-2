'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    // Isto redireciona para a Google e depois volta para a Home
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      
      {/* Logótipo / Ícone */}
      <div className="mb-8 p-4 bg-gray-50 rounded-3xl shadow-sm border border-gray-100">
        <span className="text-6xl">🍎</span>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
          Bem-vindo ao NutriScan
        </h1>
        <p className="text-gray-500 font-medium">
          A tua nutricionista de bolso com IA.
        </p>
      </div>

      {/* Botão Google */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full max-w-xs bg-black text-white rounded-2xl py-4 font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95 hover:bg-gray-900"
      >
        {loading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            {/* Ícone simples da Google (G) */}
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
              <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S14.8 2 12.2 2C6.45 2 2 6.5 2 12s4.45 10 10 10c5.1 0 8.76-3.5 8.76-8.77 0-.58-.04-1.1-.11-1.13z"/>
            </svg>
            Entrar com Google
          </>
        )}
      </button>

      <p className="mt-8 text-xs text-center text-gray-400 max-w-[200px]">
        Ao continuares, aceitas tornar-te mais saudável. 🥦
      </p>
    </div>
  );
}