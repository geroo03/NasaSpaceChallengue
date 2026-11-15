#!/bin/bash
# Join scene files without re-encoding, then add the music (video copied).
set -e
f=$1; name=$2
cd /home/claude/cine/out_$f
ls s0*.mp4 | grep -v tmp | sort | sed "s/^/file '/;s/$/'/" > list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i list.txt -c copy video.mp4
ffmpeg -y -loglevel error -i video.mp4 -i ../musica.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart ../$name.tmp.mp4
mv ../$name.tmp.mp4 ../$name.mp4
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate,codec_name -of compact ../$name.mp4
