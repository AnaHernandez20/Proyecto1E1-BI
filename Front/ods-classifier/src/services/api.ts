/**
 * Servicio para manejar las llamadas a la API
 */

// URL Base de la API
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Interfaces para los tipos de datos utilizados en la API
 */
export interface PredecirRequest {
  textos: string[];
}

export interface PredecirResponse {
  predicciones: number[];
  scores: number[];
  probabilidades_por_clase: Record<string, number>[];
}

export interface EntrenarRequest {
  textos: string[];
  labels: number[];
}

export interface EntrenarResponse {
  precision: number;
  recall: number;
  f1_score: number;
}

/**
 * Función para enviar textos y obtener predicciones de ODS
 */
export const predecirODS = async (textos: string[]): Promise<PredecirResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/predecir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ textos }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al predecir ODS:', error);
    throw error;
  }
};

/**
 * Función para entrenar el modelo con nuevos datos
 */
export const entrenarModelo = async (textos: string[], labels: number[]): Promise<EntrenarResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/entrenar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ textos, labels }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al entrenar modelo:', error);
    throw error;
  }
};