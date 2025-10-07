#Este archivo lo usamos para crear la API para la pagina web
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score
import joblib
import os, sys
from sklearn.model_selection import train_test_split

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
TRAIN_PATH = os.path.abspath(os.path.join(ROOT_DIR, 'data', 'training_data.csv'))

#Ahora la ruta de validacion
VAL_PATH = os.path.abspath(os.path.join(ROOT_DIR, 'data', 'val_set.csv'))

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

    #Hacemos algunas validaciones básicas para que no falle el entrenamiento por una mal entrada del usuario
    if not opiniones.textos or not opiniones.labels:
        raise HTTPException(status_code=422, detail="Se requieren textos y labels (tipos de ODS) no vacíos.")
    if len(opiniones.textos) != len(opiniones.labels):
        raise HTTPException(status_code=422, detail="textos y labels deben tener la misma longitud.")

    # Consolidar histórico + nuevos

    #Cargamos los datos historicos si es que existen    
    if os.path.exists(TRAIN_PATH):
        df_hist = pd.read_csv(TRAIN_PATH)
    #Si no existen datos historicos, creamos un DataFrame vacío
    else:
        df_hist = pd.DataFrame(columns=["textos","labels"])

    #Ahora agregamos los nuevos datos al historico
    df_nuevos = pd.DataFrame({"textos": opiniones.textos, "labels": opiniones.labels})
    #Juntamos los datos historicos con los nuevos
    df_historico_completo = pd.concat([df_hist, df_nuevos], ignore_index=True).dropna(subset=["textos","labels"])
    #Nos aseguramos de que los textos sean strings y las etiquetas enteros
    df_historico_completo["textos"] = df_historico_completo["textos"].astype(str)
    df_historico_completo["labels"] = df_historico_completo["labels"].astype(int)
    

    #Cargamos el conjunto de validación para evaluar el modelo después de entrenar
    if os.path.exists(VAL_PATH):
        #Leemos el conjunto de validación
        val_df = pd.read_csv(VAL_PATH)
        #Nos aseguramos de que no haya valores nulos y que los textos sean strings y las etiquetas enteros
        val_df = val_df.dropna(subset=["textos","labels"])
        val_df["textos"] = val_df["textos"].astype(str)
        val_df["labels"] = val_df["labels"].astype(int)

        #Nos aseguramos de que no haya datos repetidos entre el conjunto de validación y el conjunto de entrenamiento
        train_df = df_historico_completo.merge(val_df, on=["textos","labels"], how="left", indicator=True)
        #Filtramos los datos que solo están en el conjunto de entrenamiento
        train_df = train_df[train_df["_merge"]=="left_only"].drop(columns=["_merge"])

        #Separamos en X e y para validar
        X_val = val_df["textos"].tolist()
        y_val = val_df["labels"].tolist()

    #Entrenamos el modelo con los datos historicos + nuevos
    modelo.fit(df_historico_completo["textos"].tolist(), df_historico_completo["labels"].tolist())

    #Ahora evaluamos el modelo con el conjunto de validación
    if os.path.exists(VAL_PATH):
        y_val_predicho = modelo.predict(X_val)
        #Calculamos precision, recall y f1-score
        #Aqui debemos usar average="weighted" y zero_division=0 para evitar errores (pues es obligatorio para multiclase)
        #Si no lo ponemos, puede tirar error pensando que es una clasificación binaria
        precision_val = precision_score(y_val, y_val_predicho, average='weighted', zero_division=0)
        recall_val = recall_score(y_val, y_val_predicho, average='weighted', zero_division=0)
        f1_val = f1_score(y_val, y_val_predicho, average='weighted', zero_division=0)
        metricas = {
            "precision": precision_val,
            "recall": recall_val,
            "f1_score": f1_val
        }
    else:
        precision_val = None
        recall_val = None
        f1_val = None

    #Ahora guardamos los nuevos datos en el CSV de datos historicos para no perderlos
    X_nuevos = df_nuevos["textos"].tolist()
    y_nuevos = df_nuevos["labels"].tolist()

    
    #Vamos a guardar los nuevos datos en el CSV de datos historicos para no perderlos
    df_nuevo = pd.DataFrame({"textos": X_nuevos, "labels": y_nuevos})
    if os.path.exists(TRAIN_PATH):
        df_nuevo.to_csv(TRAIN_PATH, mode='a', header=False, index=False)
    else:
        os.makedirs(os.path.dirname(TRAIN_PATH), exist_ok=True)
        df_nuevo.to_csv(TRAIN_PATH, index=False)


    #Guardamos el modelo actualizado con joblib para no perder el entrenamiento que hicimos (llego nuevo conocimiento)
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models', 'pipeline_ods_model_entrenado.joblib'))
    joblib.dump(modelo, model_path)

    #Devolvemos las metricas de evaluación en formato JSON para que la web las pueda interpretar
    return metricas

#Para correr la app de FastAPI con uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)