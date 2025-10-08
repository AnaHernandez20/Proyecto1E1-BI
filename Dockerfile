# 1) Imagen base ligera con Python 3.12
FROM python:3.12-slim

# 2) Ajustes de Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 3) (Opcional) Paquetes del sistema si alguna dependencia lo requiere
# RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# 4) Directorio de trabajo dentro del contenedor
WORKDIR /app

# 5) Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

#Tambien se requiere spaCy: modelo en español
RUN python -m spacy download es_core_news_sm

#Tambien se requiere NLTK
ENV NLTK_DATA=/home/appuser/nltk_data
RUN mkdir -p /home/appuser/nltk_data && \
    python -m nltk.downloader -d /home/appuser/nltk_data punkt stopwords wordnet

# 6) Copiar el código de la aplicación (carpetas app/, src/, models/, data/, etc.)
COPY . .

# 7) Crear y usar un usuario no-root (buena práctica de seguridad)
RUN useradd -u 1000 -m appuser && chown -R appuser:appuser /app
USER appuser

# 8) Documentar el puerto interno
EXPOSE 8000

# 9) Comando por defecto: ejecutar FastAPI con Uvicorn
CMD ["uvicorn", "app.api:app", "--host", "0.0.0.0", "--port", "8000"]
