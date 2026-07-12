# Custom fonts

Drop `.ttf` files into this folder to make them available in the desktop **Fonts** right-click menu.

- The site reads `manifest.json` in this folder at runtime.
- `node vintage-site/build-manifests.js` regenerates that manifest locally.
- Netlify/Cloudflare builds run `build-manifests.js` automatically on deploy.

Example font URL after upload:

```
content/_assets/private/fonts/YourFont.ttf
```
