// Recursively scans the content/ folder next to this script and writes a
// manifest.json into content/ itself and into every nested subfolder,
// listing that folder's immediate contents (both files and subfolders).
// index.html fetches these manifest.json files at runtime to build any
// folder marked with a `syncFolder` path -- so dropping a file (or a whole
// nested folder of files) anywhere under content/ and pushing to GitHub is
// all it takes for it to show up on the live site, at any depth, with no
// HTML editing.
//
// Also scans content/_backgrounds/ for image files and writes
// content/_backgrounds/backgrounds-manifest.json for the desktop wallpaper
// picker. Drop an image into content/_backgrounds/ and push -- it will appear
// in "Change Background" after the next build.
//
// This runs automatically as the "build command" on Netlify / Cloudflare
// Pages every time you push new files -- you should not need to run it
// yourself. (If you ever do want to run it by hand: `node build-manifests.js`
// from inside the site folder, with Node.js installed.)

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');
const BACKGROUNDS_DIR = path.join(CONTENT_DIR, '_backgrounds');
const BACKGROUNDS_MANIFEST = path.join(BACKGROUNDS_DIR, 'backgrounds-manifest.json');
const URL_SAFE_TXT_BASE_RE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.svg']);

function isHidden(name) {
  return name.startsWith('.') || name.startsWith('_');
}

function formatDate(mtime) {
  const d = new Date(mtime);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function isUrlSafeTxtName(name) {
  if (path.extname(name).toLowerCase() !== '.txt') return false;
  const base = path.basename(name, '.txt');
  return URL_SAFE_TXT_BASE_RE.test(base);
}

function suggestUrlSafeTxtName(name) {
  const base = path.basename(name, '.txt').toLowerCase();
  const safeBase = base.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return (safeBase || 'file') + '.txt';
}

// Recursively builds (and writes) a manifest.json for folderPath, after
// first recursing into any subfolders so their own manifest.json files
// exist too. Returns the list of entries written for this folder.
function buildManifest(folderPath) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  const result = [];

  entries.forEach(entry => {
    if (isHidden(entry.name)) return;
    if (entry.name === 'manifest.json') return;

    const fullPath = path.join(folderPath, entry.name);
    const stat = fs.statSync(fullPath);

    if (entry.isDirectory()) {
      buildManifest(fullPath);
      result.push({ type: 'folder', name: entry.name, modified: formatDate(stat.mtime) });
    } else if (entry.isFile()) {
      const isTxt = path.extname(entry.name).toLowerCase() === '.txt';
      if (isTxt && !isUrlSafeTxtName(entry.name)) {
        const suggested = suggestUrlSafeTxtName(entry.name);
        throw new Error(
          'Invalid .txt filename "' + entry.name + '" in ' + path.relative(__dirname, folderPath) +
          '. Use lowercase URL-safe names (a-z, 0-9, ".", "_", "-") ending in .txt. Suggested name: ' + suggested
        );
      }
      result.push({ type: 'file', name: entry.name, size: stat.size, modified: formatDate(stat.mtime) });
    }
  });

  result.sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(path.join(folderPath, 'manifest.json'), JSON.stringify(result, null, 2));

  const relPath = path.relative(CONTENT_DIR, folderPath) || '.';
  console.log('content/' + (relPath === '.' ? '' : relPath + '/') + 'manifest.json  (' + result.length + ' item' + (result.length === 1 ? '' : 's') + ')');

  return result;
}

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR);
    console.log('Created empty content/ folder.');
  }
  buildManifest(CONTENT_DIR);
  buildBackgroundsManifest();
  console.log('Validation OK: manifests generated and all .txt filenames are lowercase URL-safe.');
}

// Scans content/_backgrounds/ for image files and writes backgrounds-manifest.json.
// Each entry: { id, name, src }  (src is the public URL path used by index.html).
// Non-image files and hidden entries are silently ignored.
function buildBackgroundsManifest() {
  if (!fs.existsSync(BACKGROUNDS_DIR)) {
    fs.mkdirSync(BACKGROUNDS_DIR, { recursive: true });
    console.log('Created content/_backgrounds/ folder.');
  }

  const entries = fs.readdirSync(BACKGROUNDS_DIR, { withFileTypes: true });
  const backgrounds = [];

  entries.forEach(entry => {
    if (!entry.isFile()) return;
    if (isHidden(entry.name)) return;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) return;

    const id = entry.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const name = path.basename(entry.name, path.extname(entry.name));
    const src = 'content/_backgrounds/' + entry.name;
    backgrounds.push({ id, name, src });
  });

  backgrounds.sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(BACKGROUNDS_MANIFEST, JSON.stringify(backgrounds, null, 2));
  console.log('content/_backgrounds/backgrounds-manifest.json  (' + backgrounds.length + ' image' + (backgrounds.length === 1 ? '' : 's') + ')');
}

main();
