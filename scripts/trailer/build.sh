#!/usr/bin/env bash
# DOGEON trailer pipeline (D-096). Real OBS captures only (truth rule T3); cards use the game's own FONT/LOGO; original
# chiptune from music.mjs. Every segment length is a multiple of 0.5 s (one beat at 120 BPM), so every cut lands on a beat.
#   FF=/path/to/ffmpeg SRC=/mnt/c/Users/dulbi/Videos bash scripts/trailer/build.sh
# Outputs: tests/out/trailer/dogeon-trailer-16x9.mp4, dogeon-short-9x16.mp4 (1080p60 + music)
#          assets/video/trailer-720p.mp4 (+ .jpg poster) and 4 silent gallery loops (+ posters) for the landing.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd); FF=${FF:-ffmpeg}; V=${SRC:-/mnt/c/Users/dulbi/Videos}
OUT=$ROOT/tests/out/trailer; C=$OUT/cards; O=$OUT/seg; AV=$ROOT/assets/video
rm -rf "$O"; mkdir -p "$O" "$C" "$AV"
node "$ROOT/scripts/trailer/cards.mjs" "$ROOT/src/game.js" "$C" "$FF" >/dev/null && rm -f "$C"/*.rgba
MINT="$V/2026-11-13 00-16-22.mov"; HOOK="$V/2026-11-13 00-15-21.mov"; WAR="$V/2026-11-13 00-18-50.mov"; HEAL="$V/2026-11-13 00-19-17.mov"
BOSS="$V/2026-11-13 00-21-30.mov"; BAG="$V/2026-11-13 00-22-01.mov"; ARCH="$V/2026-11-13 00-22-11.mov"
ENC=(-c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p -r 60 -an -movflags +faststart)
BG=0x020307
# Source crops (1280x720 captures). Every crop removes the HUD price line and wallet USD/address (rule T8).
G=crop=728:468:340:105       # game, centered captures, HUD cropped off
GH=crop=726:427:104:105      # camp hook: also drop the bottom hint band (it shows wallet address + USD)
MENU=crop=590:246:172:236    # forge rows + status line, wallet/USD header cropped off
WAL=crop=346:610:934:14      # wallet "Transaction request" panel (open 4.0-5.9 s in the mint capture)
EXH=crop=900:506:8:14        # explorer tx #13, 16:9
EXV=crop=560:300:10:110      # explorer, hash + "Transferred #13 DOGEI"
BAGC=crop=572:325:418:180    # bag rows incl. "ON-CHAIN ITEMS (13): SAFE ON DEATH"
CW=delogo=x=619:y=305:w=18:h=22   # erase the parked mouse cursor (warrior capture)
CB=delogo=x=797:y=216:w=18:h=22   # erase the parked mouse cursor (boss capture)
VIC=crop=728:413:340:160     # boss chamber without the top toast band (old "GOLDEN YARN! +150 DOGE", false since D-097)
# D-097: the victory skips 7.3-8.1 s ("+1 DOGE" floaters from the removed coins); the warrior ends at the kill (coins drop after)
n=0; F=; : > $O/h.txt; : > $O/v.txt
out(){ n=$((n+1)); F=$(printf '%s/%02d_%s.mp4' $O $n "$1"); }
# clip <list> <src> <ss> <dur> <filter ending in [v]> [overlay pngs...]
clip(){ local list=$1 src=$2 ss=$3 dur=$4 fc=$5; shift 5; out "${KEEP:-clip}"; local ins=() ov="" i=1 last="[v]"
  for p in "$@"; do ins+=(-i "$p"); ov+=";${last}[$i]overlay=0:0[o$i]"; last="[o$i]"; i=$((i+1)); done
  $FF -v error -y -ss "$ss" -t "$dur" -i "$src" "${ins[@]}" -filter_complex "[0:v]${fc}${ov};${last}null[out]" -map "[out]" "${ENC[@]}" "$F"
  echo "file '$F'" >> $O/$list.txt; }
card(){ out card; $FF -v error -y -loop 1 -t "$3" -i "$2" -vf fps=60,format=yuv420p "${ENC[@]}" "$F"; echo "file '$F'" >> $O/$1.txt; }

# ---------- 16:9 trailer: 35.0 s ----------
H="scale=-2:1080:flags=neighbor,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=$BG,setsar=1"
clip h "$HOOK" 0.5 1.5 "$GH,$H[v]"
card h $C/h_hook.png 1.0
KEEP=warrior clip h "$WAR" 0.0 3.0 "$CW,$G,$H[v]" $C/h_t_warrior.png
card h $C/h_classes.png 1.0
clip h "$HEAL" 0.0 3.0 "$G,$H[v]" $C/h_t_healer.png
clip h "$ARCH" 0.3 2.5 "$G,$H[v]" $C/h_t_archer.png
card h $C/h_craft.png 1.0
KEEP=mint1 clip h "$MINT" 4.0 2.0 "split[a][b];color=$BG:1920x1080:r=60[bg];[a]$MENU,scale=1180:-2:flags=neighbor[m];[b]$WAL,scale=-2:860:flags=lanczos[w];[bg][m]overlay=90:294:shortest=1[t];[t][w]overlay=1340:110,setsar=1[v]"
KEEP=mint2 clip h "$MINT" 6.0 4.0 "$MENU,scale=1770:-2:flags=neighbor,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=$BG,setpts=PTS/2,setsar=1[v]"
KEEP=mint3 clip h "$MINT" 10.4 2.0 "$MENU,scale=1770:-2:flags=neighbor,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=$BG,setsar=1[v]"
KEEP=verified clip h "$MINT" 15.4 1.5 "$EXH,scale=1920:1080:flags=lanczos,tpad=stop_mode=clone:stop_duration=1,setsar=1[v]" $C/h_t_tx.png
clip h "$BAG" 0.3 1.5 "$BAGC,scale=1716:-2:flags=neighbor,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=$BG,setsar=1[v]" $C/h_t_bag.png
card h $C/h_boss.png 1.0
clip h "$BOSS" 0.3 2.5 "$CB,$G,$H[v]"
KEEP=victory1 clip h "$BOSS" 4.3 3.0 "$CB,$VIC,$H[v]"
KEEP=victory2 clip h "$BOSS" 8.1 0.5 "$CB,$VIC,$H,tpad=stop_mode=clone:stop_duration=1[v]"
card h $C/h_end.png 4.0

# ---------- 9:16 short: 30.0 s ----------
VG="scale=1080:-2:flags=neighbor,pad=1080:1920:0:(oh-ih)/2:color=$BG,setsar=1"
card v $C/v_hook.png 1.0
clip v "$WAR" 0.0 3.0 "$CW,$G,$VG[v]" $C/v_brand.png $C/v_t_warrior.png
clip v "$ARCH" 0.3 2.5 "$G,$VG[v]" $C/v_brand.png $C/v_t_archer.png
clip v "$HEAL" 0.0 2.5 "$G,$VG[v]" $C/v_brand.png $C/v_t_healer.png
card v $C/v_craft.png 1.0
clip v "$MINT" 4.0 2.0 "split[a][b];color=$BG:1080x1920:r=60[bg];[a]$MENU,scale=1062:-2:flags=neighbor[m];[b]$WAL,scale=-2:1000:flags=lanczos[w];[bg][m]overlay=9:270:shortest=1[t];[t][w]overlay=(W-w)/2:760,setsar=1[v]" $C/v_brand.png
clip v "$MINT" 6.0 4.0 "$MENU,scale=1062:-2:flags=neighbor,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=$BG,setpts=PTS/2,setsar=1[v]" $C/v_brand.png
clip v "$MINT" 10.4 2.0 "$MENU,scale=1062:-2:flags=neighbor,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=$BG,setsar=1[v]" $C/v_brand.png
clip v "$MINT" 15.4 1.5 "$EXV,scale=1080:-2:flags=lanczos,pad=1080:1920:0:(oh-ih)/2:color=$BG,tpad=stop_mode=clone:stop_duration=1,setsar=1[v]" $C/v_brand.png $C/v_t_tx.png
card v $C/v_boss.png 1.0
clip v "$BOSS" 0.3 2.5 "$CB,$G,$VG[v]" $C/v_brand.png
clip v "$BOSS" 4.3 3.0 "$CB,$VIC,$VG[v]" $C/v_brand.png
clip v "$BOSS" 8.1 0.5 "$CB,$VIC,$VG,tpad=stop_mode=clone:stop_duration=1[v]" $C/v_brand.png
card v $C/v_end.png 3.5

# ---------- music + final masters ----------
for k in h v; do
  node "$ROOT/scripts/trailer/music.mjs" $O/music_$k.wav $k >/dev/null
  $FF -v error -y -f concat -safe 0 -i $O/$k.txt -i $O/music_$k.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart $O/final_$k.mp4
done
mv $O/final_h.mp4 $OUT/dogeon-trailer-16x9.mp4; mv $O/final_v.mp4 $OUT/dogeon-short-9x16.mp4

# ---------- landing assets (B7 hero video, B4 gallery loops) ----------
$FF -v error -y -i $OUT/dogeon-trailer-16x9.mp4 -vf scale=1280:720:flags=lanczos -r 30 -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p \
  -c:a aac -b:a 96k -movflags +faststart $AV/trailer-720p.mp4
$FF -v error -y -ss 29.9 -i $OUT/dogeon-trailer-16x9.mp4 -frames:v 1 -vf scale=1280:720:flags=lanczos -q:v 3 $AV/trailer-720p.jpg
loop(){ # loop <name> <seg files...>: silent, 640 px, 30 fps, <= 1 MB, poster = middle frame
  local name=$1; shift; printf "file '%s'\n" "$@" > $O/loop_$name.txt
  $FF -v error -y -f concat -safe 0 -i $O/loop_$name.txt -vf scale=640:-2:flags=lanczos -r 30 -an -c:v libx264 -preset slow -crf 30 \
    -pix_fmt yuv420p -movflags +faststart $AV/$name.mp4
  local d; d=$( ($FF -i $AV/$name.mp4 2>&1 || true) | grep -o 'Duration: [0-9:.]*' | awk -F: '{print $4/2}')
  $FF -v error -y -ss "$d" -i $AV/$name.mp4 -frames:v 1 -q:v 3 $AV/$name.jpg; }
loop mint $O/*_mint1.mp4 $O/*_mint2.mp4 $O/*_mint3.mp4
loop verified $O/*_verified.mp4
loop warrior $O/*_warrior.mp4
loop victory $O/*_victory1.mp4 $O/*_victory2.mp4
$FF -v error -y -ss 3.6 -i $AV/victory.mp4 -frames:v 1 -q:v 3 $AV/victory.jpg   # poster on the VICTORY banner
ls -la $OUT/*.mp4 $AV
