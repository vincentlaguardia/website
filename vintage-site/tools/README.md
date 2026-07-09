# Tools

## Embed JPG cover art into MP4 (FFmpeg)

Use `embed-mp4-cover-art.sh` to attach a JPG/JPEG image to an MP4 as cover art.

```bash
cd vintage-site
chmod +x ./tools/embed-mp4-cover-art.sh
./tools/embed-mp4-cover-art.sh <input.mp4> <cover.jpg> [output.mp4]
```

Examples:

```bash
./tools/embed-mp4-cover-art.sh ryan_gosling_cereal.mp4 ryan_gosling_cereal.jpg
./tools/embed-mp4-cover-art.sh ryan_gosling_cereal.mp4 ryan_gosling_cereal.jpg ryan_gosling_cereal-with-cover.mp4
```

Notes:

- Requires `ffmpeg` (no other dependency).
- If `output.mp4` is omitted, the script writes `<input>-with-cover.mp4`.
- The script does basic argument/file validation and prints clear errors.
- Embedded cover art support varies by app/desktop environment. Some file managers still generate video thumbnails from video frames, not attached cover metadata.
- After you confirm the output looks correct in your target app/player, you can delete or move the separate JPG file.
