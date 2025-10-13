#En este archivo vamos a automatrizar el modelo de Machine Learning completo, paso a paso en un pipeline (en un solo flujo lo hace)

import os
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.base import BaseEstimator, TransformerMixin
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split

#Para poder importar desde la carpeta src (que está fuera de la carpeta src que es donde está este archivo pipeline_ods.py)
import os, sys
BASE_DIR = os.path.dirname(os.path.abspath(__file__))      # .../Proyecto1E1-BI/src
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, '..'))   # .../Proyecto1E1-BI
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

#Para no fallar al importar la función preprocesar_texto
from src.preprocesamiento import preprocesar_texto


#Le aplicamos el preprocesamiento a cada uno de los textos antes de hacerle tf-idf

#Creamos una clase personalizada que hereda de BaseEstimator y TransformerMixin
#Esto es necesario para que podamos usarla en el pipeline de sklearn y que los textos se preprocesen antes de hacerles tf-idf

class PreprocesamientoPersonalizado(BaseEstimator, TransformerMixin):
    #La clase debe tener los metodos fit y transform

    #El metodo fit no hace nada, solo devuelve self
    def fit(self, X, y=None):
        return self

    #El metodo transform aplica la funcion de preprocesamiento a cada texto en X, que son todos los textos del dataset
    #El preprocesamiento lo hace la funcion preprocesar_texto que creamos en preprocesamiento.py
    def transform(self, X):
        return [preprocesar_texto(texto) for texto in X]
    
#Ahora si hacemos el pipeline completo
def creacion_del_pipeline() -> Pipeline:
    pipeline = Pipeline([
        #Primero aplicamos el preprocesamiento personalizado de la clase que creamos arriba
        ('preprocesamiento', PreprocesamientoPersonalizado()),  

        #Luego aplicamos el tf-idf a los textos ya preprocesados identicamente a como lo hicimos en la etapa 1 del proyecto
        ('vectorizador', TfidfVectorizer(
        preprocessor=None, #No aplicamos más preprocesamiento, ya limpiamos antes
        lowercase=False, #No convertimos a minúsculas, ya lo hicimos
        min_df=2, #Ignoramos palabras que aparecen en menos de 2 documentos
        max_df=0.90, #Ignoramos palabras que aparecen en más del 90% de los documentos (demasiado comunes, como si fuera "ods", no aporta)
        token_pattern=r"(?u)\b[^\W\d_]{2,}\b" #Solo consideramos tokens con al menos 2 letras (ignoramos números y palabras de una letra)
        )),  

        #Aqui vamos a agregar el modelo de Machine Learning que resultó elegido en la etapa 1 del proyecto: Regresión Logística
        #Haremos la regresión logística con los hiperparámetros que resultaron lo mejores en la etapa 1 del proyecto
        ('modelo', LogisticRegression(
              max_iter=2000,    #El modelo tiene que buscar coeficientes para las palabras (por ejemplo, "escuel" con coeficiente alto para ODS 4), 
    #para eso el modelo tiene que probar valores, calcular errores, ajustar y volver a intentar, 
    #y eso se repite muchas veces (es iterativo el proceso de encontrar los coeficientes de los términos)
    #Este parametro hace que el modelo haga máximo 2000 iteraciones para encontrar esos coeficientes de todos los terminos (lo hace para todos a la vez)
    #Basicamente estas 2000 iteraciones no son por término, sino para todo el modelo a la vez (ajusta todos los coeficientes en cada paso)

               class_weight="balanced", #Este es el parametro que maneja el desbalance de clases (por la cantidad desigual de opiniones por ODS)
               solver="lbfgs" #Este es un algoritmo que usa el modelo para manejar los coeficientes de los términos
        ))
    ])
    return pipeline


