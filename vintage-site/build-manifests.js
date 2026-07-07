// Scans the content/ folder next to this script and writes a manifest.json
// into content/ itself (listing subfolders) and into every subfolder
// (listing its files). index.html fetches these manifest.json files at
// runtime to build "My Files" and its subfolders automatically -- so
// dropping a file into content/some-folder/ and pushing to GitHub is all
// it takes for it to show up on the live site, with no HTML editing.
//
// This runs automatically as the "build command" on Netlify / Cloudflare
// Pages every time you push new files -- you should not need to run it
// yourself. (If you ever do want to run it by hand: `node build-manifests.js`
// from inside the site folder, with Node.js installed.)

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');

function isHidden(name) {
  return name.startsWith('.');
}

function formatDate(mtime) {
  const d = new Date(mtime);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function buildFolderManifest(folderPath) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  const files = [];
  entries.forEach(entry => {
    if (isHidden(entry.name)) return;
    if (entry.name === 'manifest.json') return;
    if (!entry.isFile()) return;
    const fullPath = path.join(folderPath, entry.name);
    const stat = fs.statSync(fullPath);
    files.push({
      name: entry.name,
      size: stat.size,
      modified: formatDate(stat.mtime)
    });
  });
  files.sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(path.join(folderPath, 'manifest.json'), JSON.stringify(files, null, 2));
  return files;
}

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR);
    console.log('Created empty content/ folder.');
  }

  const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });
  const folders = [];

  entries.forEach(entry => {
    if (isHidden(entry.name)) return;
    if (!entry.isDirectory()) return;
    const folderPath = path.join(CONTENT_DIR, entry.name);
    const files = buildFolderManifest(folderPath);
    const stat = fs.statSync(folderPath);
    folders.push({
      name: entry.name,
      modified: formatDate(stat.mtime)
    });
    console.log('content/' + entry.name + '/manifest.json  (' + files.length + ' file' + (files.length === 1 ? '' : 's') + ')');
  });

  folders.sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(path.join(CONTENT_DIR, 'manifest.json'), JSON.stringify(folders, null, 2));
  console.log('content/manifest.json  (' + folders.length + ' folder' + (folders.length === 1 ? '' : 's') + ')');
}

main();
