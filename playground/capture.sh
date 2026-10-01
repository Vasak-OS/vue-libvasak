#!/usr/bin/env bash
# Capturas del banco de estados con Chrome sin pantalla.
#
#   bun run bench &                      # el servidor, en el 5174
#   playground/capture.sh <carpeta> [prefijo]
#
# Una imagen por sección y por tema, recortada a lo que tiene contenido. El
# panel del navegador integrado se cuelga con esta página; Chrome headless no.
set -euo pipefail
out="${1:?falta la carpeta de salida}"
prefix="${2:-}"
url="${BENCH_URL:-http://localhost:5174}"
mkdir -p "$out"
for theme in light dark; do
  for section in ${SECTIONS:-dropdown inputs buttons tooltip listcard tabs sidebar}; do
    file="$out/${prefix}${section}-${theme}.png"
    google-chrome-stable --headless=new --disable-gpu --hide-scrollbars \
      --window-size=1260,3000 --virtual-time-budget=6000 \
      --screenshot="$file" "$url/?only=$section&theme=$theme${BENCH_QUERY:-}" >/dev/null 2>&1
    magick "$file" -fuzz 1% -trim +repage -bordercolor "$(magick "$file" -format '%[pixel:p{1,1}]' info:)" -border 16 "$file"
    echo "$file"
  done
  # Lo que se dibuja contra la ventana —el diálogo, los avisos— se captura con
  # la ventana de cada ancho, no dentro de una caja.
  for width in ${WINDOW_WIDTHS:-}; do
    for section in ${WINDOW_SECTIONS:-dialog}; do
      file="$out/${prefix}${section}-${theme}-${width}.png"
      google-chrome-stable --headless=new --disable-gpu --hide-scrollbars \
        --window-size="$width,720" --virtual-time-budget=6000 \
        --screenshot="$file" "$url/?only=$section&theme=$theme&width=$width${BENCH_QUERY:-}" >/dev/null 2>&1
      echo "$file"
    done
  done
done
