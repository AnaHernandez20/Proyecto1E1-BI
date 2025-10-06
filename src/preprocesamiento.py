#Este archivo es el encargado de limpiar los textos
#Aqui vamos a tener todas las funciones que sean justo para el preprocesamiento de los textos (opiniones de ods)

"""
Flujo por defecto de preprocesar las opiniones:
 1) Pasamos todo a minusculas
 2) Eliminamos signos de puntuación (no incluye tildes), pero si puntos, comas, comillas, entre otros.
 3) Reemplazamos números por su equivalente en palabras
 4) **Tokenización:** dividimos las frases o las oraciones en tokens (palabras)
 5) **Lematización:** llevamos cada palabra o token a su base gramatical (comimos -> comer)
 6) **Normalización:** aplicamos la función que reduce ruido en los tokens para poder unificar el texto. Dentro de eso:
 - 1. Eliminamos stopwords
 - 2. Quitamos las tildes, que no estaban incluidas en la vez que quitamos los signos de puntuación
 - 3. Nos aseguramos de no dejar palabras vacías 
 7) Preparamos los documentos como strings, unimos los tokens finales dejando un espacio entre ellos
"""

#Importamos librerías necesarias

#re nos permite usar expresiones regulares
import re
import string
import unicodedata

import nltk

#num2words nos permite convertir números a palabras
from num2words import num2words

from nltk.corpus import stopwords

#Usamos word_tokenize de nltk para tokenizar de forma sencilla, en lugar de usar split()
from nltk.tokenize import word_tokenize

#Punkt nos permite tokenizar (dividir en palabras los textos)
nltk.download('punkt')

#Descargar palabras vacías (stopwords) en español 
nltk.download('stopwords')
stopwords_espanol = set(stopwords.words('spanish'))

#Spacy nos permite lematizar (llevar las palabras a su forma base)
import spacy

#Cargar el modelo de spaCy para español
nlp = spacy.load("es_core_news_sm")

# 1) Pasamos todo a minusculas
def pasar_minusculas(token: str):
    return token.lower()

# 2) Eliminamos signos de puntuación (no incluye tildes), pero si puntos, comas, comillas, entre otros.
def eliminar_puntuacion(token: str):
    return token.translate(str.maketrans('', '', string.punctuation))

# 3) Reemplazamos números por su equivalente en palabras
def reemplazar_numeros_token(token: str):
    return num2words(token, lang='es') if token.isdigit() else token

# 4) Tokenización: dividimos las frases o las oraciones en tokens (palabras) y las limpiamos 
def tokenizar(texto):
    #Usamos la función word_tokenize de nltk para tokenizar el texto
    return word_tokenize(texto, language='spanish')

#Limpiamos los tokens con las funciones anteriores
def limpiar_tokens(tokens):
    tokens_limpios = []
    for token in tokens:
        token = pasar_minusculas(token)
        token = eliminar_puntuacion(token)
        token = reemplazar_numeros_token(token)
        if token:  # Asegurarnos de que el token no esté vacío
            tokens_limpios.append(token)
    return tokens_limpios

# 5) Lematización: llevamos cada token a su base gramatical 
def lematizar_los_tokens(tokens):
    if not tokens:
        return []
    #Creamos un doc de spaCy a partir de los tokens, pues asi spacy hace la lematización
    doc = nlp(" ".join(tokens))
    #token.lemma_ devuelve la raíz de cada token
    return [token.lemma_ for token in doc if not token.is_space]  #Aqui nos aseguramos de no incluir espacios vacios
        
# 6.1 Quitamos las stopwords
def eliminar_stopwords(tokens):
    return [token for token in tokens if token not in stopwords_espanol]

# 6.2 Quitamos las tildes
def quitar_tildes(tokens):
    return [unicodedata.normalize('NFD', token).encode('ascii', 'ignore').decode('utf-8') for token in tokens]

# 6.3 Normalizamos y nos aseguramos de no dejar palabras vacías
def normalizar(tokens):
    tokens = eliminar_stopwords(tokens)
    tokens = quitar_tildes(tokens)
    tokens = [token for token in tokens if token]  #Esto es para asegurarnos de que no queden palabras vacías
    return tokens #Aqui estamos devolviendo los tokens ya normalizados

#Hacemos la funcion que hace todo el flujo de preprocesamiento completo con las funciones anteriores
def preprocesar_texto(texto: str) -> str:
    """
    Como mencionamos, aqui hacemos
    1. Minusculas
    2. Quitar puntuación
    3. Reemplazar números por palabras
    4. Tokenizar
    5. Lematizar
    6. Normalizar
    Al final tendremos un string con el texto preprocesado listo para hacerle tf-idf y aplicar el modelo de Machine Learning
    """
    if texto is None:
        texto = ""  #Equivale al fillna("") que haciamos en pandas en las transformaciones de la etapa 1 del proyecto

    texto = pasar_minusculas(texto)
    texto = eliminar_puntuacion(texto)
    toks = tokenizar(texto)
    toks = limpiar_tokens(toks)
    toks = lematizar_los_tokens(toks)
    toks = normalizar(toks)
    #Recordemos que, asi como en la etapa 1 del proyecto, todos los documentos se llaman corpus
    #Lo que haciamos era preparar los documentos como strings, uniendo los tokens finales dejando un espacio entre ellos
    #Antes haciamos un fillna(), pero aca no porque es un texto, no un dataframe (lo manejamos al inicio de la función)

    return " ".join(toks)  #Aqui hacemos justo eso, devolvemos el texto preprocesado como un string