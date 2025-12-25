'use client';

import { useState, useEffect } from 'react';
import { Camera, CameraResultType } from '@capacitor/camera';
import { analisarImagemAction } from '@/app/action'; // Confirma se o nome do ficheiro é action ou actions

export default function Home() {
  const [imagem, setImagem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any>(null);

  useEffect(() => {
    import('@ionic/pwa-elements/loader').then(loader => {
      loader.defineCustomElements(window);
    });
  }, []);

  const tirarFoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64
      });

      if (photo.base64String) {
        const base64 = `data:image/jpeg;base64,${photo.base64String}`;
        setImagem(base64);
        processar(base64); 
      }
    } catch (e) { 
      console.log("Câmara cancelada"); 
    }
  };

  const processar = async (base64: string) => {
    setLoading(true);
    setDados(null); 
    
    // Pequeno delay para a animação
    await new Promise(r => setTimeout(r, 500));

    try {
      const resultado = await analisarImagemAction(base64);

      if (resultado.error) {
        alert("Erro: " + resultado.error);
      } else {
        setDados(resultado.data);
      }
    } catch (error) {
      alert("A foto é muito grande ou a net falhou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-gray-900 font-sans pb-32">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-10 px-6 py-4 border-b border-gray-200 flex justify-between items-center transition-all">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍎</span>
          <h1 className="text-xl font-bold tracking-tight text-black">NutriScan</h1>
        </div>
        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
          <span className="text-sm">👤</span>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="pt-24 px-5 flex flex-col items-center w-full max-w-md mx-auto">
        
        {/* FOTO */}
        <div className="relative w-full aspect-square bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100 mb-6">
          {imagem ? (
            <img src={imagem} className="w-full h-full object-cover" alt="Comida" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
              <CameraIcon className="w-16 h-16 mb-3 opacity-30" />
              <p className="font-medium text-gray-400">Tira foto ao prato</p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white z-20 transition-all">
              <div className="w-12 h-12 border-[5px] border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="font-semibold tracking-wide animate-pulse">A analisar ingredientes...</p>
            </div>
          )}
        </div>

        {/* RESULTADOS */}
        {dados ? (
          <div className="w-full animate-slide-up space-y-4">
            <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col items-start">
              
              <div className="flex justify-between w-full items-start mb-2">
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">IDENTIFICADO</p>
                   <h2 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">{dados.nome}</h2>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mt-1">
                  {dados.peso_estimado || "1 porção"}
                </span>
              </div>

              {/* AQUI ESTÁ A NOVA DESCRIÇÃO DETALHADA */}
              <div className="bg-gray-50 w-full p-3 rounded-xl border border-gray-100 mb-2">
                 <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    📝 {dados.descricao}
                 </p>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-3">
              <MacroCard color="bg-orange-50 border-orange-100 text-orange-600" icon={<FireIcon />} label="Calorias" value={dados.calorias} />
              <MacroCard color="bg-blue-50 border-blue-100 text-blue-600" icon={<MuscleIcon />} label="Proteína" value={dados.proteina} />
              <MacroCard color="bg-green-50 border-green-100 text-green-600" icon={<WheatIcon />} label="Hidratos" value={dados.hidratos} />
              <MacroCard color="bg-yellow-50 border-yellow-100 text-yellow-600" icon={<DropIcon />} label="Gordura" value={dados.gordura} />
            </div>
          </div>
        ) : (
          !loading && imagem && (
            <div className="text-center p-6 text-gray-400 animate-fade-in">
              <p>👆 Análise concluída.</p>
            </div>
          )
        )}
      </main>

      {/* BOTÃO */}
      <div className="fixed bottom-8 left-0 w-full flex justify-center z-30 px-6">
        <button
          onClick={tirarFoto}
          disabled={loading}
          className="w-full max-w-sm bg-black text-white rounded-[1.2rem] py-4 shadow-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-80 disabled:scale-100"
        >
          <CameraIcon className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight">
            {imagem ? 'Nova Foto' : 'Escanear Comida'}
          </span>
        </button>
      </div>

    </div>
  );
}

/* --- ÍCONES E COMPONENTES --- */
function MacroCard({ color, icon, label, value }: any) {
  return (
    <div className={`${color} border p-5 rounded-[1.2rem] flex flex-col items-start shadow-sm transition-transform active:scale-95`}>
      <div className="mb-3 p-2.5 bg-white rounded-xl shadow-sm">{icon}</div>
      <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-2xl font-black tracking-tighter">{value}</p>
    </div>
  );
}

const CameraIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>);
const FireIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.072-5.714-1-8.571C12.5 1.5 17 6.5 17 12a5 5 0 1 1-10 0c0-1 3-3 3-3"/><path d="M12 14v4"/><path d="M12 2v1"/></svg>);
const MuscleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-3 0-4-3-4-3s2-2 3-2 3 2 3 2-1 3-4 3Z"/><path d="M6 5c2-2 4 2 6 7 2-5 4-9 6-7s-5 8-6 12"/></svg>);
const WheatIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22 17 7"/><path d="M12 6a2 2 0 0 1 2 2"/><path d="M16.14 8.79a3 3 0 0 1 4.54 1.3"/><path d="M16 11a3 3 0 0 1 3 3"/></svg>);
const DropIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>);