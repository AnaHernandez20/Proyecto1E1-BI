/**
 * Definiciones comunes para mapeo de ODS
 */

export const mapODS: Record<number, { name: string; color: string }> = {
  1: { name: 'Fin de la Pobreza', color: 'bg-orange-500' },
  3: { name: 'Salud y Bienestar', color: 'bg-blue-600' },
  4: { name: 'Educación de Calidad', color: 'bg-orange-500' },
  5: { name: 'Igualdad de Género', color: 'bg-blue-600' },
};

/**
 * Genera colores aleatorios de confianza (entre 80% y 99%) para simular
 * el nivel de confianza de las predicciones
 */
export const generateConfidence = () => {
  return 0.80 + Math.random() * 0.19;
};