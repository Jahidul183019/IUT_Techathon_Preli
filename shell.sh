#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/dashboard"

BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

export VITE_API_URL="${VITE_API_URL:-https://iot-smart-home-dashboard.onrender.com}"
export VITE_WS_URL="${VITE_WS_URL:-wss://iot-smart-home-dashboard.onrender.com/ws}"

BACKEND_PID=""
FRONTEND_PID=""

log() {
  printf '[run] %s\n' "$*"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    exit 1
  fi
}

port_is_busy() {
  local port="$1"
  (echo >/dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1
}

cleanup() {
  log "Stopping servers..."
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  wait "$FRONTEND_PID" "$BACKEND_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

require_command python3
require_command npm

if port_is_busy "$BACKEND_PORT"; then
  printf 'Backend port %s is already in use. Stop that process or set BACKEND_PORT.\n' "$BACKEND_PORT" >&2
  exit 1
fi

if port_is_busy "$FRONTEND_PORT"; then
  printf 'Frontend port %s is already in use. Stop that process or set FRONTEND_PORT.\n' "$FRONTEND_PORT" >&2
  exit 1
fi

if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
  log "Creating backend virtual environment..."
  python3 -m venv "$BACKEND_DIR/.venv"
fi

if ! "$BACKEND_DIR/.venv/bin/python" -c "import fastapi, uvicorn" >/dev/null 2>&1; then
  log "Installing backend dependencies..."
  "$BACKEND_DIR/.venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  log "Installing frontend dependencies..."
  if [[ -f "$FRONTEND_DIR/package-lock.json" ]]; then
    (cd "$FRONTEND_DIR" && npm ci)
  else
    (cd "$FRONTEND_DIR" && npm install)
  fi
fi

log "Starting backend at http://localhost:$BACKEND_PORT"
(
  cd "$BACKEND_DIR"
  .venv/bin/python -m uvicorn main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT"
) &
BACKEND_PID="$!"

log "Starting frontend at http://localhost:$FRONTEND_PORT"
(
  cd "$FRONTEND_DIR"
  ./node_modules/.bin/vite --host "$FRONTEND_HOST" --port "$FRONTEND_PORT"
) &
FRONTEND_PID="$!"

cat <<EOF

Backend:  http://localhost:$BACKEND_PORT
Frontend: http://localhost:$FRONTEND_PORT

Press Ctrl-C to stop both.
EOF

wait "$BACKEND_PID" "$FRONTEND_PID"
