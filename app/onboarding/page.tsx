'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession(); 
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [weeksUntilGoal, setWeeksUntilGoal] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    gender: 'male',
    age: '',
    height: '', 
    weight: '', 
    bodyFat: '',
    targetWeight: '', 
    activity: 'sedentary',
    goal: 'lose',
    targetDate: ''    
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'targetDate' && value) {
        const today = new Date();
        const target = new Date(value);
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const weeks = Math.max(1, Math.round(diffDays / 7)); 
        setWeeksUntilGoal(weeks);
      }
      return newData;
    });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await res.json(); 

      if (res.ok) {
        
        // ALERTA INTELIGENTE DO "GREEK GOD"
        if (data.adjustedGoal && data.adjustedGoal !== formData.goal) {
            alert(`⚠️ NOTA IMPORTANTE:\n\nA IA ajustou o teu plano para "RECOMPOSIÇÃO" (Perder Gordura + Ganhar Músculo).\n\nMotivo: Como tens >15% de gordura corporal, fazer um Bulking agora só te faria ganhar mais gordura. Vamos limpar primeiro!`);
        }

        // Atualiza sessão e redireciona
        await update({ 
            onboardingCompleted: true,
            goals: data.goals 
        });
        router.push('/'); 
        router.refresh();
      } else {
        alert("Erro: " + data.message);
      }
    } catch (error) {
      alert("Erro ao guardar dados");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col justify-between font-sans">
      
      {/* Barra de Progresso */}
      <div className="w-full h-1 bg-zinc-900 mt-4 mb-8 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {/* --- PASSO 1: Género e Idade --- */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-black mb-2 tracking-tight">Sobre ti</h1>
            <p className="text-zinc-500 mb-8 font-medium">Para calcularmos o teu metabolismo.</p>
            
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-2 tracking-wider">Género</label>
            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => handleChange('gender', 'male')}
                className={`flex-1 p-4 rounded-2xl border-2 font-bold transition-all duration-200 ${formData.gender === 'male' ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}
              >Homem</button>
              <button 
                onClick={() => handleChange('gender', 'female')}
                className={`flex-1 p-4 rounded-2xl border-2 font-bold transition-all duration-200 ${formData.gender === 'female' ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}
              >Mulher</button>
            </div>

            <label className="block text-xs font-bold uppercase text-zinc-600 mb-2 tracking-wider">Idade</label>
            <input 
              type="number" 
              value={formData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              className="w-full text-5xl font-black bg-transparent border-b-2 border-zinc-800 py-2 outline-none focus:border-white transition-colors placeholder:text-zinc-800 text-white"
              placeholder="0"
            />
          </div>
        )}

        {/* --- PASSO 2: Medidas (COM GORDURA CORPORAL) --- */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-black mb-2 tracking-tight">As tuas medidas</h1>
            <p className="text-zinc-500 mb-8 font-medium">Necessário para a precisão do plano.</p>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <label className="block text-xs font-bold uppercase text-zinc-600 mb-2 tracking-wider">Altura (cm)</label>
                    <input 
                        type="number" 
                        value={formData.height}
                        onChange={(e) => handleChange('height', e.target.value)}
                        className="w-full text-4xl font-black bg-transparent border-b-2 border-zinc-800 py-2 outline-none focus:border-white transition-colors placeholder:text-zinc-800 text-white"
                        placeholder="175"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-zinc-600 mb-2 tracking-wider">Peso (kg)</label>
                    <input 
                        type="number" 
                        value={formData.weight}
                        onChange={(e) => handleChange('weight', e.target.value)}
                        className="w-full text-4xl font-black bg-transparent border-b-2 border-zinc-800 py-2 outline-none focus:border-white transition-colors placeholder:text-zinc-800 text-white"
                        placeholder="70"
                    />
                </div>
            </div>

            {/* CAMPO GORDURA CORPORAL */}
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-600 mb-2 tracking-wider">
                Gordura Corporal (%) <span className="text-zinc-700 font-normal normal-case">(Opcional)</span>
              </label>
              <input 
                type="number" 
                value={formData.bodyFat}
                onChange={(e) => handleChange('bodyFat', e.target.value)}
                className="w-full text-4xl font-black bg-transparent border-b-2 border-zinc-800 py-2 outline-none focus:border-white transition-colors placeholder:text-zinc-800 text-white"
                placeholder="15"
              />
              <p className="text-[10px] text-zinc-500 mt-3 leading-relaxed">
                Isto ajuda a IA a decidir se deves fazer Bulking ou Cutting. Se não souberes, deixa em branco.
              </p>
            </div>
          </div>
        )}

        {/* --- PASSO 3: Atividade --- */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-black mb-2 tracking-tight">Nível de Atividade</h1>
            <p className="text-zinc-500 mb-8 font-medium">O quanto te mexes por dia?</p>
            
            <div className="space-y-3">
              {[
                { val: 'sedentary', label: 'Sedentário', desc: 'Trabalho de escritório, pouco exercício' },
                { val: 'light', label: 'Ligeiro', desc: 'Exercício 1-3x por semana' },
                { val: 'moderate', label: 'Moderado', desc: 'Exercício 3-5x por semana' },
                { val: 'active', label: 'Muito Ativo', desc: 'Exercício intenso diário' }
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleChange('activity', opt.val)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${formData.activity === opt.val ? 'border-white bg-zinc-900' : 'border-zinc-800 hover:bg-zinc-900'}`}
                >
                  <div className="font-bold text-lg text-white">{opt.label}</div>
                  <div className="text-xs text-zinc-500 font-medium mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- PASSO 4: Objetivo e DATA --- */}
        {step === 4 && (
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-black mb-2 tracking-tight">O teu Objetivo</h1>
            <p className="text-zinc-500 mb-6 font-medium">Define a tua meta.</p>
            
            <div className="grid grid-cols-3 gap-3 mb-8">
               {[
                 { val: 'lose', icon: '📉', label: 'Perder' },
                 { val: 'maintain', icon: '⚖️', label: 'Manter' },
                 { val: 'gain', icon: '📈', label: 'Ganhar' }
               ].map(g => (
                 <button
                   key={g.val}
                   onClick={() => handleChange('goal', g.val)}
                   className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all aspect-square ${formData.goal === g.val ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}
                 >
                   <span className="text-2xl mb-1">{g.icon}</span>
                   <span className="text-xs font-bold">{g.label}</span>
                 </button>
               ))}
            </div>

            {formData.goal !== 'maintain' && (
              <div className="space-y-8 animate-slide-up">
                
                <div>
                   <label className="block text-xs font-bold uppercase text-zinc-600 mb-2 tracking-wider">Peso Desejado (kg)</label>
                   <input 
                     type="number" 
                     value={formData.targetWeight}
                     onChange={(e) => handleChange('targetWeight', e.target.value)}
                     className="w-full text-4xl font-black bg-transparent border-b-2 border-zinc-800 py-2 outline-none focus:border-white transition-colors placeholder:text-zinc-800 text-white"
                     placeholder={formData.goal === 'lose' ? "65" : "80"}
                   />
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase text-zinc-600 mb-2 tracking-wider">Para quando?</label>
                   <input 
                     type="date" 
                     value={formData.targetDate}
                     onChange={(e) => handleChange('targetDate', e.target.value)}
                     className="w-full text-lg font-bold bg-zinc-900 text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-white border border-zinc-800"
                   />
                </div>

                {weeksUntilGoal && weeksUntilGoal > 0 && (
                   <div className="bg-blue-900/20 border border-blue-900/50 text-blue-300 p-4 rounded-xl flex items-center gap-4">
                      <span className="text-2xl">🗓️</span>
                      <div>
                        <p className="text-xs font-bold uppercase opacity-60">Duração do Plano</p>
                        <p className="font-bold text-lg">{weeksUntilGoal} semanas</p>
                      </div>
                   </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        {step > 1 && (
          <button onClick={handleBack} className="px-6 py-4 rounded-2xl font-bold text-zinc-500 bg-zinc-900 hover:bg-zinc-800 transition-colors">Voltar</button>
        )}
        <button 
          onClick={step === 4 ? finishOnboarding : handleNext}
          disabled={loading || (step === 1 && !formData.age) || (step === 2 && (!formData.height || !formData.weight)) || (step === 4 && formData.goal !== 'maintain' && (!formData.targetWeight || !formData.targetDate))}
          className="flex-1 bg-white text-black py-4 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none"
        >
          {loading ? 'A calcular...' : (step === 4 ? 'Criar Plano' : 'Seguinte')}
        </button>
      </div>
    </div>
  );
}