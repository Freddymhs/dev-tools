#!/bin/bash
# Genera los videos de fixture para los tests (solo si no existen)
set -e
cd "$(dirname "$0")"

if [ ! -f "short.mp4" ]; then
  echo "Creando short.mp4 (3s)..."
  ffmpeg -f lavfi -i "color=c=blue:size=320x240:duration=3" \
         -f lavfi -i "sine=frequency=440:duration=3" \
         -c:v libx264 -c:a aac -t 3 short.mp4 -y -loglevel error
  echo "✅ short.mp4 listo"
fi

if [ ! -f "long.mp4" ]; then
  echo "Creando long.mp4 (90s)..."
  ffmpeg -f lavfi -i "color=c=red:size=320x240:duration=90" \
         -f lavfi -i "sine=frequency=880:duration=90" \
         -c:v libx264 -c:a aac -t 90 long.mp4 -y -loglevel error
  echo "✅ long.mp4 listo"
fi

if [ ! -f "short.m4a" ]; then
  echo "Creando short.m4a (3s)..."
  ffmpeg -f lavfi -i "sine=frequency=440:duration=3" \
         -c:a aac -t 3 short.m4a -y -loglevel error
  echo "✅ short.m4a listo"
fi

echo "Fixtures de video listos."
