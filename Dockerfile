FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=utf-8

WORKDIR /app

# Install uv for fast resolution
RUN pip install uv

# Copy package config
COPY pyproject.toml .

# Install dependencies using uv to system python
RUN uv pip install --system -e .

# Copy backend code
COPY backend/ ./backend/

WORKDIR /app/backend

# Cloud Run injects PORT environment variable (default 8080)
EXPOSE 8080

# Run uvicorn server
CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT:-8080}"]
