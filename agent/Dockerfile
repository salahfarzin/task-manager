FROM python:3.11-slim

WORKDIR /app

# Install system deps (git + Node.js for npm test runner, aider needs git)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install aider
RUN pip install --no-cache-dir aider-chat

COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

COPY . .

ENV PYTHONUNBUFFERED=1
ENV REPO_PATH=/repo

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
