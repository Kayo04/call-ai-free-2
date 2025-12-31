'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [dailyLog, setDailyLog] = useState<any>({ calories: 0, meals: [] });

  useEffect(() => {
    // @ts-ignore
    if (session?.user) {
       // @ts-ignore
       setHistory(session.user.history || []);
       // @ts-ignore
       setDailyLog(session.user.dailyLog || { calories: 0, meals: [] });
       
       if (!selectedLog) {
           // Seleciona o dia de hoje por defeito
           // @ts-ignore
           setSelectedLog(session.user.dailyLog || { calories: 0, date: new Date(), meals: [] });
       }
    }
  }, [session]);

  if (status === "loading") return <div className="min-h-screen bg-[#F2F2F7] p-6 text-center pt-20">A carregar...</div>;
  
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getLogForDay = (day: number) => {
    const targetMonth = today.getMonth();
    
    // 1. Verifica Histórico (Passado)
    const historyMatch = history.find((h: any) => {
      const d = new Date(h.date);
      return d.getDate() === day && d.getMonth() === targetMonth;
    });
    if (historyMatch) return historyMatch;

    // 2. Verifica Hoje (Presente)
    const activeLogDate = new Date(dailyLog.date || 0);
    if (activeLogDate.getDate() === day && activeLogDate.getMonth() === targetMonth) {
        return dailyLog;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-gray-900 font-sans p-6 pb-32">
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center font-bold">←</button>
        <h1 className="text-2xl font-black">Histórico</h1>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold mb-4 capitalize">
            {today.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
        </h2>
        
        <div className="grid grid-cols-7 gap-2">
            {['D','S','T','Q','Q','S','S'].map((d, i) => (
                <div key={i} className="text-center text-xs font-bold text-gray-300 mb-2">{d}</div>
            ))}
            
            {daysArray.map(day => {
                const log = getLogForDay(day);
                let bg = "bg-gray-50 text-gray-400";
                
                if (day === today.getDate()) {
                    bg = "bg-black text-white ring-2 ring-black ring-offset-2";
                } else if (log && log.calories > 0) {
                    bg = log.metGoal ? "bg-green-500 text-white" : "bg-red-400 text-white";
                }

                return (
                    <button 
                        key={day} 
                        onClick={() => setSelectedLog(log || { date: new Date(today.getFullYear(), today.getMonth(), day), calories: 0, meals: [] })}
                        className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all ${bg}`}
                    >
                        {day}
                    </button>
                )
            })}
        </div>
      </div>

      {selectedLog && (
          <div className="animate-slide-up space-y-4">
              {/* Resumo do Dia */}
              <div className="bg-white p-6 rounded-[2rem] shadow-xl">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                        {new Date(selectedLog.date || new Date()).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    {new Date(selectedLog.date || 0).getDate() === today.getDate() && (
                        <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md">HOJE</span>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-6">
                      <h3 className="text-4xl font-black">{Math.round(selectedLog.calories || 0)}</h3>
                      <span className="font-bold text-gray-400">kcal total</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-gray-400">Prot</p>
                          <p className="font-bold">{Math.round(selectedLog.protein || 0)}g</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-gray-400">Carb</p>
                          <p className="font-bold">{Math.round(selectedLog.carbs || 0)}g</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-gray-400">Gord</p>
                          <p className="font-bold">{Math.round(selectedLog.fat || 0)}g</p>
                      </div>
                  </div>
              </div>

              {/* LISTA DE REFEIÇÕES */}
              <h3 className="text-sm font-bold text-gray-400 uppercase ml-2 mt-4">Refeições</h3>
              
              {selectedLog.meals && selectedLog.meals.length > 0 ? (
                  <div className="space-y-2 pb-10">
                      {selectedLog.meals.slice().reverse().map((meal: any, idx: number) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-gray-100">
                              <div>
                                  <p className="font-bold text-lg text-gray-900">{meal.name || "Refeição"}</p>
                                  <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">P: {Math.round(meal.protein)}g</span>
                                    <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-bold">C: {Math.round(meal.carbs)}g</span>
                                    <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded font-bold">G: {Math.round(meal.fat)}g</span>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className="block font-black text-xl">{Math.round(meal.calories)}</span>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase">kcal</span>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-4xl mb-2">🍽️</p>
                    <p className="text-gray-400 text-sm font-medium">Ainda sem refeições registadas.</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}