#Creamos un conjunto de validación simple para probar el entrenamiento
def crear_conjunto_validacion(ROOT_DIR):
    data_dir = os.path.join(ROOT_DIR, 'data')  #En la carpeta data
    #Nos aseguramos de que la carpeta data exista
    os.makedirs(data_dir, exist_ok=True)

    #Rutas de los archivos
    val_path  = os.path.join(data_dir, "val_set.csv")
    train_path= os.path.join(data_dir, "training_data.csv")
    datos_base_proyecto_xlsx = os.path.join(data_dir, "Datos_proyecto.xlsx")

    #Si ya existe el conjunto de validación, no lo creamos de nuevo
    if os.path.exists(val_path):
        return

    # Cargamos los datos de entrenamiento históricos si existen, sino cargamos los datos originales de la etapa 1 del proyecto
    if os.path.exists(train_path):
        df = pd.read_csv(train_path)
    elif os.path.exists(datos_base_proyecto_xlsx):
        df = pd.read_excel(datos_base_proyecto_xlsx)
    else:
        print("No se encontraron datos de entrenamiento.")
        return

    #Ahora nos aseguramos de que las columnas estén bien
    df = df[['textos','labels']].dropna() #Que no haya valores nulos
    df['textos'] = df['textos'].astype(str) #Asegurarnos de que todos los textos sean strings
    df['labels'] = df['labels'].astype(int) #Asegurarnos de que todas las etiquetas sean enteros

    #Ahora dividimos en conjunto de entrenamiento y validación
    #Usamos stratify para que la proporción de clases en ambos conjuntos el 20% de validación mantennga las mismas proporciones de cada clase (ODS)
    X_train, X_val, y_train, y_val = train_test_split(df['textos'], df['labels'], test_size=0.2, stratify=df['labels'], random_state=42)

    #Guardamos el conjunto de validación en un CSV para usarlo después
    validacion_df = pd.DataFrame({'textos': X_val, 'labels': y_val})
    validacion_df.to_csv(val_path, index=False)

    #Guardamos el conjunto de entrenamiento actualizado (80% de los datos originales) en un CSV para usarlo después
    entrenamiento_df = pd.DataFrame({'textos': X_train, 'labels': y_train})
    entrenamiento_df.to_csv(train_path, index=False)


#Ahora si entrenamos el pipeline completo con los datos de la etapa 1 del proyecto
#Ponemos main para que solo se ejecute si corremos este archivo directamente, y no si lo importamos desde otro archivo
#Esto es para que no se ejecute el entrenamiento del modelo con los datos de la etapa 1 si solo queremos importar la función creacion_del_pipeline desde otro archivo para otros propósitos
if __name__ == "__main__":

    #Nos aseguramos de crear el conjunto de validación si no existe
    crear_conjunto_validacion(ROOT_DIR)

    data_dir = os.path.join(ROOT_DIR, 'data')  #La carpeta data
    #Nos aseguramos de que la carpeta data exista
    os.makedirs(data_dir, exist_ok=True)
    
    #Rutas de los archivos
    train_path= os.path.join(data_dir, "training_data.csv")
    datos_base_proyecto_xlsx = os.path.join(data_dir, "Datos_proyecto.xlsx")

    #Cargamos los datos de entrenamiento históricos si existen, sino cargamos los datos originales de la etapa 1 del proyecto
    if os.path.exists(train_path):
        df = pd.read_csv(train_path)
    else:
        df = pd.read_excel(datos_base_proyecto_xlsx)


    #Separemos en x y y que son las variables que usaremos para entrenar el modelo
    #X es la columna "texto" y y es la columna "etiqueta"
    X = df["textos"].astype(str).tolist() #Aqui estamos haciendo astype(str) para asegurarnos de que todos los textos sean strings
    y = df["labels"].tolist()
    
    #Creamos el pipeline
    pipeline = creacion_del_pipeline()

    #Entrenamos el pipeline con X y y
    #Esto hace todo el flujo completo, es decir, hace preprocesamiento, tf-idf y entrenamiento del modelo de Regresión Logística
    pipeline.fit(X, y)

    #Guardaremos el modelo entrenado con joblib
    #Configuramos la ruta para guardar el modelo entrenado en la carpeta models para que quede todo organizado
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models', 'pipeline_ods_model_entrenado.joblib'))
    #Guardamos el pipeline entrenado en la ruta especificada
    joblib.dump(pipeline, model_path)

    #Ahora el modelo ya está entrenado y guardado, listo para hacer predicciones en nuevos textos
    #Esto quiere decir que el modelo del pipeline ya está listo para usarse (ya lo hemos entrenado y guardado)

    #Guardamos el dataset de entrenamiento para poder reentrenar el modelo en el futuro si es necesario
    if not os.path.exists(train_path):
        os.makedirs(os.path.dirname(train_path), exist_ok=True)
        df.to_csv(train_path, index=False)

    #Quedo guardado como training_data.csv en la carpeta data

    muestras = ["La educación de calidad es clave para el desarrollo", 
                "Necesitamos hospitales y vacunas para todos"]
    print(pipeline.predict(muestras))
