# Echo Trail

A Windows 95-styled desktop app for applying retro image effects, all rendered client-side in a single HTML file. Drop in an image and layer topographic contours, dither, film grain, VHS scanlines, screen tear, vertical misalignment, motion echo, moire fingerprint texture, and a glitched-out "Fucked" mode.

## Running it

Echo Trail is a single self-contained `index.html` file with no build step and no dependencies. Open it directly in any modern browser, or serve it statically:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

It also works great hosted on GitHub Pages — just point Pages at the repo root.

## Effects

- **Topographic** — posterizes luminance into contour bands with configurable palettes
- **Dither** — ordered (Bayer 4x4) dithering with adjustable levels and grayscale
- **Film Grain** — smooth, continuous hash-noise grain (no blocky artifacts)
- **Scanlines / VHS** — chroma aberration, tracking noise, vignette
- **Screen Tear** — dramatic horizontal tear bands with adjustable shift and asymmetry
- **V-Misalign** — glitchy vertical band displacement with occasional channel splitting
- **Motion Echo** — symmetric zoom-echo trail
- **Moire** — warped contour-line fingerprint texture
- **Fucked mode** — cranks everything into glitchy, fluorescent chaos in one click

Every parameter has its own on/off toggle, so effects can be mixed and matched independently. Export renders at full source resolution as a PNG.

## Credit

created by dr vincent j laguardia
