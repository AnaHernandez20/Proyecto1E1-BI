'use client';

import { useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/Button';
import { Card, ResultCard } from '../../components/Card';
import { predecirODS } from '../../services/api';

export default function ClasificarPage() {
  const [textos, setTextos] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ texto: string; ods: number }[]>([]);
  const [allResults, setAllResults] = useState<{ texto: string; ods: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!textos.trim()) {
      setError('Por favor, ingresa al menos un texto para analizar.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Separar el texto por punto y coma o por saltos de línea
      let textosArray: string[] = [];
      
      // Primero dividimos por líneas
      const lineas = textos.split('\n');
      
      // Luego procesamos cada línea para dividirla por punto y coma si es necesario
      lineas.forEach(linea => {
        if (linea.trim()) {
          // Si la línea contiene punto y coma, la dividimos
          if (linea.includes(';')) {
            const subTextos = linea.split(';').map(t => t.trim()).filter(t => t);
            textosArray = [...textosArray, ...subTextos];
          } else {
            textosArray.push(linea.trim());
          }
        }
      });
      
      if (textosArray.length === 0) {
        setError('No se encontraron textos válidos para analizar.');
        setIsLoading(false);
        return;
      }
      
      // Hacer la llamada a la API
      const response = await predecirODS(textosArray);
      
      // Crear el array de resultados con los textos originales y sus predicciones
      const resultados = textosArray.map((texto, index) => ({
        texto,
        ods: response.predicciones[index]
      }));
      
      // Actualizar los resultados actuales
      setResults(resultados);
      
      // Agregar los nuevos resultados al historial, colocándolos al inicio
      setAllResults(prevResults => [...resultados, ...prevResults]);
      
      // Limpiar el campo de texto después de enviar
      setTextos('');
    } catch (error) {
      console.error('Error al clasificar opiniones:', error);
      setError('Ocurrió un error al clasificar las opiniones. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Clasificador de Textos</h1>
            <p className="text-gray-600">
              Analiza opiniones ciudadanas y clasifícalas en los Objetivos de Desarrollo Sostenible.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Introduce tus opiniones (separadas por líneas o punto y coma)
              </label>
              <textarea
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800 font-medium"
                placeholder="Introduce tus opiniones aquí para analizar. Puedes separar múltiples opiniones usando punto y coma (;) o escribiendo cada una en una nueva línea."
                value={textos}
                onChange={(e) => setTextos(e.target.value)}
              ></textarea>
              <p className="mt-1 text-sm text-gray-600 italic">
                Ejemplo: "La educación es importante; La salud es un derecho fundamental"
              </p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex justify-center">
              <Button 
                type="submit" 
                isLoading={isLoading} 
                disabled={isLoading}
              >
                Analizar
              </Button>
            </div>
          </form>

          {/* Sección de resultados - Siempre visible si hay historial */}
          <div className="mt-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Historial de Análisis</h2>
              
              {allResults.length > 0 && (
                <button 
                  className="text-orange-500 hover:text-orange-600 flex items-center gap-2"
                  onClick={() => {
                    // Crear CSV y descargar
                    const csv = ['Texto,ODS']
                      .concat(allResults.map(r => `"${r.texto.replace(/"/g, '""')}",${r.ods}`))
                      .join('\n');
                    
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'resultados_clasificacion.csv';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exportar Historial (CSV)
                </button>
              )}
            </div>
            
            {allResults.length > 0 ? (
              <div className="space-y-4">
                {allResults.map((result, index) => (
                  <ResultCard
                    key={index}
                    text={result.texto}
                    odsNumber={result.ods}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No hay resultados de análisis. Introduce texto y haz clic en "Analizar" para comenzar.
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 bg-white border-t border-gray-200 text-center text-sm text-gray-600">
       Fondo de Población de las Naciones Unidas.
      </footer>
    </div>
  );
}