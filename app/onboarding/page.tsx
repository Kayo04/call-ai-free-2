'use client';

import { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-white text-black p-6 flex flex-col justify-between">
      
      {/* Barra de Progresso */}
      <div className="w-full h-1 bg-gray-100 mt-4 mb-8 rounded-full overflow-hidden">
        <div 
          className="h-full bg-black transition-all duration-500" 
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {/* --- PASSO 1: Género e Idade --- */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-black mb-2">Sobre ti</h1>
            <p className="text-gray-500 mb-8">Para calcularmos o teu metabolismo.</p>
            
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Género</label>
            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => handleChange('gender', 'male')}
                className={`flex-1 p-4 rounded-2xl border-2 font-bold transition-all ${formData.gender === 'male' ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-400'}`}
              >Homem</button>
              <button 
                onClick={() => handleChange('gender', 'female')}
                className={`flex-1 p-4 rounded-2xl border-2 font-bold transition-all ${formData.gender === 'female' ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-400'}`}
              >Mulher</button>
            </div>

            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Idade</label>
            <input 
              type="number" 
              value={formData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              className="w-full text-4xl font-black border-b-2 border-gray-100 py-2 outline-none focus:border-black transition-colors placeholder:text-gray-200"
              placeholder="0"
            />
          </div>
        )}

        {/* --- PASSO 2: Medidas --- */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-black mb-2">As tuas medidas</h1>
            <p className="text-gray-500 mb-8">Peso atual e altura.</p>
            
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Altura (cm)</label>
              <input 
                type="number" 
                value={formData.height}
                onChange={(e) => handleChange('height', e.target.value)}
                className="w-full text-4xl font-black border-b-2 border-gray-100 py-2 outline-none focus:border-black transition-colors placeholder:text-gray-200"
                placeholder="175"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Peso Atual (kg)</label>
              <input 
                type="number" 
                value={formData.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                className="w-full text-4xl font-black border-b-2 border-gray-100 py-2 outline-none focus:border-black transition-colors placeholder:text-gray-200"
                placeholder="70"
              />
            </div>
          </div>
        )}

        {/* --- PASSO 3: Atividade --- */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-black mb-2">Nível de Atividade</h1>
            <p className="text-gray-500 mb-8">O quanto te mexes por dia?</p>
            
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
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${formData.activity === opt.val ? 'border-black bg-gray-50' : 'border-gray-50'}`}
                >
                  <div className="font-bold text-lg">{opt.label}</div>
                  <div className="text-xs text-gray-400 font-medium">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- PASSO 4: Objetivo e DATA --- */}
        {step === 4 && (
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-black mb-2">O teu Objetivo</h1>
            <p className="text-gray-500 mb-6">Define a tua meta.</p>
            
            <div className="grid grid-cols-3 gap-3 mb-8">
               {[
                 { val: 'lose', icon: '📉', label: 'Perder' },
                 { val: 'maintain', icon: '⚖️', label: 'Manter' },
                 { val: 'gain', icon: '📈', label: 'Ganhar' }
               ].map(g => (
                 <button
                   key={g.val}
                   onClick={() => handleChange('goal', g.val)}
                   className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all aspect-square ${formData.goal === g.val ? 'border-black bg-black text-white' : 'border-gray-100'}`}
                 >
                   <span className="text-2xl mb-1">{g.icon}</span>
                   <span className="text-xs font-bold">{g.label}</span>
                 </button>
               ))}
            </div>

            {formData.goal !== 'maintain' && (
              <div className="space-y-6 animate-slide-up">
                
                <div>
                   <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Peso Desejado (kg)</label>
                   <input 
                     type="number" 
                     value={formData.targetWeight}
                     onChange={(e) => handleChange('targetWeight', e.target.value)}
                     className="w-full text-4xl font-black border-b-2 border-gray-100 py-2 outline-none focus:border-black transition-colors"
                     placeholder={formData.goal === 'lose' ? "65" : "80"}
                   />
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Para quando?</label>
                   <input 
                     type="date" 
                     value={formData.targetDate}
                     onChange={(e) => handleChange('targetDate', e.target.value)}
                     className="w-full text-lg font-bold bg-gray-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-black"
                   />
                </div>

                {weeksUntilGoal && weeksUntilGoal > 0 && (
                   <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-center gap-3">
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
          <button onClick={handleBack} className="px-6 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100">Voltar</button>
        )}
        <button 
          onClick={step === 4 ? finishOnboarding : handleNext}
          disabled={loading || (step === 1 && !formData.age) || (step === 2 && (!formData.height || !formData.weight)) || (step === 4 && formData.goal !== 'maintain' && (!formData.targetWeight || !formData.targetDate))}
          className="flex-1 bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? 'A calcular...' : (step === 4 ? 'Criar Plano' : 'Seguinte')}
        </button>
      </div>
    </div>
  );
}