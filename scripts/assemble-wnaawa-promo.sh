#!/usr/bin/env bash
set -euo pipefail
ASSETS=/home/ubuntu/webdev-static-assets
OUT=$ASSETS/wnaawa-promo-video.mp4
DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$ASSETS/wnaawa-promo-voiceover.wav")
SEGMENT=$(awk "BEGIN { print ($DURATION + 3) / 3 }")
ffmpeg -y \
  -loop 1 -t "$SEGMENT" -i "$ASSETS/wnaawa-promo-still-1.png" \
  -loop 1 -t "$SEGMENT" -i "$ASSETS/wnaawa-promo-still-2.png" \
  -loop 1 -t "$SEGMENT" -i "$ASSETS/wnaawa-promo-still-3.png" \
  -i "$ASSETS/wnaawa-promo-voiceover.wav" \
  -filter_complex "[0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,zoompan=z='min(zoom+0.0007,1.08)':d=1:s=1280x720:fps=30,trim=duration=$SEGMENT,setpts=PTS-STARTPTS[v0];[1:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,zoompan=z='min(zoom+0.0007,1.08)':d=1:s=1280x720:fps=30,trim=duration=$SEGMENT,setpts=PTS-STARTPTS[v1];[2:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,zoompan=z='min(zoom+0.0007,1.08)':d=1:s=1280x720:fps=30,trim=duration=$SEGMENT,setpts=PTS-STARTPTS[v2];[v0][v1][v2]concat=n=3:v=1:a=0,trim=duration=$DURATION,setpts=PTS-STARTPTS[v]" \
  -map "[v]" -map 3:a -t "$DURATION" -r 30 -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "$OUT"
printf 'Created %s\n' "$OUT"
