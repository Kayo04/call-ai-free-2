'use client';

import { useState, useEffect } from 'react';
import { Camera, CameraResultType } from '@capacitor/camera';
import { analisarImagemAction } from '@/app/action'; // <--- Confirma que tens este import!

export default function Home() {
  const [imagem, setImagem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dadosNutricao, setDadosNutricao] = useState<any>(null);

  // Carregar elementos da câmara web
  useEffect(() => {
    import('@ionic/pwa-elements/loader').then(loader => {
      loader.defineCustomElements(window);
    });
  }, []);

  const tirarFoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64 
      });

      if (image.base64String) {
        setImagem(`data:image/jpeg;base64,${image.base64String}`);
        // AQUI: Usamos a nova função que chama o servidor
        processarComida(image.base64String); 
      }
    } catch (error) {
      console.log("Câmara cancelada");
    }
  };

  const processarComida = async (base64: string) => {
    setLoading(true);
    setDadosNutricao(null);

    try {
      // Chama a Server Action (Backend)
      // Isto evita o erro 404 de CORS/Bloqueio da Google
      const resultado = await analisarImagemAction(base64);

      if (resultado.error) {
        alert("Erro vindo do servidor: " + resultado.error);
      } else {
        setDadosNutricao(resultado.data);
      }

    } catch (error) {
      alert("Erro de conexão. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-50 font-sans">
      <h1 className="text-3xl font-bold text-gray-800 my-6">NutriScan 🍎</h1>

      <div className="w-full max-w-sm h-72 bg-gray-200 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center mb-6 border border-gray-300">
        {imagem ? (
          <img src={imagem} alt="Comida" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-gray-400 p-4">
            <p className="text-4xl mb-2">📸</p>
            <p>Tira uma foto à tua refeição</p>
          </div>
        )}
      </div>

      <button 
        onClick={tirarFoto}
        disabled={loading}
        className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-8"
      >
        {loading ? 'A Analisar...' : '📸 Analisar Comida'}
      </button>

      {dadosNutricao && (
        <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-xl border border-gray-100 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{dadosNutricao.nome}</h2>
          <p className="text-gray-500 text-sm mb-4">Peso estimado: {dadosNutricao.peso_estimado}</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
              <p className="text-xs text-orange-600 font-bold uppercase">Calorias</p>
              <p className="text-xl font-bold text-gray-800">{dadosNutricao.calorias}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-600 font-bold uppercase">Proteína</p>
              <p className="text-xl font-bold text-gray-800">{dadosNutricao.proteina}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <p className="text-xs text-green-600 font-bold uppercase">Hidratos</p>
              <p className="text-xl font-bold text-gray-800">{dadosNutricao.hidratos}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
              <p className="text-xs text-yellow-600 font-bold uppercase">Gordura</p>
              <p className="text-xl font-bold text-gray-800">{dadosNutricao.gordura}</p>
            </div>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="flex flex-col items-center text-gray-500 mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p>A consultar o nutricionista AI...</p>
        </div>
      )}
    </div>
  );
}