'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// 👇 1. CONFIGURAÇÃO COM AS CORES DEFINIDAS
const NUTRIENT_CONFIG: any = {
    // Originais
    fiber: { label: 'Fibra', unit: 'g', color: 'teal' },
    sugar: { label: 'Açúcar', unit: 'g', color: 'pink' },
    sodium: { label: 'Sódio', unit: 'mg', color: 'slate' },
    cholesterol: { label: 'Colesterol', unit: 'mg', color: 'purple' },
    potassium: { label: 'Potássio', unit: 'mg', color: 'indigo' },
    calcium: { label: 'Cálcio', unit: 'mg', color: 'stone' },
    iron: { label: 'Ferro', unit: 'mg', color: 'red' },
    vitC: { label: 'Vit C', unit: 'mg', color: 'orange' },
    vitD: { label: 'Vit D', unit: 'iu', color: 'yellow' },
    
    // Novos
    magnesium: { label: 'Magnésio', unit: 'mg', color: 'emerald' },
    zinc: { label: 'Zinco', unit: 'mg', color: 'zinc' }, 
    omega3: { label: 'Ómega 3', unit: 'mg', color: 'cyan' },
    vitB12: { label: 'Vit B12', unit: 'mcg', color: 'blue' },
    vitB9: { label: 'Vit B9', unit: 'mcg', color: 'lime' },
    selenium: { label: 'Selénio', unit: 'mcg', color: 'rose' }
};

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [dailyLog, setDailyLog] = useState<any>({ calories: 0, meals: [] });
  
  // @ts-ignore
  const userGoals = session?.user?.goals || {};
  const goalCalories = userGoals.calories || 2000;

  useEffect(() => {
    // @ts-ignore
    if (session?.user) {
       // @ts-ignore
       setHistory(session.user.history || []);
       // @ts-ignore
       setDailyLog(session.user.dailyLog || { calories: 0, meals: [] });
       
       if (!selectedLog) {
           // @ts-ignore
           setSelectedLog(session.user.dailyLog || { calories: 0, date: new Date(), meals: [] });
       }
    }
  }, [session]);

  if (status === "loading") return <div className="min-h-screen bg-black text-white p-6 text-center pt-20">A carregar...</div>;
  
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = new Date();

  const changeMonth = (offset: number) => {
      const newDate = new Date(viewDate);
      newDate.setMonth(newDate.getMonth() + offset);
      setViewDate(newDate);
      setSelectedLog(null);
  };

  const getLogForDay = (day: number) => {
    const targetMonth = viewDate.getMonth();
    const targetYear = viewDate.getFullYear();

    const historyMatch = history.find((h: any) => {
      const d = new Date(h.date);
      return d.getDate() === day && d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });
    if (historyMatch) return historyMatch;

    const activeLogDate = new Date(dailyLog.date || 0);
    if (activeLogDate.getDate() === day && 
        activeLogDate.getMonth() === targetMonth && 
        activeLogDate.getFullYear() === targetYear) {
        return dailyLog;
    }
    return null;
  };

  const checkSuccess = (current: number, target: number) => {
      if (!target || target === 0) return false;
      return current >= (target * 0.95) && current <= (target * 1.05);
  };

  const successCount = daysArray.reduce((acc, day) => {
      const log = getLogForDay(day);
      if (!log) return acc;
      
      let isSuccess = false;
      if (log.metGoal !== undefined) {
          isSuccess = log.metGoal;
      } else if (log.calories > 0) {
          isSuccess = checkSuccess(log.calories, goalCalories);
      }
      return acc + (isSuccess ? 1 : 0);
  }, 0);

  // Filtra APENAS os nutrientes que tu ativaste nas definições
  const activeExtras = Object.keys(NUTRIENT_CONFIG).filter(key => (userGoals[key] || 0) > 0);

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 pb-32">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center font-bold active:scale-90 transition-transform text-white">←</button>
        <div className="flex flex-col items-center">
            <h1 className="text-xl font-black">Histórico</h1>
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{successCount}/{daysInMonth} DIAS COMPLETOS</span>
        </div>
        <div className="w-10"></div>
      </div>

      {/* CALENDÁRIO */}
      <div className="bg-zinc-900 rounded-[2.5rem] p-6 shadow-xl shadow-black/50 mb-8 border border-zinc-800">
        <div className="flex justify-between items-center mb-6 px-2">
            <button onClick={() => changeMonth(-1)} className="p-2 text-zinc-500 hover:text-white font-bold text-xl">❮</button>
            <h2 className="text-lg font-black capitalize">
                {viewDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => changeMonth(1)} className="p-2 text-zinc-500 hover:text-white font-bold text-xl">❯</button>
        </div>
        
        <div className="grid grid-cols-7 gap-3">
            {['D','S','T','Q','Q','S','S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-zinc-600 mb-1">{d}</div>
            ))}
            
            {daysArray.map(day => {
                const log = getLogForDay(day);
                const isToday = day === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
                const isSelected = selectedLog && new Date(selectedLog.date || new Date()).getDate() === day && viewDate.getMonth() === new Date(selectedLog.date).getMonth();

                let bg = "bg-zinc-800 text-zinc-500";
                
                if (log && log.calories > 0) {
                    const metGoal = log.metGoal !== undefined ? log.metGoal : checkSuccess(log.calories, goalCalories);
                    if (metGoal) {
                        bg = "bg-green-600 text-white shadow-md shadow-green-900/50";
                    } else {
                        bg = "bg-red-600 text-white shadow-md shadow-red-900/50";
                    }
                }

                if (isToday && !log) bg = "ring-2 ring-white text-white font-bold";
                if (isSelected) bg = "bg-white text-black scale-110 shadow-xl z-10 ring-4 ring-black";

                return (
                    <button 
                        key={day} 
                        onClick={() => setSelectedLog(log || { date: new Date(viewDate.getFullYear(), viewDate.getMonth(), day), calories: 0, meals: [] })}
                        className={`aspect-square rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${bg}`}
                    >
                        {day}
                    </button>
                )
            })}
        </div>
      </div>

      {selectedLog && (
          <div className="animate-slide-up space-y-4">
              
              <div className="px-4">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Resumo de</p>
                  <h2 className="text-3xl font-black capitalize text-white mt-1">
                    {new Date(selectedLog.date || new Date()).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric' })}
                  </h2>
              </div>

              {/* CARTÃO DE TOTAIS */}
              <div className="bg-zinc-900 p-6 rounded-[2rem] shadow-xl border border-zinc-800">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-6xl font-black tracking-tighter text-white">{Math.round(selectedLog.calories || 0)}</h3>
                        <span className="font-bold text-zinc-500 text-lg">kcal</span>
                    </div>
                    
                    {selectedLog.calories > 0 && (
                        <div className={`px-4 py-2 rounded-full text-xs font-bold text-white ${
                            (selectedLog.metGoal !== undefined ? selectedLog.metGoal : checkSuccess(selectedLog.calories, goalCalories)) 
                            ? "bg-green-600 shadow-lg shadow-green-900/20" 
                            : "bg-red-600 shadow-lg shadow-red-900/20"
                        }`}>
                            {(selectedLog.metGoal !== undefined ? selectedLog.metGoal : checkSuccess(selectedLog.calories, goalCalories)) ? "CUMPRIDO" : "FALHOU"}
                        </div>
                    )}
                  </div>

                  {/* GRID DE BARRAS DE PROGRESSO */}
                  <div className="grid grid-cols-3 gap-3">
                      {/* Macros Principais */}
                      <MacroBar label="Prot" val={selectedLog.protein} goal={userGoals.protein} />
                      <MacroBar label="Carb" val={selectedLog.carbs} goal={userGoals.carbs} />
                      <MacroBar label="Gord" val={selectedLog.fat} goal={userGoals.fat} />

                      {/* Micros e Extras */}
                      {activeExtras.map(key => (
                          <MacroBar 
                            key={key}
                            label={NUTRIENT_CONFIG[key].label} 
                            val={selectedLog[key]} 
                            unit={NUTRIENT_CONFIG[key].unit}
                            goal={userGoals[key]}
                          />
                      ))}
                  </div>
              </div>

              <h3 className="text-xs font-bold text-zinc-500 uppercase ml-4 mt-8 mb-3 tracking-wider">Refeições do dia</h3>
              
              {selectedLog.meals && selectedLog.meals.length > 0 ? (
                  <div className="space-y-3 pb-16 px-2">
                      {selectedLog.meals.slice().reverse().map((meal: any, idx: number) => (
                          <div key={idx} className="bg-zinc-900 p-5 rounded-[2rem] flex justify-between items-stretch shadow-md border border-zinc-800 relative overflow-hidden">
                              
                              <div className="flex-1 pr-4 flex flex-col justify-center">
                                  <div className="flex items-baseline gap-2 mb-3">
                                      <p className="font-black text-lg text-white leading-tight">{meal.name || "Refeição"}</p>
                                      {meal.time && <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{meal.time}</span>}
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    {Math.round(meal.protein) > 0 && <MacroTag label="PROT" val={meal.protein} color="blue" />}
                                    {Math.round(meal.carbs) > 0 && <MacroTag label="CARB" val={meal.carbs} color="green" />}
                                    {Math.round(meal.fat) > 0 && <MacroTag label="GORD" val={meal.fat} color="orange" />}

                                    {/* 👇 AQUI APLICAMOS AS CORES ESPECÍFICAS DE VOLTA */}
                                    {Object.keys(NUTRIENT_CONFIG).map(key => {
                                        if (['protein','carbs','fat'].includes(key)) return null;
                                        const val = meal[key];
                                        if (!val || val === 0) return null;
                                        
                                        // Passamos a cor definida no config (ex: 'pink', 'teal')
                                        return <MacroTag key={key} label={NUTRIENT_CONFIG[key].label} val={val} unit={NUTRIENT_CONFIG[key].unit} color={NUTRIENT_CONFIG[key].color} />
                                    })}
                                  </div>
                              </div>

                              <div className="flex flex-col items-end justify-center pl-5 border-l border-zinc-800">
                                  <span className="block font-black text-3xl text-white leading-none tracking-tight">{Math.round(meal.calories)}</span>
                                  <span className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-wider">kcal</span>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-12 mx-2 bg-zinc-900/50 rounded-[2rem] border-2 border-dashed border-zinc-800">
                        <p className="text-4xl mb-3 grayscale opacity-30">🥣</p>
                        <p className="text-zinc-500 text-sm font-bold">Nada registado.</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}

// BARRA DE PROGRESSO
function MacroBar({ label, val = 0, goal = 0, unit = "g" }: any) {
    const safeGoal = goal || 1;
    const pct = Math.min(100, (val / safeGoal) * 100);
    const isMet = val >= safeGoal;
    const missing = Math.max(0, safeGoal - val);

    return (
        <div className="relative overflow-hidden bg-black/20 border border-white/5 p-3 rounded-2xl flex flex-col justify-between h-24 group hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start mb-1">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isMet ? 'text-green-400' : 'text-zinc-400'}`}>
                    {label}
                </p>
                {isMet ? (
                    <span className="text-green-400 text-[10px]">★</span>
                ) : (
                    <span className="text-[9px] text-blue-400 font-medium">Faltam {Math.round(missing)}{unit}</span>
                )}
            </div>
            <div className="z-10">
                <p className={`text-xl font-black leading-none ${isMet ? 'text-green-400' : 'text-white'}`}>
                    {Math.round(val)}<span className="text-[10px] text-zinc-500 font-bold ml-0.5">{unit}</span>
                </p>
                <p className="text-[9px] text-zinc-600 font-bold mt-1">
                    Meta: {goal}{unit}
                </p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-zinc-800">
                <div 
                    className={`h-full transition-all duration-700 ease-out ${isMet ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-blue-500'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}

// 👇 2. TAGS COLORIDAS (ESTILO NEON PARA O MODO ESCURO)
function MacroTag({ label, val, unit="g", color }: any) {
    const colors: any = {
        // Cores personalizadas (Fundo Transparente + Texto Brilhante + Borda Suave)
        blue: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        green: "bg-green-500/10 text-green-400 border border-green-500/20",
        orange: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
        
        // Cores dos Nutrientes (Mapeadas do NUTRIENT_CONFIG)
        teal: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
        pink: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
        slate: "bg-slate-500/10 text-slate-300 border border-slate-500/20",
        purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
        indigo: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
        stone: "bg-stone-500/10 text-stone-300 border border-stone-500/20",
        red: "bg-red-500/10 text-red-400 border border-red-500/20",
        yellow: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        zinc: "bg-zinc-700/30 text-zinc-300 border border-zinc-600/50", // Cinza especial
        cyan: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
        lime: "bg-lime-500/10 text-lime-400 border border-lime-500/20",
        rose: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        
        gray: "bg-zinc-800 text-zinc-400 border border-zinc-700" // Fallback
    };
    
    // Pequeno ponto colorido ao lado (Opcional, dá um toque fixe)
    const dotColors: any = {
        blue: "bg-blue-500", green: "bg-green-500", orange: "bg-orange-500",
        teal: "bg-teal-500", pink: "bg-pink-500", slate: "bg-slate-400",
        purple: "bg-purple-500", indigo: "bg-indigo-500", stone: "bg-stone-400",
        red: "bg-red-500", yellow: "bg-yellow-500", emerald: "bg-emerald-500",
        zinc: "bg-zinc-400", cyan: "bg-cyan-500", lime: "bg-lime-500", rose: "bg-rose-500",
    };

    const activeColor = colors[color] || colors.gray;
    const activeDot = dotColors[color] || "bg-zinc-500";

    return (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5 leading-none ${activeColor}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${activeDot}`}></div>
            {label.toUpperCase().slice(0, 4)} {Math.round(val)}{unit}
        </span>
    )
}