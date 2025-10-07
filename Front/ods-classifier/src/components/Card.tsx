import { ReactNode } from 'react';

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
}

export const ResultCard = ({ text, odsNumber, confidence }: ResultCardProps) => {
  // Mapa de ODS a colores y nombres
  const odsMap: Record<number, { color: string; name: string }> = {
    1: { color: 'bg-orange-600 text-white', name: 'Fin de la Pobreza' },
    3: { color: 'bg-blue-600 text-white', name: 'Salud y Bienestar' },
    4: { color: 'bg-orange-500 text-white', name: 'Educación de Calidad' },
    5: { color: 'bg-blue-500 text-white', name: 'Igualdad de Género' },
  };

  const odsInfo = odsMap[odsNumber] || { color: 'bg-orange-600 text-white', name: `ODS ${odsNumber}` };

  return (
    <Card>
      <p className="text-gray-900 font-medium mb-4">"{text}"</p>
      <div className="flex justify-between items-center">
        <span className={`${odsInfo.color} px-3 py-1 rounded-full text-sm font-semibold`}>
          ODS {odsNumber}: {odsInfo.name}
        </span>
        {confidence !== undefined && (
          <span className="text-sm font-medium text-gray-800">
            Confianza: {(confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </Card>
  );
};