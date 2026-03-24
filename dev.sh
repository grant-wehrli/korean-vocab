#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/korean-vocab"

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

MODE=${1:-dev}

if [ "$MODE" = "preview" ]; then
  echo "Building for production..."
  npm run build
  echo "Starting preview server at http://localhost:4173/korean-vocab/"
  npm run preview
else
  echo "Starting dev server at http://localhost:5173/korean-vocab/"
  npm run dev
fi
