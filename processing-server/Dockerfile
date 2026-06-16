# Use a slim Python 3.10 image to minimize footprint
FROM python:3.10-slim

# Set environment variables to optimize Python performance and logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy only requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies using --no-cache-dir to reduce final image size
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the source code
COPY . .

# Expose the port Cloud Run will expect (it sets the PORT env var)
EXPOSE 8000

# Use shell form of CMD so the $PORT environment variable is properly evaluated
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
