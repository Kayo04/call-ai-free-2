'use client';

import { useState, useEffect } from 'react';
import { Camera, CameraResultType } from '@capacitor/camera';
import { signOut, useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { analisarImagemAction } from '@/app/action';

// Lista de Nutrientes Disponíveis
const AVAILABLE_NUTRIENTS = [
    { key: 'fiber', label: 'Fibra', unit: 'g' },
    { key: 'sugar', label: 'Açúcar', unit: 'g' },
    { key: 'sodium', label: 'Sódio', unit: 'mg' },
    { key: 'cholesterol', label: 'Colesterol', unit: 'mg' },
    { key: 'potassium', label: 'Potássio', unit: 'mg' },
    { key: 'calcium', label: 'Cálcio', unit: 'mg' },
    { key: 'iron', label: 'Ferro', unit: 'mg' },
    { key: 'vitC', label: 'Vitamina C', unit: 'mg' },
    { key: 'vitD', label: 'Vitamina D', unit: 'iu' },
];

export default function Home() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [imagem, setImagem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [addStatus, setAddStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  
  // ESTADOS LOCAIS PARA ATUALIZAÇÃO IMEDIATA
  const [tempGoals, setTempGoals] = useState<any>({});
  const [dailyLog, setDailyLog] = useState<any>({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Sincronizar com a sessão quando a página carrega
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // @ts-ignore
      if (session.user.onboardingCompleted === false) router.push('/onboarding');
      // @ts-ignore
      if (session.user.goals) setTempGoals(session.user.goals);
      // @ts-ignore
      if (session.user.dailyLog) setDailyLog(session.user.dailyLog);
    }
  }, [session, status, router]);

  useEffect(() => {
    import('@ionic/pwa-elements/loader').then(loader => { loader.defineCustomElements(window); });
  }, []);

  const tirarFoto = async () => {
    try {
      const photo = await Camera.getPhoto({ quality: 50, width: 600, resultType: CameraResultType.Base64 });
      if (photo.base64String) {
        setImagem(`data:image/jpeg;base64,${photo.base64String}`);
        processar(`data:image/jpeg;base64,${photo.base64String}`);
      }
    } catch (e) { console.log("Cancelado"); }
  };

  const processar = async (base64: string) => {
    setLoading(true); setDados(null); setAddStatus('idle');
    try {
      const res = await analisarImagemAction(base64);
      if (res.error) alert(res.error); else setDados(res.data);
    } catch (e) { alert("Erro na análise."); } finally { setLoading(false); }
  };

  const adicionarAoDiario = async () => {
    if (!dados) return;
    setAddStatus('loading');
    try {
      const payload: any = {
          calories: dados.calorias, protein: dados.proteina, carbs: dados.hidratos, fat: dados.gordura,
          fiber: dados.fibra, sugar: dados.acucar, sodium: dados.sodio, cholesterol: dados.colesterol
      };
      
      const res = await fetch('/api/user/add-meal', { method: 'POST', body: JSON.stringify(payload) });
      const json = await res.json();
      
      if (res.ok) {
        // Atualiza a sessão e o estado local IMEDIATAMENTE
        await update({ dailyLog: json.dailyLog });
        setDailyLog(json.dailyLog); // <-- Força a atualização visual aqui
        setAddStatus('success');
        
        setTimeout(() => { 
            setImagem(null); 
            setDados(null); 
            setAddStatus('idle'); 
        }, 1500);
      } else {
        throw new Error("Falha no servidor");
      }
    } catch (e) { 
        setAddStatus('idle'); 
        alert("Erro ao guardar. Tenta novamente."); 
    }
  };

  const toggleNutrient = async (key: string) => {
      const currentVal = tempGoals[key] || 0;
      const newVal = currentVal > 0 ? 0 : 100;
      const updated = { ...tempGoals, [key]: newVal };
      setTempGoals(updated);
      await fetch('/api/user/update-goals', { method: 'POST', body: JSON.stringify({ [key]: newVal }) });
      await update({ goals: updated });
  };

  // CÁLCULOS VISUAIS
  // @ts-ignore
  const goals = session?.user?.goals || {};
  
  // Usamos o dailyLog do estado local para ser instantâneo
  const currentCalories = dailyLog.calories || 0;
  const goalCalories = goals.calories || 2000;
  
  const remaining = {
    calories: Math.max(0, goalCalories - currentCalories),
    protein: Math.max(0, (goals.protein || 0) - (dailyLog.protein || 0)),
    carbs: Math.max(0, (goals.carbs || 0) - (dailyLog.carbs || 0)),
    fat: Math.max(0, (goals.fat || 0) - (dailyLog.fat || 0)),
  };

  const progressPct = goalCalories > 0 ? Math.min(100, (currentCalories / goalCalories) * 100) : 0;
  
  const activeExtras = AVAILABLE_NUTRIENTS.filter(n => (goals[n.key] || 0) > 0);

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-gray-900 font-sans pb-32 relative overflow-hidden">
      
      {/* SETTINGS DRAWER */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
          <div className="relative w-[85%] max-w-sm h-full bg-white shadow-2xl p-6 flex flex-col animate-slide-left overflow-y-auto">
            <div className="flex justify-between mb-8"><h2 className="text-2xl font-black">Definições</h2><button onClick={() => setShowSettings(false)}>✕</button></div>
            
            <div className="mb-8">
                <h3 className="font-bold text-gray-400 text-xs uppercase mb-4">Monitorização</h3>
                <div className="space-y-2">
                    {AVAILABLE_NUTRIENTS.map((item) => {
                        const isActive = (tempGoals[item.key] || 0) > 0;
                        return (
                            <button key={item.key} onClick={() => toggleNutrient(item.key)} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isActive ? 'border-black bg-gray-50' : 'border-gray-100'}`}>
                                <span className="font-bold">{item.label}</span>
                                {isActive && <span className="text-green-500 font-black">✓</span>}
                            </button>
                        )
                    })}
                </div>
            </div>
            <div className="mt-auto space-y-3">
              <button onClick={() => router.push('/onboarding')} className="w-full p-4 bg-gray-50 font-bold rounded-xl text-left">✏️ Recalcular Macros</button>
              <button onClick={() => signOut()} className="w-full p-4 bg-red-50 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2"><LogOutIcon className="w-5 h-5"/> Sair</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="fixed top-0 w-full bg-white/85 backdrop-blur-xl z-20 px-6 py-4 border-b border-gray-200/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-lg shadow-sm">🍎</div>
            <h1 className="text-lg font-black tracking-tight">NutriScan</h1>
        </div>
        <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
           {session?.user?.image ? (<img src={session.user.image} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex items-center justify-center">👤</div>)}
        </button>
      </header>

      <main className="pt-24 px-6 flex flex-col items-center w-full max-w-md mx-auto">
        
        {/* BOTÃO PARA O HISTÓRICO */}
        <button onClick={() => router.push('/history')} className="w-full mb-6 bg-white p-4 rounded-[1.5rem] shadow-sm flex items-center justify-between group active:scale-95 transition-transform">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-xl">🗓️</div>
                <div className="text-left">
                    <p className="font-bold text-sm">Ver Histórico</p>
                    <p className="text-xs text-gray-400">Consulta os dias anteriores</p>
                </div>
            </div>
            <span className="text-gray-300 group-hover:text-black transition-colors">→</span>
        </button>

        {/* --- CARTÃO PRETO (Com Visualização de Progresso Clara) --- */}
        {goalCalories > 0 && (
          <div className="w-full bg-black text-white p-6 rounded-[2rem] shadow-xl shadow-black/10 mb-8 relative overflow-hidden">
            
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        {remaining.calories === 0 ? "OBJETIVO CUMPRIDO" : "RESTAM HOJE"}
                    </p>
                    <h2 className="text-5xl font-black tracking-tighter">
                        {remaining.calories} <span className="text-xl text-gray-500 font-bold">kcal</span>
                    </h2>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl animate-pulse">
                    {remaining.calories === 0 ? "🎉" : "🔥"}
                </div>
            </div>

            {/* BARRA DE PROGRESSO VISUAL */}
            <div className="w-full h-3 bg-gray-800 rounded-full mb-2 relative z-10 overflow-hidden">
                <div 
                    className="h-full bg-green-500 transition-all duration-700 ease-out" 
                    style={{ width: `${progressPct}%` }}
                ></div>
            </div>
            
            {/* TEXTO DE ESTADO (Para saberes que contou) */}
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-6 relative z-10">
                <span>{currentCalories} ingeridas</span>
                <span>Meta: {goalCalories}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-2 relative z-10">
                <MiniMacro label="Prot" val={remaining.protein} />
                <MiniMacro label="Carb" val={remaining.carbs} />
                <MiniMacro label="Gord" val={remaining.fat} />
            </div>

            {activeExtras.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 relative z-10">
                    {activeExtras.map(ex => (
                        <MiniMacro key={ex.key} label={ex.label} val={Math.max(0, (goals[ex.key] || 0) - (dailyLog[ex.key] || 0))} unit={ex.unit} />
                    ))}
                </div>
            )}
          </div>
        )}

        {/* CÂMARA */}
        <div className="relative w-full aspect-square bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-white mb-6">
          {imagem ? (<img src={imagem} className="w-full h-full object-cover" />) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300">
              <CameraIcon className="w-16 h-16 opacity-20 mb-4" />
              <p className="font-bold text-gray-400 text-sm">Fotografa a tua refeição</p>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-20">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="font-bold tracking-widest text-xs uppercase animate-pulse">Analisando...</p>
            </div>
          )}
        </div>

        {/* RESULTADOS + NOVO BOTÃO DE ADICIONAR */}
        {dados && (
          <div className="w-full animate-slide-up pb-32">
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 mb-4">
                <h2 className="text-2xl font-black">{dados.nome}</h2>
                <p className="text-gray-500 text-sm mt-1">{dados.descricao}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <MacroCard icon="🔥" label="Calorias" val={dados.calorias} unit="kcal" />
              <MacroCard icon="🥩" label="Proteína" val={dados.proteina} unit="g" />
              <MacroCard icon="🌾" label="Carbs" val={dados.hidratos} unit="g" />
              <MacroCard icon="🥑" label="Gordura" val={dados.gordura} unit="g" />
            </div>

            <button 
              onClick={adicionarAoDiario}
              disabled={addStatus !== 'idle'}
              className={`w-full py-5 rounded-[1.5rem] font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 ${
                  addStatus === 'success' ? 'bg-green-500 text-white scale-105' : 'bg-black text-white hover:bg-gray-900'
              }`}
            >
              {addStatus === 'idle' && <><span>Adicionar</span> <span className="text-xl font-light">|</span> <span className="text-xl">+{dados.calorias} kcal</span></>}
              {addStatus === 'loading' && <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {addStatus === 'success' && <><span>Registado!</span> <span className="text-2xl">✅</span></>}
            </button>
          </div>
        )}
      </main>
      
      {!dados && (
        <div className="fixed bottom-8 left-0 w-full flex justify-center z-30 pointer-events-none">
            <button onClick={tirarFoto} className="pointer-events-auto bg-black text-white h-16 px-8 rounded-full shadow-2xl flex items-center gap-3 font-bold text-lg active:scale-95 transition-transform">
                <CameraIcon className="w-6 h-6" /> <span>Escanear</span>
            </button>
        </div>
      )}
    </div>
  );
}

// COMPONENTES MINI (Para o cartão preto)
function MiniMacro({ label, val, unit = "g" }: any) {
    return (
        <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
            <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">{label}</p>
            <p className="text-sm font-bold">{Math.round(val)}{unit}</p>
        </div>
    )
}

function MacroCard({ icon, label, val, unit }: any) {
    return (
        <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 flex flex-col items-start">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">{label}</p>
            <p className="text-xl font-black">{val}{unit}</p>
        </div>
    )
}

const CameraIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>);
const LogOutIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);