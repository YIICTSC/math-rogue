#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCREENSHOT_DIR="$ROOT_DIR/release/steam/store-assets/screenshots"
OUTPUT_DIR="$ROOT_DIR/release/steam/store-assets/trailer"
PREVIEW_DIR="$ROOT_DIR/build/steam-trailer-previews"
OUTPUT_FILE="$OUTPUT_DIR/learning-rogue-gameplay-trailer.mp4"
FFMPEG_BIN="${FFMPEG_BIN:-$(command -v ffmpeg || true)}"

if [[ -z "$FFMPEG_BIN" || ! -x "$FFMPEG_BIN" ]]; then
  echo "Set FFMPEG_BIN to an executable ffmpeg binary." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR" "$PREVIEW_DIR"

FILES=(
  "01-title.jpg"
  "02-mode-selection.jpg"
  "03-adventure-map.jpg"
  "04-card-battle.jpg"
  "05-learning-quiz.jpg"
  "06-card-battle.jpg"
  "07-learning-quiz.jpg"
)

TITLES=(
  "学ぶほど、冒険が進む。"
  "学年とテーマを選んで冒険へ"
  "学校を舞台に進むローグライク"
  "集めたカードで戦略バトル"
  "正解が次の一手につながる"
  "小学生編・高校編・マジック編"
  "学習と多彩なミニゲームを一本に"
)

INPUT_ARGS=()
for file in "${FILES[@]}"; do
  INPUT_ARGS+=(-i "$SCREENSHOT_DIR/$file")
done
INPUT_ARGS+=(-stream_loop -1 -i "$ROOT_DIR/public/bgm/menu.mp3")

FILTER_FILE="$(mktemp "${TMPDIR:-/tmp}/learning-rogue-trailer.XXXXXX")"
SUBTITLE_FILE="$(mktemp "${TMPDIR:-/tmp}/learning-rogue-trailer.XXXXXX.ass")"
trap 'rm -f "$FILTER_FILE" "$SUBTITLE_FILE"' EXIT

cat >"$SUBTITLE_FILE" <<'EOF'
[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Hiragino Sans GB,54,&H00FFFFFF,&H00FFFFFF,&H00101010,&H00000000,-1,0,0,0,100,100,1.2,0,1,2,0,2,40,40,35,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:04.00,Default,,0,0,0,,学ぶほど、冒険が進む。
Dialogue: 0,0:00:04.00,0:00:08.00,Default,,0,0,0,,学年とテーマを選んで冒険へ
Dialogue: 0,0:00:08.00,0:00:12.00,Default,,0,0,0,,学校を舞台に進むローグライク
Dialogue: 0,0:00:12.00,0:00:16.00,Default,,0,0,0,,集めたカードで戦略バトル
Dialogue: 0,0:00:16.00,0:00:20.00,Default,,0,0,0,,正解が次の一手につながる
Dialogue: 0,0:00:20.00,0:00:24.00,Default,,0,0,0,,小学生編・高校編・マジック編
Dialogue: 0,0:00:24.00,0:00:28.00,Default,,0,0,0,,学習と多彩なミニゲームを一本に
EOF

for index in "${!FILES[@]}"; do
  cat >>"$FILTER_FILE" <<EOF
[$index:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,zoompan=z='min(zoom+0.00038,1.045)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=120:s=1920x1080:fps=30,fade=t=in:st=0:d=0.25,fade=t=out:st=3.75:d=0.25[v$index];
EOF
done

cat >>"$FILTER_FILE" <<EOF
[v0][v1][v2][v3][v4][v5][v6]concat=n=7:v=1:a=0[base];
[base]drawbox=x=0:y=926:w=1920:h=154:color=black@0.84:t=fill,subtitles='$SUBTITLE_FILE':fontsdir='/System/Library/Fonts'[video]
EOF

"$FFMPEG_BIN" -y \
  "${INPUT_ARGS[@]}" \
  -filter_complex_script "$FILTER_FILE" \
  -map "[video]" \
  -map 7:a:0 \
  -t 28 \
  -c:v libx264 \
  -preset medium \
  -b:v 8000k \
  -minrate 8000k \
  -maxrate 8000k \
  -bufsize 16000k \
  -x264-params "nal-hrd=cbr:filler=1" \
  -pix_fmt yuv420p \
  -r 30 \
  -c:a aac \
  -b:a 192k \
  -ar 48000 \
  -ac 2 \
  -movflags +faststart \
  "$OUTPUT_FILE"

for entry in "01:1.5" "02:9.5" "03:17.5" "04:25.5"; do
  name="${entry%%:*}"
  second="${entry##*:}"
  "$FFMPEG_BIN" -y -ss "$second" -i "$OUTPUT_FILE" -frames:v 1 \
    "$PREVIEW_DIR/preview-$name.png" >/dev/null 2>&1
done

echo "Generated $OUTPUT_FILE"
