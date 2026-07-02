#!/bin/bash
echo "========================================"
echo "  Address Autofill API Server (uv)"
echo "========================================"
echo

cd "$(dirname "$0")"

# 检查 uv 是否安装
if ! command -v uv &> /dev/null; then
    echo "uv not found, installing..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

echo "[1/2] Installing dependencies with uv..."
uv sync

echo
echo "[2/2] Starting server..."
echo
uv run server.py
