'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Configuração para sabermos as unidades e nomes
const NUTRIENT_CONFIG: any = {
    fiber: { label: 'Fibra', unit: 'g', color: 'teal' },
    sugar: { label: 'Açúcar', unit: 'g', color: 'pink' },
    sodium: { label: 'Sódio', unit: 'mg', color: 'slate' },
    cholesterol: { label: 'Colest.', unit: 'mg', color: 'purple' },
    potassium: { label: 'Potássio', unit: 'mg', color: 'indigo' },
    calcium: { label: 'Cálcio', unit: 'mg', color: 'stone' },
    iron: { label: 'Ferro', unit: 'mg', color: 'red' },
    vitC: { label: 'Vit C', unit: 'mg', color: 'orange' },
    vitD: { label: 'Vit D', unit: 'iu', color: 'sky' },
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

              <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-6xl font-black tracking-tighter">{Math.round(selectedLog.calories || 0)}</h3>
                        <span className="font-bold text-gray-400 text-lg">kcal</span>
                    </div>
                    
                    {selectedLog.calories > 0 && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                            (selectedLog.metGoal !== undefined ? selectedLog.metGoal : checkSuccess(selectedLog.calories, goalCalories)) 
                            ? "bg-emerald-500" 
                            : "bg-red-500"
                        }`}>
                            {(selectedLog.metGoal !== undefined ? selectedLog.metGoal : checkSuccess(selectedLog.calories, goalCalories)) ? "CUMPRIDO" : "FALHOU"}
                        </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                      <MacroBox label="Prot" val={selectedLog.protein} />
                      <MacroBox label="Carb" val={selectedLog.carbs} />
                      <MacroBox label="Gord" val={selectedLog.fat} />

                      {activeExtras.map(key => (
                          <MacroBox 
                            key={key}
                            label={NUTRIENT_CONFIG[key].label} 
                            val={selectedLog[key]} 
                            unit={NUTRIENT_CONFIG[key].unit}
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
                                  {/* Nome e Hora */}
                                  <div className="flex items-baseline gap-2 mb-3">
                                      <p className="font-black text-lg text-gray-900 leading-tight">{meal.name || "Refeição"}</p>
                                      {meal.time && <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{meal.time}</span>}
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    {/* 3 PRINCIPAIS */}
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 flex items-center gap-1.5 leading-none">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> PROT {Math.round(meal.protein)}g
                                    </span>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-green-50 text-green-600 flex items-center gap-1.5 leading-none">
                                       <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> CARB {Math.round(meal.carbs)}g
                                    </span>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 flex items-center gap-1.5 leading-none">
                                       <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> GORD {Math.round(meal.fat)}g
                                    </span>

                                    {/* 👇 CORRIGIDO: Agora usa 'activeExtras' para filtrar a lista 👇 */}
                                    {activeExtras.map(key => {
                                        const val = meal[key];
                                        // Se a refeição não tiver valor para este nutriente, não mostra
                                        if (!val || val === 0) return null;
                                        
                                        const color = NUTRIENT_CONFIG[key].color;
                                        // Mapa de cores
                                        let bg = "bg-gray-50"; let text = "text-gray-600"; let dot = "bg-gray-500";
                                        
                                        if(color === 'pink') { bg = "bg-pink-50"; text = "text-pink-600"; dot = "bg-pink-500"; }
                                        if(color === 'teal') { bg = "bg-teal-50"; text = "text-teal-600"; dot = "bg-teal-500"; }
                                        if(color === 'slate') { bg = "bg-slate-100"; text = "text-slate-600"; dot = "bg-slate-500"; }
                                        if(color === 'purple') { bg = "bg-purple-50"; text = "text-purple-600"; dot = "bg-purple-500"; }
                                        if(color === 'indigo') { bg = "bg-indigo-50"; text = "text-indigo-600"; dot = "bg-indigo-500"; }
                                        if(color === 'stone') { bg = "bg-stone-100"; text = "text-stone-600"; dot = "bg-stone-500"; }
                                        if(color === 'red') { bg = "bg-red-50"; text = "text-red-600"; dot = "bg-red-500"; }
                                        if(color === 'orange') { bg = "bg-orange-50"; text = "text-orange-600"; dot = "bg-orange-500"; }
                                        if(color === 'sky') { bg = "bg-sky-50"; text = "text-sky-600"; dot = "bg-sky-500"; }

                                        return (
                                            <span key={key} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 leading-none ${bg} ${text}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${dot}`}></div>
                                                {NUTRIENT_CONFIG[key].label.toUpperCase()} {Math.round(val)}{NUTRIENT_CONFIG[key].unit}
                                            </span>
                                        )
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
                        <p className="text-gray-400 text-sm font-bold">Nada registado.</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}

function MacroBox({ label, val, unit = "g" }: any) {
    return (
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
            <p className="text-[9px] uppercase font-bold text-gray-400 mb-1 tracking-wider">{label}</p>
            <p className="font-black text-lg">{Math.round(val || 0)}<span className="text-xs ml-0.5 font-bold text-gray-400">{unit}</span></p>
        </div>
    )
}