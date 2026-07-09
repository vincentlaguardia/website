#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Embed a JPG as attached cover art into an MP4.

Usage:
  ./tools/embed-mp4-cover-art.sh <input.mp4> <cover.jpg> [output.mp4]

Examples:
  ./tools/embed-mp4-cover-art.sh video.mp4 cover.jpg
  ./tools/embed-mp4-cover-art.sh video.mp4 cover.jpg video-with-cover.mp4
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Error: expected 2 or 3 arguments." >&2
  usage >&2
  exit 1
fi

input_mp4="$1"
cover_jpg="$2"
output_mp4="${3:-${input_mp4%.mp4}-with-cover.mp4}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Error: ffmpeg is not installed or not in PATH." >&2
  exit 1
fi

if [[ ! -f "$input_mp4" ]]; then
  echo "Error: input MP4 not found: $input_mp4" >&2
  exit 1
fi

if [[ ! -f "$cover_jpg" ]]; then
  echo "Error: JPG cover image not found: $cover_jpg" >&2
  exit 1
fi

shopt -s nocasematch
if [[ ! "$input_mp4" =~ \.mp4$ ]]; then
  echo "Error: first argument must be an .mp4 file." >&2
  exit 1
fi

if [[ ! "$cover_jpg" =~ \.jpe?g$ ]]; then
  echo "Error: second argument must be a .jpg or .jpeg file." >&2
  exit 1
fi
shopt -u nocasematch

if [[ -e "$output_mp4" ]]; then
  echo "Error: output file already exists: $output_mp4" >&2
  exit 1
fi

ffmpeg -i "$input_mp4" -i "$cover_jpg" \
  -map 0 -map 1 -c copy \
  -disposition:v:1 attached_pic \
  -metadata:s:v:1 title="Cover" \
  -metadata:s:v:1 comment="Cover (front)" \
  "$output_mp4"

echo "Done: wrote $output_mp4"
