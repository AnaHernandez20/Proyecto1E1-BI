import { ReactNode, useState } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`bg-white shadow-md rounded-lg p-6 mb-4 border border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

interface ResultCardProps {
  text: string;
  odsNumber: number;
  confidence?: number;
  allProbabilities?: Record<string, number>;
}

export const ResultCard = ({ text, odsNumber, confidence, allProbabilities }: ResultCardProps) => {
  // Mapa de ODS a colores y nombres
  const odsMap: Record<number, { color: string; name: string }> = {
    1: { color: 'bg-orange-600 text-white', name: 'Fin de la Pobreza' },
    3: { color: 'bg-blue-600 text-white', name: 'Salud y Bienestar' },
    4: { color: 'bg-orange-500 text-white', name: 'Educación de Calidad' },
    5: { color: 'bg-blue-500 text-white', name: 'Igualdad de Género' },
  };

  const odsInfo = odsMap[odsNumber] || { color: 'bg-orange-600 text-white', name: `ODS ${odsNumber}` };
  
  const [showProbabilities, setShowProbabilities] = useState(false);

  return (
    <Card>
      <p className="text-black font-medium mb-4">"{text}"</p>
      <div className="flex justify-between items-center mb-2">
        <span className={`${odsInfo.color} px-3 py-1 rounded-full text-sm font-semibold`}>
          ODS {odsNumber}: {odsInfo.name}
        </span>
        {confidence !== undefined && (
          <span className="text-sm font-medium text-gray-800">
            Confianza: {(confidence * 100).toFixed(1)}%
          </span>
        )}
      </div>
      
      {allProbabilities && (
        <div className="mt-2">
          <button 
            onClick={() => setShowProbabilities(!showProbabilities)} 
            className="text-xs text-orange-500 hover:text-orange-700 flex items-center"
          >
            {showProbabilities ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Ocultar probabilidades
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Ver todas las probabilidades
              </>
            )}
          </button>
          
          {showProbabilities && (
            <div className="mt-2 bg-gray-50 p-2 rounded-md text-xs text-black">
              <p className="font-semibold mb-1">Probabilidades por ODS:</p>
              <ul>
                {Object.entries(allProbabilities).map(([ods, prob]) => (
                  <li key={ods} className="flex justify-between py-1">
                    <span>ODS {ods}: {odsMap[parseInt(ods)]?.name || `ODS ${ods}`}</span>
                    <span className="font-medium">{(prob * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};