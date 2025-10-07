# 1) Imagen base ligera con Python 3.12
FROM python:3.12-slim

# 2) Ajustes de Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 3) (Opcional) Instalar dependencias del sistema si alguna lo requiere
# RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# 4) Directorio de trabajo dentro del contenedor
WORKDIR /app

# 5) Copiar el archivo de dependencias e instalarlas
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5.1) Instalar el modelo de spaCy y los datos de NLTK dentro del contenedor
RUN python -m spacy download es_core_news_sm && \
    python - <<'PY'
import nltk
nltk.download('punkt')
nltk.download('stopwords')
PY

# 6) Este comando permite copiar el código de la aplicación ( El que se encuentra en app.py)
#Copiamos todo el contenido del proyecto al contenedor porque el archivo app/api.py importa código y datos desde otras carpetas del proyecto. 
#Esto significa que dentro del contenedor también debe existir la carpeta src/ y su contenido. 
#Ademas requiere archivos de datos y modelo

COPY . .

# 7) Crear y usar un usuario no root (buena práctica de seguridad)
RUN useradd -u 1000 -m appuser && chown -R appuser:appuser /app
USER appuser

# 8) Documentar el puerto interno donde correrá la API
EXPOSE 8000

# 9) Comando por defecto para ejecutar la API con uvicorn (FastAPI)
CMD ["uvicorn", "app.api:app", "--host", "0.0.0.0", "--port", "8000"]
