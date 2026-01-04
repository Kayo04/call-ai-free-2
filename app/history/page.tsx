'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Configuração Visual dos Nutrientes (Igual à Page Principal)
const NUTRIENT_CONFIG: any = {
    // Originais
    fiber: { label: 'Fibra', unit: 'g' },
    sugar: { label: 'Açúcar', unit: 'g' },
    sodium: { label: 'Sódio', unit: 'mg' },
    cholesterol: { label: 'Colesterol', unit: 'mg' },
    potassium: { label: 'Potássio', unit: 'mg' },
    calcium: { label: 'Cálcio', unit: 'mg' },
    iron: { label: 'Ferro', unit: 'mg' },
    vitC: { label: 'Vit C', unit: 'mg' },
    vitD: { label: 'Vit D', unit: 'iu' },
    
    // Novos
    magnesium: { label: 'Magnésio', unit: 'mg' },
    zinc: { label: 'Zinco', unit: 'mg' }, 
    omega3: { label: 'Ómega 3', unit: 'mg' },
    vitB12: { label: 'Vit B12', unit: 'mcg' },
    vitB9: { label: 'Vit B9', unit: 'mcg' },
    selenium: { label: 'Selénio', unit: 'mcg' }
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

  if (status === "loading") return <div className="min-h-screen bg-[#F2F2F7] p-6 text-center pt-20">A carregar...</div>;
  
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
    <div className="min-h-screen bg-[#F2F2F7] text-gray-900 font-sans p-6 pb-32">
      
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center font-bold active:scale-90 transition-transform">←</button>
        <div className="flex flex-col items-center">
            <h1 className="text-xl font-black">Histórico</h1>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{successCount}/{daysInMonth} DIAS COMPLETOS</span>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 shadow-xl mb-8">
        <div className="flex justify-between items-center mb-6 px-2">
            <button onClick={() => changeMonth(-1)} className="p-2 text-gray-400 hover:text-black font-bold text-xl">❮</button>
            <h2 className="text-lg font-black capitalize">
                {viewDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => changeMonth(1)} className="p-2 text-gray-400 hover:text-black font-bold text-xl">❯</button>
        </div>
        
        <div className="grid grid-cols-7 gap-3">
            {['D','S','T','Q','Q','S','S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-gray-300 mb-1">{d}</div>
            ))}
            
            {daysArray.map(day => {
                const log = getLogForDay(day);
                const isToday = day === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
                const isSelected = selectedLog && new Date(selectedLog.date || new Date()).getDate() === day && viewDate.getMonth() === new Date(selectedLog.date).getMonth();

                let bg = "bg-gray-50 text-gray-300";
                
                if (log && log.calories > 0) {
                    const metGoal = log.metGoal !== undefined ? log.metGoal : checkSuccess(log.calories, goalCalories);
                    if (metGoal) {
                        bg = "bg-emerald-500 text-white shadow-md shadow-emerald-200";
                    } else {
                        bg = "bg-red-600 text-white shadow-md shadow-red-200";
                    }
                }

                if (isToday && !log) bg = "ring-2 ring-black text-black font-bold";
                if (isSelected) bg = "bg-black text-white scale-110 shadow-xl z-10 ring-4 ring-white";

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
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detalhes de</p>
                  <h2 className="text-3xl font-black capitalize text-gray-900 mt-1">
                    {new Date(selectedLog.date || new Date()).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric' })}
                  </h2>
              </div>

              {/* CARTÃO PRINCIPAL (ESTILO DARK MODE) */}
              <div className="bg-black text-white p-6 rounded-[2rem] shadow-xl overflow-hidden relative">
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Ingerido</span>
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-5xl font-black tracking-tighter">{Math.round(selectedLog.calories || 0)}</h3>
                            <span className="font-bold text-gray-500 text-lg">kcal</span>
                        </div>
                    </div>
                    
                    {selectedLog.calories > 0 && (
                        <div className={`px-4 py-2 rounded-full text-xs font-bold text-white ${
                            (selectedLog.metGoal !== undefined ? selectedLog.metGoal : checkSuccess(selectedLog.calories, goalCalories)) 
                            ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]" 
                            : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                        }`}>
                            {(selectedLog.metGoal !== undefined ? selectedLog.metGoal : checkSuccess(selectedLog.calories, goalCalories)) ? "META ATINGIDA" : "META FALHADA"}
                        </div>
                    )}
                  </div>

                  {/* GRID DE MACROS COM BARRAS */}
                  <div className="grid grid-cols-3 gap-3 relative z-10">
                      <MacroBar label="Prot" val={selectedLog.protein} goal={userGoals.protein} />
                      <MacroBar label="Carb" val={selectedLog.carbs} goal={userGoals.carbs} />
                      <MacroBar label="Gord" val={selectedLog.fat} goal={userGoals.fat} />

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

              <h3 className="text-xs font-bold text-gray-400 uppercase ml-4 mt-8 mb-3 tracking-wider">Refeições do dia</h3>
              
              {selectedLog.meals && selectedLog.meals.length > 0 ? (
                  <div className="space-y-3 pb-16 px-2">
                      {selectedLog.meals.slice().reverse().map((meal: any, idx: number) => (
                          <div key={idx} className="bg-white p-5 rounded-[2rem] flex justify-between items-stretch shadow-sm border border-gray-100/80 relative overflow-hidden group transition-all hover:shadow-md">
                              
                              <div className="flex-1 pr-4 flex flex-col justify-center">
                                  <div className="flex items-baseline gap-2 mb-3">
                                      <p className="font-black text-lg text-gray-900 leading-tight">{meal.name || "Refeição"}</p>
                                      {meal.time && <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{meal.time}</span>}
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    {Math.round(meal.protein) > 0 && <MacroTag label="PROT" val={meal.protein} color="blue" />}
                                    {Math.round(meal.carbs) > 0 && <MacroTag label="CARB" val={meal.carbs} color="green" />}
                                    {Math.round(meal.fat) > 0 && <MacroTag label="GORD" val={meal.fat} color="orange" />}

                                    {/* Mostra extras que tenham valor > 0 */}
                                    {Object.keys(NUTRIENT_CONFIG).map(key => {
                                        if (['protein','carbs','fat'].includes(key)) return null;
                                        const val = meal[key];
                                        if (!val || val === 0) return null;
                                        
                                        return <MacroTag key={key} label={NUTRIENT_CONFIG[key].label} val={val} unit={NUTRIENT_CONFIG[key].unit} color="gray" />
                                    })}
                                  </div>
                              </div>

                              <div className="flex flex-col items-end justify-center pl-5 border-l border-gray-100">
                                  <span className="block font-black text-3xl text-gray-900 leading-none tracking-tight">{Math.round(meal.calories)}</span>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">kcal</span>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-12 mx-2 bg-white/50 rounded-[2rem] border-2 border-dashed border-gray-200">
                        <p className="text-4xl mb-3 grayscale opacity-30">🥣</p>
                        <p className="text-gray-400 text-sm font-bold">Nada registado neste dia.</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}

// 👇 COMPONENTE NOVO: BARRA DE PROGRESSO ELEGANTE (DARK MODE)
function MacroBar({ label, val = 0, goal = 0, unit = "g" }: any) {
    const safeGoal = goal || 1;
    const pct = Math.min(100, (val / safeGoal) * 100);
    const isMet = val >= safeGoal;

    return (
        <div className="relative overflow-hidden bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col justify-between h-20 group hover:bg-white/10 transition-colors">
            {/* Label e Check */}
            <div className="flex justify-between items-start">
                <p className={`text-[9px] font-bold uppercase tracking-wider ${isMet ? 'text-green-400' : 'text-gray-400'}`}>
                    {label}
                </p>
                {isMet && <span className="text-green-400 text-[10px] animate-pulse">✓</span>}
            </div>

            {/* Valores */}
            <div className="z-10 mt-1">
                <p className={`text-lg font-black leading-none ${isMet ? 'text-green-400' : 'text-white'}`}>
                    {Math.round(val)}<span className="text-[9px] opacity-60 ml-0.5">{unit}</span>
                </p>
                <p className="text-[8px] text-gray-500 font-bold mt-0.5">
                    /{goal}{unit}
                </p>
            </div>

            {/* Barra Fundo */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800/50">
                {/* Barra Fill */}
                <div 
                    className={`h-full transition-all duration-700 ease-out ${isMet ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}

// 👇 COMPONENTE PARA AS REFEIÇÕES (TAGS SIMPLES)
function MacroTag({ label, val, unit="g", color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        orange: "bg-orange-50 text-orange-600",
        gray: "bg-gray-100 text-gray-600"
    };
    
    // Cores específicas para os novos nutrientes (opcional)
    const dotColors: any = {
        blue: "bg-blue-500",
        green: "bg-green-500",
        orange: "bg-orange-500",
        gray: "bg-gray-400"
    };

    return (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 leading-none ${colors[color] || colors.gray}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dotColors[color] || dotColors.gray}`}></div>
            {label.toUpperCase().slice(0, 4)} {Math.round(val)}{unit}
        </span>
    )
}