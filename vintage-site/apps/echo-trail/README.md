# Echo Trail

A Windows 95-styled desktop app for applying retro image effects, all rendered client-side in a single HTML file. Drop in an image and layer topographic contours, dither, film grain, VHS scanlines, screen tear, vertical misalignment, motion echo, moire fingerprint texture, distortion glitches, and a text overlay — all with per-effect toggles and real-time preview.

## Running it

Echo Trail is a single self-contained `index.html` file with no build step and no dependencies. Open it directly in any modern browser, or serve it statically:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

It also works great hosted on GitHub Pages — just point Pages at the repo root.

## Effects

- **Topographic** — posterizes luminance into contour bands with configurable palettes
- **Dither** — ordered (Bayer 4×4) dithering with adjustable levels and grayscale
- **Film Grain** — smooth, continuous hash-noise grain (no blocky artifacts)
- **Scanlines / VHS** — chroma aberration, tracking noise, vignette
- **Screen Tear** — dramatic horizontal tear bands with adjustable shift and asymmetry
- **V-Misalign** — glitchy vertical band displacement with occasional channel splitting
- **Motion Echo** — symmetric zoom-echo trail
- **Moire** — warped contour-line fingerprint texture
- **Dr. Pastrami mode** — cranks everything into glitchy, fluorescent chaos in one click (button label in the UI)

### New: Text Overlay

Add editable text on top of the processed image with full compositing controls and text-only distortion effects:

| Control | Range | Description |
|---------|-------|-------------|
| Text | (text input) | Content to render |
| Stretch | 0–100 | Repeats text pixels in horizontal bands for a smear effect |
| Warp | 0–100 | Applies smooth noise-based displacement to the text layer |
| V-Tear | 0–100 | Adds a vertical rip to the text layer |
| H-Tear | 0–100 | Adds a horizontal rip to the text layer |
| Img Opacity | 0–100 % | Darkens the distorted text layer toward black before compositing |
| Font | dropdown | Built-in font or uploaded custom font |
| ↑ Font | button | Upload a custom font file |
| Font Size | 8–200 px | Pixel size at preview resolution; scales proportionally on full-res export |
| Color | color picker | Text fill color |
| X Pos | 0–100 % | Horizontal position as a percentage of canvas width |
| Y Pos | 0–100 % | Vertical position as a percentage of canvas height |
| Rotation | −180–180 ° | Text rotation in degrees |
| Text Opacity | 0–100 % | Layer opacity of the text |
| Blend | dropdown | How text is composited onto the image (see below) |
| Drag on canvas | (mouse drag) | Reposition the text by clicking and dragging directly on the preview |

**Toggle the "Text" button** to enable/disable the overlay. The text is re-editable and repositionable at any time before export, and the Stretch / Warp / V-Tear / H-Tear / Img Opacity controls now affect only the text layer.

## Font Upload

Supported formats: `.ttf`, `.otf`, `.woff`, `.woff2`

Click **↑ Font** to pick a font file. The font is loaded via the `FontFace` API and added to the Font dropdown immediately. Uploaded fonts persist for the current browser session only (they are not saved to disk).

## Text Blend Modes

| Mode | Behaviour | Implementation |
|------|-----------|----------------|
| Normal | Standard alpha compositing | Native `source-over` |
| Additive | Text colours add to image colours; bright text brightens the image | Native `lighter` |
| Subtractive | Image colours are reduced by text colour values; bright text darkens | Pixel fallback: `dst − src` |
| Exclusion | Inverts mid-tones; blacks/whites have no effect | Native `exclusion` |
| Division | Image is brightened proportional to inverse of text colour | Pixel fallback: `(dst / src) × 255` |

**Pixel fallback note:** Subtractive and Division are not natively supported by the Canvas 2D API. Echo Trail renders the text to an offscreen canvas and blends pixel-by-pixel, which is correct but slower on very large images.

## Known Limitations

- **Warp** and **pixel-blend text** (Subtractive / Division) iterate every pixel and can be slow on images near the 2400 px cap. All other effects are fast.
- Custom uploaded fonts are not persisted across page reloads.
- Text is always rendered as a single flat layer; the text input is single-line only.

## Credit

created by dr vincent j laguardia
