#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
command -v docker >/dev/null 2>&1 || { echo '请先安装 Docker Engine。' >&2; exit 1; }
docker compose version >/dev/null
docker info >/dev/null
if [ ! -f .env ]; then
  docker run --rm --user "$(id -u):$(id -g)" --volume "$PWD:/work" --workdir /work node:24-alpine node scripts/setup.mjs
fi
docker compose config --quiet
docker compose up -d --build --wait --wait-timeout 90
printf '%s\n' 'ClawDeck 已启动。默认仅监听服务器 127.0.0.1:3210。' '请通过 SSH 隧道访问，用 .env 中的 PANEL_PASSWORD 登录。' '首次接入后，请在实例概览运行接入自检。'
