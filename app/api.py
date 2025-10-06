#Este archivo lo usamos para crear la API para la pagina web
from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score
import joblib
import os, sys

#Para poder hacer el preprocesamiento igual que en el pipeline, importamos la clase PreprocesamientoPersonalizado
#Esto es para poder importar desde la carpeta src (que está fuera de app que es la carpeta donde está este archivo api.py)
BASE_DIR = os.path.dirname(__file__) # .../Proyecto1E1-BI/app
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, '..')) # .../Proyecto1E1-BI
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)        
from src.pipeline_ods import PreprocesamientoPersonalizado

#Ahora la ruta para guardar los datos de entrenamiento historicos (o sea todos los datos con los que se entrenó el modelo acumuladamente)
#Este acumulado de datos lo vamos a guardar en un CSV para no perderlo al reiniciar la app y poder seguir entrenando el modelo con nuevos datos
#La ruta será dentro de la carpeta data que está en la raíz del proyecto
#Esto lo usaremos en el endpoint /entrenar
TRAIN_LOG_PATH = os.path.abspath(os.path.join(ROOT_DIR, 'data', 'training_data.csv'))

#Creamos la app de FastAPI que es la que va a manejar la API
app = FastAPI()

#Definimos la estructura de los datos que vamos a recibir en la API
#En este caso, una lista de uno o más textos (opiniones) para clasificar en ODS
class OpinionesEntrada(BaseModel):
    textos: list[str]

#Definimos la estructura de los datos que vamos a recibir para entrenar el modelo
#En este caso, una lista de textos (opiniones) y una lista de etiquetas (ODS) correspondientes
class OpinionEntrenamiento(OpinionesEntrada):
    labels: list[int]

#Cargamos el modelo entrenado que habiamos guardado en un archivo .joblib gracias al pipeline que creamos en pipeline_ods.py
model = None

#Funcion para cargar el modelo solo una vez
def cargar_modelo():
    #Cargar el modelo entrenado
    global model
    #Si el modelo ya fue cargado, no lo tenemos que cargar de nuevo
    if model is None:
        model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models', 'pipeline_ods_model_entrenado.joblib'))
        model = joblib.load(model_path)
    return model

#Para que cuando entremos a la raiz de la API ("/") nos devuelva un mensaje de bienvenida y nos ubiquemos
@app.get("/")
def raiz():
    return {"mensaje": "API de clasificar opiniones en ODS está funcionando. "
    "Usa el endpoint /predecir para predecir ODS. "
    "Usa el endpoint /entrenar para entrenar el modelo con nuevas opiniones."}

@app.post("/predecir")
#Endpoint para predecir el ODS de nuevas opiniones
def predecir_opiniones(opiniones: OpinionesEntrada):
    #Cargamos el modelo entrenado
    modelo = cargar_modelo()
    #Realizamos predicción sobre todas las opiniones recibidas
    predicciones = modelo.predict(opiniones.textos)
    #Devolvemos las predicciones como lista y en formato JSON para que la web las pueda interpretar
    return {"predicciones": predicciones.tolist()}

@app.post("/entrenar")
#Endpoint para entrenar el modelo con nuevas opiniones y sus ODS (etiquetas)
def entrenar_modelo(opiniones: OpinionEntrenamiento):
    #Cargamos el modelo actual
    modelo = cargar_modelo()

    #Convertimos los nuevos datos en DataFrame para estar ordenados
    entrenamiento_df = pd.DataFrame({'textos': opiniones.textos, 'labels': opiniones.labels})

    #Separamos en X e y (opiniones o variable independiente e y la variable dependiente o etiqueta)
    #Hasta aqui estamos trabajando con los nuevos datos que nos llegaron para entrenar
    X_nuevos = [str(t) for t in opiniones.textos] #Por si acaso llega algo que no es string, lo convertimos a string
    y_nuevos = opiniones.labels

    #Vamos a entrenar el modelo con los nuevos datos y con los datos historicos que ya teniamos guardados en el CSV (acumulado)
    #Vamos a cargar los datos historicos si es que existen
    X_total, y_total = X_nuevos, y_nuevos
    if os.path.exists(TRAIN_LOG_PATH):
        historico_actual = pd.read_csv(TRAIN_LOG_PATH)
        #Agregamos los datos historicos a los nuevos para tener todo el conjunto de entrenamiento
        X_total = historico_actual["textos"].astype(str).tolist() + X_nuevos
        y_total = historico_actual["labels"].tolist() + y_nuevos

    #Entrenamos el modelo con todos los datos (los nuevos y los historicos)
    modelo.fit(X_total, y_total)

    #Vamos a guardar los nuevos datos en el CSV de datos historicos para no perderlos
    df_nuevo = pd.DataFrame({"textos": X_nuevos, "labels": y_nuevos})
    if os.path.exists(TRAIN_LOG_PATH):
        df_nuevo.to_csv(TRAIN_LOG_PATH, mode='a', header=False, index=False)
    else:
        os.makedirs(os.path.dirname(TRAIN_LOG_PATH), exist_ok=True)
        df_nuevo.to_csv(TRAIN_LOG_PATH, index=False)

    #Calculamos las metricas de evaluación en los nuevos datos por ello primero predecimos con los nuevos datos (con los que entrenamos)
    #Aunque no es lo ideal, al menos nos da una idea de cómo está funcionando el modelo con los nuevos datos (deberia ser ideal)
    y_predicho = modelo.predict(X_nuevos)

    #Calculamos precision, recall y f1-score
    #Aqui debemos usar average="wighted" y zero_division=0 para evitar errores (pues es obligatorio para multiclase)
    #Si no lo ponemos, puede tirar error pensando que es una clasificación binaria
    precision = precision_score(y_nuevos, y_predicho, average='weighted', zero_division=0)
    recall = recall_score(y_nuevos, y_predicho, average='weighted', zero_division=0)
    f1 = f1_score(y_nuevos, y_predicho, average='weighted', zero_division=0)

    #Guardamos el modelo actualizado con joblib para no perder el entrenamiento que hicimos (llego nuevo conocimiento)
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models', 'pipeline_ods_model_entrenado.joblib'))
    joblib.dump(modelo, model_path)

    #Devolvemos las metricas de evaluación en formato JSON para que la web las pueda interpretar
    metricas = {
        "precision": precision,
        "recall": recall,
        "f1_score": f1
    }

    return metricas

#Para correr la app de FastAPI con uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)