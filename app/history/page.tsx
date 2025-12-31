'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Inicializa o selectedLog com o dia de hoje quando a página abre
  useEffect(() => {
    // @ts-ignore
    if (session?.user?.dailyLog) {
       // @ts-ignore
       setSelectedLog(session.user.dailyLog);
    }
  }, [session]);

  if (status === "loading") return <div className="min-h-screen bg-[#F2F2F7] p-6 text-center pt-20">A carregar...</div>;
  
  // @ts-ignore
  const history = session?.user?.history || [];
  // @ts-ignore
  const dailyLog = session?.user?.dailyLog || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getLogForDay = (day: number) => {
    // 1. SE FOR HOJE: Usa o dailyLog (que tem os dados frescos!)
    if (day === today.getDate()) {
        // Adicionamos a data atual para garantir que o objeto está completo
        return { ...dailyLog, date: new Date() };
    }

    // 2. SE FOR PASSADO: Procura no histórico
    return history.find((h: any) => {
      const hDate = new Date(h.date);
      return hDate.getDate() === day && hDate.getMonth() === today.getMonth();
    });
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-gray-900 font-sans p-6 pb-32">
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center font-bold">←</button>
        <h1 className="text-2xl font-black">O Teu Histórico</h1>
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
                const log = getLogForDay(day); // Agora já apanha o dia de hoje!
                
                let bg = "bg-gray-50 text-gray-400";
                
                if (day === today.getDate()) {
                    // HOJE: Preto (destaque)
                    bg = "bg-black text-white ring-2 ring-black ring-offset-2"; 
                } else if (log) {
                    // PASSADO: Verde/Vermelho
                    bg = log.metGoal ? "bg-green-500 text-white" : "bg-red-400 text-white";
                }

                return (
                    <button 
                        key={day} 
                        onClick={() => setSelectedLog(log || { date: new Date(today.getFullYear(), today.getMonth(), day), calories: 0 })}
                        className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all ${bg}`}
                    >
                        {day}
                    </button>
                )
            })}
        </div>
      </div>

      {selectedLog && (
          <div className="bg-white p-6 rounded-[2rem] shadow-xl animate-slide-up">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                    {new Date(selectedLog.date || new Date()).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {new Date(selectedLog.date || new Date()).getDate() === today.getDate() && (
                    <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md">HOJE</span>
                )}
              </div>
              
              <div className="flex items-baseline gap-2 mb-6">
                  <h3 className="text-4xl font-black">{Math.round(selectedLog.calories || 0)}</h3>
                  <span className="font-bold text-gray-400">kcal ingeridas</span>
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
      )}
    </div>
  );
}