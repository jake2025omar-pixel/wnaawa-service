#!/usr/bin/env bash
set -euo pipefail
ASSETS=/home/ubuntu/webdev-static-assets
TOUR=$ASSETS/wnaawa-tour
OUT=$ASSETS/wnaawa-screen-tour-video.mp4
AUDIO=$ASSETS/wnaawa-screen-tour-voiceover.mp3
DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$AUDIO")
SEGMENT=$(awk "BEGIN { print ($DURATION + 3) / 4 }")
ffmpeg -y \
  -loop 1 -t "$SEGMENT" -i "$TOUR/overview.png" \
  -loop 1 -t "$SEGMENT" -i "$TOUR/rewards.png" \
  -loop 1 -t "$SEGMENT" -i "$TOUR/store.png" \
  -loop 1 -t "$SEGMENT" -i "$TOUR/admin.png" \
  -i "$AUDIO" \
  -filter_complex "[0:v]scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800,zoompan=z='min(zoom+0.0008,1.08)':d=1:s=1280x800:fps=30,trim=duration=$SEGMENT,setpts=PTS-STARTPTS[v0];[1:v]scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800,zoompan=z='min(zoom+0.0008,1.08)':d=1:s=1280x800:fps=30,trim=duration=$SEGMENT,setpts=PTS-STARTPTS[v1];[2:v]scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800,zoompan=z='min(zoom+0.0008,1.08)':d=1:s=1280x800:fps=30,trim=duration=$SEGMENT,setpts=PTS-STARTPTS[v2];[3:v]scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800,zoompan=z='min(zoom+0.0008,1.08)':d=1:s=1280x800:fps=30,trim=duration=$SEGMENT,setpts=PTS-STARTPTS[v3];[v0][v1][v2][v3]concat=n=4:v=1:a=0,trim=duration=$DURATION,setpts=PTS-STARTPTS[v]" \
  -map "[v]" -map 4:a -t "$DURATION" -r 30 -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "$OUT"
printf 'Created %s\n' "$OUT"
