# Use an official lightweight Python image
FROM python:3.11-slim

# Set the working directory to /app
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Run the FastAPI application using Uvicorn
# Replace 'main:app' if your file or app variable is named differently
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]