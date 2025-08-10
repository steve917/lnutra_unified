FROM python:3.11-slim

# Avoid Python buffering and set working directory
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

COPY pyproject.toml /app/
RUN pip install --no-cache-dir -U pip && \
    pip install --no-cache-dir uv && \
    uv pip install --system -r <(python -c "import tomllib, sys; print('\n'.join(__import__('tomllib').loads(open('pyproject.toml','rb').read()).get('project',{}).get('dependencies',[])))")

COPY app /app/app

EXPOSE 9000
CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "9000"]