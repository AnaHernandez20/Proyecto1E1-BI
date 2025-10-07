'use client';

import { useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { FileUpload } from '../../components/FileUpload';
import { Button } from '../../components/Button';
import { entrenarModelo } from '../../services/api';

interface TrainingData {
  textos: string[];
  labels: number[];
}

interface TrainingResult {
  precision: number;
  recall: number;
  f1_score: number;
}

export default function EntrenarPage() {
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<number | null>(null);

  const handleFileLoad = (data: TrainingData) => {
    setTrainingData(data);
    setError(null);
    setTrainingResult(null);
  };

  const handleTraining = async () => {
    if (!trainingData || trainingData.textos.length === 0 || trainingData.labels.length === 0) {
      setError('No hay datos válidos para el entrenamiento.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulamos progreso
      const progressInterval = setInterval(() => {
        setTrainingProgress((prev) => {
          if (prev === null) return 10;
          return prev >= 90 ? 90 : prev + 10;
        });
      }, 800);
      
      // Hacemos la llamada a la API para entrenar
      const result = await entrenarModelo(
        trainingData.textos,
        trainingData.labels
      );
      
      // Simulamos el 100% de progreso
      setTrainingProgress(100);
      setTimeout(() => setTrainingProgress(null), 1000);
      
      // Guardamos el resultado
      setTrainingResult({
        precision: result.precision,
        recall: result.recall,
        f1_score: result.f1_score
      });
      
      clearInterval(progressInterval);
    } catch (error) {
      console.error('Error al entrenar modelo:', error);
      setError('Ocurrió un error durante el entrenamiento. Por favor, inténtalo de nuevo.');
      setTrainingProgress(null);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Re-entrenamiento del Modelo</h1>
            <p className="text-gray-600">
              Actualiza el modelo con nuevos datos etiquetados. Suba un archivo Excel que contenga 
              textos y sus correspondientes etiquetas de ODS.
            </p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Subir archivo Excel</h2>
            
            <FileUpload 
              onFileLoad={handleFileLoad}
              className="mb-6"
            />
            
            <div className="text-center">
              <Button
                onClick={handleTraining}
                disabled={!trainingData || isLoading}
                isLoading={isLoading}
              >
                Iniciar Re-entrenamiento
              </Button>
            </div>
          </div>

          {/* Mostrar progreso del entrenamiento */}
          {trainingProgress !== null && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Re-entrenamiento en progreso...</h2>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{
                    width: `${trainingProgress}%`,
                    background: `linear-gradient(to right, #2563eb, #f97316)` 
                  }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-500 text-right">{trainingProgress}%</p>
              <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos minutos.</p>
            </div>
          )}

          {/* Mostrar resultado del entrenamiento */}
          {trainingResult && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center text-orange-500 mb-6">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <h2 className="text-lg font-semibold">Re-entrenamiento completado con éxito.</h2>
              </div>
              
              <h3 className="text-md font-medium text-gray-700 mb-3">Métricas de rendimiento del modelo:</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <table className="w-full text-left">
                  <thead className="border-b">
                    <tr className="text-gray-500">
                      <th className="py-2 pl-2">MÉTRICA</th>
                      <th className="py-2">VALOR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-3 pl-2 font-medium text-gray-800">Precisión</td>
                      <td className="py-3 text-blue-600 font-medium">{trainingResult.precision.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-3 pl-2 font-medium text-gray-800">Recall</td>
                      <td className="py-3 text-orange-500 font-medium">{trainingResult.recall.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-3 pl-2 font-medium text-gray-800">F1-Score</td>
                      <td className="py-3 text-blue-600 font-medium">{trainingResult.f1_score.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="hzttp://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 bg-white border-t border-gray-200 text-center text-sm text-gray-600">
        Fondo de Población de las Naciones Unidas.
      </footer>
    </div>
  );
}