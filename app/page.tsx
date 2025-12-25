'use client';

import { useState, useEffect } from 'react';
import { Camera, CameraResultType } from '@capacitor/camera';
import { analisarImagemAction } from '@/app/action'; // Confirma se o ficheiro é actions.ts

export default function Home() {
  const [imagem, setImagem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dadosNutricao, setDadosNutricao] = useState<any>(null);

  useEffect(() => {
    // Carrega os drivers da câmara para funcionar no PC e Telemóvel
    import('@ionic/pwa-elements/loader').then(loader => {
      loader.defineCustomElements(window);
    });
  }, []);

  const tirarFoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 60,       // ✅ Qualidade média para ser rápido (3G/4G)
        width: 800,        // ✅ Redimensionar para 800px (poupa 90% dos dados)
        allowEditing: false,
        resultType: CameraResultType.Base64,
      });

      if (photo.base64String) {
        // Criar o formato base64 correto para mostrar no ecrã e enviar
        const base64 = `data:image/jpeg;base64,${photo.base64String}`;
        setImagem(base64);
        
        // Chamar a função de processamento
        processarComida(base64);
      }
    } catch (e) { 
      console.log("Câmara cancelada pelo utilizador"); 
    }
  };

  const processarComida = async (base64: string) => {
    setLoading(true);
    setDadosNutricao(null);

    try {
      // Envia para o Server Action (Backend)
      const resultado = await analisarImagemAction(base64);

      if (resultado.error) {
        alert("Ops! " + resultado.error);
      } else {
        setDadosNutricao(resultado.data);
      }

    } catch (error) {
      console.error(error); // Ajuda a ver o erro real no log
      alert("Erro de conexão. A imagem pode ser muito pesada ou a net está lenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-50 font-sans pb-24">
      {/* Header Fixo */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-10 px-6 py-4 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍎</span>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">NutriScan</h1>
        </div>
      </header>

      {/* Espaço para o Header não tapar o conteúdo */}
      <div className="mt-20 w-full max-w-sm">
        
        {/* Área da Imagem */}
        <div className="w-full aspect-square bg-gray-200 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center mb-6 border border-gray-300 relative">
          {imagem ? (
            <img src={imagem} alt="Comida" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-gray-400 p-4">
              <p className="text-5xl mb-2">📸</p>
              <p className="font-medium">Tira uma foto à comida</p>
            </div>
          )}
          
          {/* Loading Spinner por cima da imagem */}
          {loading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3"></div>
              <p className="font-bold">A analisar...</p>
            </div>
          )}
        </div>

        {/* Resultados */}
        {dadosNutricao && (
          <div className="w-full bg-white p-6 rounded-3xl shadow-xl border border-gray-100 animate-fade-in mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-extrabold text-gray-800">{dadosNutricao.nome}</h2>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">
                {dadosNutricao.peso_estimado}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <MacroCard label="Calorias" value={dadosNutricao.calorias} color="bg-orange-50 text-orange-700" />
              <MacroCard label="Proteína" value={dadosNutricao.proteina} color="bg-blue-50 text-blue-700" />
              <MacroCard label="Hidratos" value={dadosNutricao.hidratos} color="bg-green-50 text-green-700" />
              <MacroCard label="Gordura" value={dadosNutricao.gordura} color="bg-yellow-50 text-yellow-700" />
            </div>
          </div>
        )}
      </div>

      {/* Botão Flutuante */}
      <div className="fixed bottom-6 left-0 w-full flex justify-center z-20 px-4">
        <button 
          onClick={tirarFoto}
          disabled={loading}
          className="w-full max-w-sm bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-2xl active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {imagem ? 'Nova Foto' : 'Escanear Comida'}
        </button>
      </div>
    </div>
  );
}

// Pequeno componente para limpar o código principal
function MacroCard({ label, value, color }: any) {
  return (
    <div className={`${color} p-3 rounded-xl border border-current/10`}>
      <p className="text-[10px] font-bold uppercase opacity-70 mb-1">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}