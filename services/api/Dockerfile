FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy pyproject and build a requirements.txt in a POSIX-safe way
COPY pyproject.toml /app/pyproject.toml
RUN python - <<'PY'\nimport tomllib, pathlib\np = pathlib.Path('/app/pyproject.toml')\nproj = tomllib.loads(p.read_bytes()).get('project', {})\ndeps = proj.get('dependencies', [])\npathlib.Path('/app/requirements.txt').write_text('\\n'.join(deps))\nPY

RUN pip install --no-cache-dir -U pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy app code
COPY app /app/app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
