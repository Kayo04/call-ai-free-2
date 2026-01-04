'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, CameraResultType } from '@capacitor/camera';
import { signOut, useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { analisarImagemAction } from '@/app/action';

// Configuração Visual dos Nutrientes
const NUTRIENT_CONFIG: any = {
    fiber: { label: 'Fibra', unit: 'g', daily: 30, icon: '🌾' },
    sugar: { label: 'Açúcar', unit: 'g', daily: 50, icon: '🍭' },
    sodium: { label: 'Sódio', unit: 'mg', daily: 2300, icon: '🧂' },
    cholesterol: { label: 'Colesterol', unit: 'mg', daily: 300, icon: '🥚' },
    potassium: { label: 'Potássio', unit: 'mg', daily: 3500, icon: '🍌' },
    calcium: { label: 'Cálcio', unit: 'mg', daily: 1000, icon: '🥛' },
    iron: { label: 'Ferro', unit: 'mg', daily: 14, icon: '🥩' },
    vitC: { label: 'Vitamina C', unit: 'mg', daily: 90, icon: '🍊' },
    vitD: { label: 'Vitamina D', unit: 'iu', daily: 600, icon: '☀️' },
    magnesium: { label: 'Magnésio', unit: 'mg', daily: 400, icon: '🥑' },
    zinc: { label: 'Zinco', unit: 'mg', daily: 11, icon: '🛡️' },
    omega3: { label: 'Ómega 3', unit: 'mg', daily: 1000, icon: '🐟' },
    vitB12: { label: 'Vit B12', unit: 'mcg', daily: 2.4, icon: '⚡' },
    vitB9: { label: 'Vit B9', unit: 'mcg', daily: 400, icon: '🥬' },
    selenium: { label: 'Selénio', unit: 'mcg', daily: 55, icon: '🌰' },
};

const formatVal = (val: number) => {
    if (!val) return 0;
    return val % 1 === 0 ? val : parseFloat(val.toFixed(1));
};

export default function Home() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [imagem, setImagem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [addStatus, setAddStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  
  const [tempGoals, setTempGoals] = useState<any>({});
  const [dailyLog, setDailyLog] = useState<any>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const hasChecked = useRef(false);

  useEffect(() => {
      if (status === 'authenticated' && session?.user) {
          // @ts-ignore
          if (session.user.onboardingCompleted === false) router.push('/onboarding');
          // @ts-ignore
          if (session.user.goals) setTempGoals(session.user.goals);
          // @ts-ignore
          if (session.user.dailyLog) setDailyLog(session.user.dailyLog);

          if (!hasChecked.current) {
              checkDayAndSync();
              hasChecked.current = true;
          }
      }
  }, [session, status, router]);

  const checkDayAndSync = async () => {
      try {
          const res = await fetch('/api/user/check-day');
          if (res.ok) {
              const json = await res.json();
              if (json.dailyLog) {
                  setDailyLog(json.dailyLog);
                  await update({ dailyLog: json.dailyLog }); 
              }
          }
      } catch (e) { console.error(e); }
  };

  useEffect(() => {
    import('@ionic/pwa-elements/loader').then(loader => { loader.defineCustomElements(window); });
  }, []);

  const tirarFoto = async () => {
    try {
      const photo = await Camera.getPhoto({ quality: 80, width: 800, resultType: CameraResultType.Base64 });
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
      const horaAtual = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      const payload: any = { ...dados, time: horaAtual };
      
      const res = await fetch('/api/user/add-meal', { method: 'POST', body: JSON.stringify(payload) });
      const json = await res.json();
      
      if (res.ok) {
        await update({ dailyLog: json.dailyLog });
        setDailyLog(json.dailyLog);
        setAddStatus('success');
        setTimeout(() => { setImagem(null); setDados(null); setAddStatus('idle'); }, 1500);
      } else { throw new Error("Falha"); }
    } catch (e) { setAddStatus('idle'); alert("Erro ao guardar."); }
  };

  const addNutrient = async (key: string) => {
      const estimated = NUTRIENT_CONFIG[key].daily;
      const updated = { ...tempGoals, [key]: estimated };
      setTempGoals(updated);
      setSearchTerm("");
      await fetch('/api/user/update-goals', { method: 'POST', body: JSON.stringify({ [key]: estimated }) });
      await update({ goals: updated });
  };

  const removeNutrient = async (key: string) => {
      const updated = { ...tempGoals, [key]: 0 };
      setTempGoals(updated);
      await fetch('/api/user/update-goals', { method: 'POST', body: JSON.stringify({ [key]: 0 }) });
      await update({ goals: updated });
  };

  const updateGoalValue = async (key: string, val: string) => {
      const num = Number(val);
      const updated = { ...tempGoals, [key]: num };
      setTempGoals(updated);
      await fetch('/api/user/update-goals', { method: 'POST', body: JSON.stringify({ [key]: num }) });
      await update({ goals: updated });
  }

  const activeKeys = Object.keys(NUTRIENT_CONFIG).filter(k => (tempGoals[k] || 0) > 0);
  const availableToAdd = Object.keys(NUTRIENT_CONFIG)
    .filter(k => (tempGoals[k] || 0) === 0)
    .filter(k => NUTRIENT_CONFIG[k].label.toLowerCase().includes(searchTerm.toLowerCase()));

  // @ts-ignore
  const goals = session?.user?.goals || {};
  const currentCalories = dailyLog.calories || 0;
  const goalCalories = goals.calories || 2000;
  const caloriesRemaining = goalCalories - currentCalories;
  const isCaloriesMet = caloriesRemaining <= 0;
  const progressPct = goalCalories > 0 ? Math.min(100, (currentCalories / goalCalories) * 100) : 0;
  const firstName = session?.user?.name?.split(' ')[0] || "Visitante";

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-32 relative overflow-hidden">
      
      {/* SETTINGS DRAWER */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
          <div className="relative w-[85%] max-w-sm h-full bg-zinc-900 shadow-2xl p-6 flex flex-col animate-slide-left overflow-y-auto border-l border-zinc-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white">Definições</h2>
                <button onClick={() => setShowSettings(false)} className="w-8 h-8 bg-zinc-800 rounded-full font-bold text-gray-300">✕</button>
            </div>
            
            <div className="mb-8">
                <h3 className="font-bold text-gray-400 text-xs uppercase mb-4">Nutrientes & Metas</h3>
                <div className="space-y-3 mb-6">
                    {activeKeys.map(key => (
                        <div key={key} className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-sm text-gray-200">{NUTRIENT_CONFIG[key].label}</p>
                                <p className="text-[10px] text-gray-400">Estimado: {NUTRIENT_CONFIG[key].daily}{NUTRIENT_CONFIG[key].unit}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={tempGoals[key]} 
                                    onChange={(e) => updateGoalValue(key, e.target.value)}
                                    className="w-16 p-1 text-center bg-zinc-900 text-white rounded-md border border-zinc-700 text-sm font-bold"
                                />
                                <span className="text-xs font-bold text-gray-400">{NUTRIENT_CONFIG[key].unit}</span>
                                <button onClick={() => removeNutrient(key)} className="ml-2 text-red-400 font-bold p-1">✕</button>
                            </div>
                        </div>
                    ))}
                </div>
                <h3 className="font-bold text-gray-400 text-xs uppercase mb-2">Adicionar Meta</h3>
                <input type="text" placeholder="Procurar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 bg-zinc-800 text-white rounded-xl mb-3 text-sm outline-none focus:ring-2 ring-white/10" />
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableToAdd.map(key => (
                        <button key={key} onClick={() => addNutrient(key)} className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors text-left">
                            <span className="font-bold text-sm text-gray-200">{NUTRIENT_CONFIG[key].label}</span>
                            <span className="text-xs bg-white text-black px-2 py-1 rounded-md font-bold">+ Adicionar</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="mt-auto space-y-3">
              <button onClick={() => router.push('/onboarding')} className="w-full p-4 bg-zinc-800 font-bold rounded-xl text-left text-white">✏️ Recalcular Macros</button>
              <button onClick={() => signOut()} className="w-full p-4 bg-red-900/20 text-red-500 font-bold rounded-xl flex items-center justify-center gap-2"><LogOutIcon className="w-5 h-5"/> Sair</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="fixed top-0 w-full bg-black/85 backdrop-blur-xl z-20 px-6 py-4 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-zinc-800">
                <img src="/icon-v2.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-white">NutriScan</h1>
        </div>
        <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700 shadow-sm active:scale-95 transition-transform">
           {session?.user?.image ? (<img src={session.user.image} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex items-center justify-center text-white">👤</div>)}
        </button>
      </header>

      <main className="pt-24 px-6 flex flex-col items-center w-full max-w-md mx-auto">
        <div className="w-full mb-4">
            <h1 className="text-3xl font-black text-white tracking-tight">Olá, <span className="text-gray-500">{firstName}</span> 👋</h1>
        </div>

        <button onClick={() => router.push('/history')} className="w-full mb-6 bg-zinc-900 p-4 rounded-[1.5rem] shadow-sm flex items-center justify-between group active:scale-95 transition-transform border border-zinc-800">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-xl">🗓️</div>
                <div className="text-left">
                    <p className="font-bold text-sm text-white">Ver Histórico</p>
                    <p className="text-xs text-gray-400">Consulta os dias anteriores</p>
                </div>
            </div>
            <span className="text-zinc-600 group-hover:text-white transition-colors">→</span>
        </button>

        {goalCalories > 0 && (
          <div className="w-full bg-zinc-900 text-white p-6 rounded-[2rem] shadow-xl shadow-black/50 mb-8 relative overflow-hidden border border-zinc-800">
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{isCaloriesMet ? "OBJETIVO SUPERADO" : "RESTAM HOJE"}</p>
                    <h2 className="text-5xl font-black tracking-tighter">{isCaloriesMet ? currentCalories : caloriesRemaining} <span className="text-xl text-gray-500 font-bold">kcal</span></h2>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl animate-pulse">{isCaloriesMet ? "🎉" : "🔥"}</div>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full mb-2 relative z-10 overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-700 ease-out" style={{ width: `${progressPct}%` }}></div>
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-6 relative z-10">
                <span>{currentCalories} ingeridas</span>
                <span>Meta: {goalCalories}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-2 relative z-10">
                <MiniMacro label="Prot" current={dailyLog.protein} goal={goals.protein} />
                <MiniMacro label="Carb" current={dailyLog.carbs} goal={goals.carbs} />
                <MiniMacro label="Gord" current={dailyLog.fat} goal={goals.fat} />
            </div>
            {activeKeys.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 relative z-10">
                    {activeKeys.map(key => (
                        <MiniMacro key={key} label={NUTRIENT_CONFIG[key].label} current={dailyLog[key]} goal={goals[key]} unit={NUTRIENT_CONFIG[key].unit} />
                    ))}
                </div>
            )}
          </div>
        )}

        <div className="relative w-full aspect-square bg-zinc-900 rounded-[2.5rem] shadow-sm overflow-hidden border border-zinc-800 mb-6">
          {imagem ? (
            <img src={imagem} className="w-full h-full object-contain" />
            ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-zinc-600">
              <CameraIcon className="w-16 h-16 opacity-20 mb-4" />
              <p className="font-bold text-zinc-500 text-sm">Fotografa a tua refeição</p>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-20">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="font-bold tracking-widest text-xs uppercase animate-pulse">Analisando...</p>
            </div>
          )}
        </div>

        {dados && (
          <div className="w-full animate-slide-up pb-32">
            <div className="bg-zinc-900 p-5 rounded-[2rem] shadow-sm border border-zinc-800 mb-4">
                <h2 className="text-2xl font-black text-white">{dados.nome}</h2>
                <p className="text-gray-500 text-sm mt-1">{dados.descricao}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* 👇 MUDANÇA: SÓ MOSTRA SE O VALOR FOR > 0 */}
              {dados.calorias > 0 && <MacroCard icon="🔥" label="Calorias" val={dados.calorias} unit="kcal" />}
              {dados.proteina > 0 && <MacroCard icon="🥩" label="Proteína" val={dados.proteina} unit="g" />}
              {dados.hidratos > 0 && <MacroCard icon="🌾" label="Carbs" val={dados.hidratos} unit="g" />}
              {dados.gordura > 0 && <MacroCard icon="🥑" label="Gordura" val={dados.gordura} unit="g" />}
              
              {activeKeys.map(key => {
                  let aiValue = 0;
                  if (key === 'fiber') aiValue = dados.fibra;
                  if (key === 'sugar') aiValue = dados.acucar;
                  if (key === 'sodium') aiValue = dados.sodio;
                  if (key === 'cholesterol') aiValue = dados.colesterol;
                  if (key === 'potassium') aiValue = dados.potassio;
                  if (key === 'calcium') aiValue = dados.calcio;
                  if (key === 'iron') aiValue = dados.ferro;
                  if (key === 'vitC') aiValue = dados.vitaminaC;
                  if (key === 'vitD') aiValue = dados.vitaminaD;
                  if (key === 'magnesium') aiValue = dados.magnesio;
                  if (key === 'zinc') aiValue = dados.zinco;
                  if (key === 'omega3') aiValue = dados.omega3;
                  if (key === 'vitB12') aiValue = dados.vitaminaB12;
                  if (key === 'vitB9') aiValue = dados.vitaminaB9;
                  if (key === 'selenium') aiValue = dados.selenio;

                  if (!aiValue || aiValue === 0) return null;

                  return (
                      <MacroCard 
                        key={key} 
                        icon={NUTRIENT_CONFIG[key].icon} 
                        label={NUTRIENT_CONFIG[key].label} 
                        val={aiValue || 0} 
                        unit={NUTRIENT_CONFIG[key].unit} 
                      />
                  );
              })}
            </div>

            <button 
              onClick={adicionarAoDiario}
              disabled={addStatus !== 'idle'}
              className={`w-full py-5 rounded-[1.5rem] font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 ${
                  addStatus === 'success' ? 'bg-green-500 text-white scale-105' : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {addStatus === 'idle' && <><span>Adicionar</span> <span className="text-xl font-light">|</span> <span className="text-xl">{dados.calorias > 0 ? `+${dados.calorias} kcal` : 'Confirmar'}</span></>}
              {addStatus === 'loading' && <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {addStatus === 'success' && <><span>Registado!</span> <span className="text-2xl">✅</span></>}
            </button>
          </div>
        )}
      </main>
      
      {!dados && (
        <div className="fixed bottom-8 left-0 w-full flex justify-center z-30 pointer-events-none">
            <button onClick={tirarFoto} className="pointer-events-auto bg-white text-black h-16 px-8 rounded-full shadow-2xl flex items-center gap-3 font-bold text-lg active:scale-95 transition-transform">
                <CameraIcon className="w-6 h-6" /> <span>Escanear</span>
            </button>
        </div>
      )}
    </div>
  );
}

function MiniMacro({ label, current = 0, goal = 0, unit = "g" }: any) {
    const safeGoal = goal || 1; 
    const pct = Math.min(100, (current / safeGoal) * 100);
    const isMet = current >= safeGoal;

    return (
        <div className="relative overflow-hidden bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col justify-between h-24 group hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-start">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isMet ? 'text-green-400' : 'text-gray-400'}`}>
                    {label}
                </p>
                {isMet && <span className="text-green-400 text-xs animate-pulse">✓</span>}
            </div>
            <div className="z-10 mt-1">
                <p className={`text-xl font-black leading-none ${isMet ? 'text-green-400' : 'text-white'}`}>
                    {formatVal(current)}
                    <span className="text-[10px] text-gray-500 font-bold ml-0.5">{unit}</span>
                </p>
                <p className="text-[9px] text-gray-500 font-medium mt-1">
                    Meta: {goal}{unit}
                </p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-800/50">
                <div className={`h-full transition-all duration-700 ease-out ${isMet ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

function MacroCard({ icon, label, val, unit }: any) {
    return (
        <div className="bg-zinc-900 p-4 rounded-[1.5rem] border border-zinc-800 flex flex-col items-start min-h-[100px] justify-center transition-colors">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{icon}</span>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{label}</p>
            </div>
            <p className="text-2xl font-black tracking-tight text-white">{formatVal(val)}{unit}</p>
        </div>
    )
}

const CameraIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>);
const LogOutIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);