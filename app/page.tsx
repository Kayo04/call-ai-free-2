'use client';

import { useState, useEffect } from 'react';
import { Camera, CameraResultType } from '@capacitor/camera';
import { signOut, useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { analisarImagemAction } from '@/app/action';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [imagem, setImagem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Redirecionar se não fez onboarding
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // @ts-ignore
      if (session.user.onboardingCompleted === false) {
        router.push('/onboarding');
      }
    }
  }, [session, status, router]);

  // Carregar ícones da câmara
  useEffect(() => {
    import('@ionic/pwa-elements/loader').then(loader => {
      loader.defineCustomElements(window);
    });
  }, []);

  const tirarFoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 50, width: 600, allowEditing: false, resultType: CameraResultType.Base64
      });
      if (photo.base64String) {
        const base64 = `data:image/jpeg;base64,${photo.base64String}`;
        setImagem(base64);
        processar(base64); 
      }
    } catch (e) { console.log("Câmara cancelada"); }
  };

  const processar = async (base64: string) => {
    setLoading(true); setDados(null); 
    await new Promise(r => setTimeout(r, 500)); 
    try {
      const resultado = await analisarImagemAction(base64);
      if (resultado.error) alert("Erro: " + resultado.error);
      else setDados(resultado.data);
    } catch (error) { alert("Erro na análise."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-gray-900 font-sans pb-32 relative overflow-hidden">
      
      {/* MENU SETTINGS */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setShowSettings(false)}></div>
          <div className="relative w-[85%] max-w-sm h-full bg-white shadow-2xl p-6 flex flex-col animate-slide-left">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black tracking-tight">Definições</h2>
              <button onClick={() => setShowSettings(false)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 font-bold">✕</button>
            </div>
            <div className="flex flex-col items-center mb-8 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
              <div className="relative w-24 h-24 mb-4">
                <img src={session?.user?.image || "https://ui-avatars.com/api/?name=User&background=random"} className="w-full h-full rounded-full border-4 border-white shadow-sm object-cover"/>
              </div>
              <h3 className="text-xl font-black text-gray-900">{session?.user?.name || "Utilizador"}</h3>
              <p className="text-sm text-gray-500 font-medium">{session?.user?.email}</p>
            </div>
            <div className="space-y-3">
               <button onClick={() => router.push('/onboarding')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-gray-100 font-bold text-gray-700 hover:border-black hover:text-black transition-all">
                 <span className="text-xl">✏️</span> Editar as minhas Metas
               </button>
            </div>
            <div className="mt-auto">
              <button onClick={() => signOut()} className="w-full p-5 rounded-2xl bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                <LogOutIcon className="w-5 h-5"/> Terminar Sessão
              </button>
              <p className="text-center text-xs text-gray-300 mt-4 font-bold tracking-widest uppercase">NutriScan v1.0</p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="fixed top-0 w-full bg-white/85 backdrop-blur-xl z-20 px-6 py-4 border-b border-gray-200/50 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-lg shadow-sm">🍎</div>
          <h1 className="text-lg font-black tracking-tight text-gray-900">NutriScan</h1>
        </div>
        <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm active:scale-95 transition-transform">
           {session?.user?.image ? (
            <img src={session.user.image} alt="Perfil" className="w-full h-full object-cover"/>
          ) : (<div className="w-full h-full flex items-center justify-center text-gray-400">👤</div>)}
        </button>
      </header>

      <main className="pt-28 px-6 flex flex-col items-center w-full max-w-md mx-auto">
        
        {/* METAS DIÁRIAS (Preto) - SÓ APARECE SE HOUVER GOALS */}
        {/* @ts-ignore */}
        {session?.user?.goals && session.user.goals.calories > 0 && (
          <div className="w-full bg-black text-white p-6 rounded-[2rem] shadow-xl shadow-black/10 mb-8 animate-fade-in-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">META DIÁRIA</p>
                {/* @ts-ignore */}
                <h2 className="text-5xl font-black tracking-tighter">{session.user.goals.calories} <span className="text-xl text-gray-500 font-bold">kcal</span></h2>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl animate-pulse">🔥</div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Proteína</p>
                {/* @ts-ignore */}
                <p className="text-lg font-bold">{session.user.goals.protein}g</p>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Carbs</p>
                {/* @ts-ignore */}
                <p className="text-lg font-bold">{session.user.goals.carbs}g</p>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Gordura</p>
                {/* @ts-ignore */}
                <p className="text-lg font-bold">{session.user.goals.fat}g</p>
              </div>
            </div>
          </div>
        )}

        {/* CÂMARA */}
        <div className="relative w-full aspect-square bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-white mb-6">
          {imagem ? (
            <img src={imagem} className="w-full h-full object-cover" alt="Comida" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <CameraIcon className="w-8 h-8 opacity-30" />
              </div>
              <p className="font-bold text-gray-400 text-sm">Tira uma foto à tua refeição</p>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white z-20 animate-fade-in">
              <div className="w-12 h-12 border-[5px] border-white/20 border-t-white rounded-full animate-spin mb-5"></div>
              <p className="font-bold text-sm tracking-widest uppercase animate-pulse">A analisar...</p>
            </div>
          )}
        </div>

        {/* RESULTADOS */}
        {dados && (
          <div className="w-full animate-slide-up space-y-4 pb-20">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">DETETADO</p>
                   <h2 className="text-2xl font-black text-gray-900 leading-none">{dados.nome}</h2>
                </div>
                <span className="bg-black text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
                  {dados.peso_estimado || "1 porção"}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-50 mt-2">
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{dados.descricao}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MacroCard color="bg-orange-50 text-orange-600" icon={<FireIcon />} label="Calorias" value={dados.calorias} unit="kcal" />
              <MacroCard color="bg-blue-50 text-blue-600" icon={<MuscleIcon />} label="Proteína" value={dados.proteina} unit="g" />
              <MacroCard color="bg-green-50 text-green-600" icon={<WheatIcon />} label="Hidratos" value={dados.hidratos} unit="g" />
              <MacroCard color="bg-yellow-50 text-yellow-600" icon={<DropIcon />} label="Gordura" value={dados.gordura} unit="g" />
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-8 left-0 w-full flex justify-center z-30 px-6 pointer-events-none">
        <button onClick={tirarFoto} disabled={loading} className="pointer-events-auto w-full max-w-sm bg-black text-white h-16 rounded-[2rem] shadow-2xl shadow-black/20 flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-gray-900 disabled:opacity-80 disabled:scale-100">
          <CameraIcon className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight">{imagem ? 'Nova Foto' : 'Escanear'}</span>
        </button>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES E ÍCONES
function MacroCard({ color, icon, label, value, unit }: any) {
  return (
    <div className={`${color} p-5 rounded-[1.8rem] flex flex-col items-start transition-transform active:scale-95`}>
      <div className="mb-auto opacity-80 bg-white/50 p-2 rounded-xl">{icon}</div>
      <div className="mt-3">
        <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-0.5">
          <p className="text-2xl font-black tracking-tight">{value}</p>
          <span className="text-xs font-bold opacity-60">{unit}</span>
        </div>
      </div>
    </div>
  );
}

const CameraIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>);
const LogOutIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const FireIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.072-5.714-1-8.571C12.5 1.5 17 6.5 17 12a5 5 0 1 1-10 0c0-1 3-3 3-3"/><path d="M12 14v4"/><path d="M12 2v1"/></svg>);
const MuscleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-3 0-4-3-4-3s2-2 3-2 3 2 3 2-1 3-4 3Z"/><path d="M6 5c2-2 4 2 6 7 2-5 4-9 6-7s-5 8-6 12"/></svg>);
const WheatIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22 17 7"/><path d="M12 6a2 2 0 0 1 2 2"/><path d="M16.14 8.79a3 3 0 0 1 4.54 1.3"/><path d="M16 11a3 3 0 0 1 3 3"/></svg>);
const DropIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>);