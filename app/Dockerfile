FROM python:3.11-slim

WORKDIR /app

# Omitimos la instalación de gcc ya que puede no ser necesario
# Si alguna dependencia lo requiere, lo agregaremos después

# Copiar requirements primero
COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Descargar el modelo español de spaCy
RUN python -m spacy download es_core_news_sm

# Crear estructura de directorios
RUN mkdir -p /app/models /app/data /app/src

# Copiar archivos de la aplicación
COPY app/*.py /app/
COPY src/ /app/src/
COPY models/ /app/models/
COPY data/ /app/data/

# Mostrar estructura para diagnóstico
RUN ls -la /app

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]