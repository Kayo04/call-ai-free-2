'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [variant, setVariant] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [data, setData] = useState({ name: '', email: '', password: '' });

  const toggleVariant = () => {
    setVariant(variant === 'LOGIN' ? 'REGISTER' : 'LOGIN');
    setError('');
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    signIn("google", { callbackUrl: "/" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (variant === 'REGISTER') {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message);
      }

      const res = await signIn('credentials', {
        ...data,
        redirect: false,
      });

      if (res?.error) throw new Error("Dados incorretos.");
      router.push('/');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden font-sans">
      
      {/* Círculo decorativo de fundo (subtil em dark mode) */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-zinc-900 rounded-full blur-3xl -z-10 opacity-40"></div>

      {/* 1. LOGÓTIPO & TÍTULO */}
      <div className="w-full max-w-sm flex flex-col items-center mb-10">
        <div className="w-24 h-24 bg-zinc-900 rounded-[2rem] shadow-xl border border-zinc-800 flex items-center justify-center mb-6 transform hover:scale-105 transition-transform duration-300">
          <span className="text-5xl drop-shadow-md">🍎</span>
        </div>
        
        <h1 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">
          {variant === 'LOGIN' ? 'Bem-vindo de volta' : 'Criar Conta'}
        </h1>
        <p className="text-zinc-500 font-medium text-center">
          A tua nutricionista de bolso com IA.
        </p>
      </div>

      {/* 2. BOTÃO GOOGLE (BRANCO PARA CONTRASTE) */}
      <div className="w-full max-w-sm animate-fade-in-up">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black h-16 rounded-[1.5rem] font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-gray-200 mb-8"
        >
          {/* Ícone G Preto */}
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="black"><path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S14.8 2 12.2 2C6.45 2 2 6.5 2 12s4.45 10 10 10c5.1 0 8.76-3.5 8.76-8.77 0-.58-.04-1.1-.11-1.13z"/></svg>
          Entrar com Google
        </button>

        {/* Separador Elegante */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-zinc-800 flex-1"></div>
          <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">ou email</span>
          <div className="h-px bg-zinc-800 flex-1"></div>
        </div>

        {/* 3. FORMULÁRIO (Clean & Dark) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {error && (
            <div className="bg-red-900/30 border border-red-900 text-red-400 text-sm p-4 rounded-2xl text-center font-bold animate-pulse">
              {error}
            </div>
          )}

          {variant === 'REGISTER' && (
            <div className="space-y-1.5 animate-slide-down">
              <label className="text-xs font-bold text-zinc-500 ml-4 uppercase tracking-wider">Nome</label>
              <input 
                type="text" 
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-[1.2rem] h-14 px-5 text-white font-medium placeholder:text-zinc-600 focus:ring-2 focus:ring-white/20 outline-none transition-all"
                placeholder="Luis"
                value={data.name}
                onChange={e => setData({...data, name: e.target.value})}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 ml-4 uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-[1.2rem] h-14 px-5 text-white font-medium placeholder:text-zinc-600 focus:ring-2 focus:ring-white/20 outline-none transition-all"
              placeholder="exemplo@mail.com"
              value={data.email}
              onChange={e => setData({...data, email: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 ml-4 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-[1.2rem] h-14 px-5 text-white font-medium placeholder:text-zinc-600 focus:ring-2 focus:ring-white/20 outline-none transition-all"
              placeholder="••••••••"
              value={data.password}
              onChange={e => setData({...data, password: e.target.value})}
            />
          </div>

          {/* Botão de Submeter (Discreto mas clicável) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-zinc-900 border-2 border-zinc-800 text-white h-14 rounded-[1.2rem] font-bold text-lg hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center"
          >
            {loading ? (
              <span className="animate-pulse text-zinc-500">A processar...</span>
            ) : (
              variant === 'LOGIN' ? 'Continuar' : 'Registar'
            )}
          </button>
        </form>

        {/* 4. TOGGLE (Rodapé) */}
        <div className="mt-10 text-center">
          <p className="text-zinc-500 font-medium text-sm">
            {variant === 'LOGIN' ? 'Ainda não tens conta?' : 'Já tens conta criada?'}
            <button 
              onClick={toggleVariant}
              className="ml-2 text-white font-bold underline decoration-2 underline-offset-4 hover:opacity-70 transition-opacity"
            >
              {variant === 'LOGIN' ? 'Cria agora' : 'Entrar'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}