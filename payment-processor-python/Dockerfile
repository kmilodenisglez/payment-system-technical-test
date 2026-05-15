FROM python:3.12-slim

WORKDIR /app

# Copy dependency list first (layer cache optimisation)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY src ./src

EXPOSE 5000

CMD ["python3", "src/server.py"]
