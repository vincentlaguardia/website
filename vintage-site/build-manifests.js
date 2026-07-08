// Recursively scans the content/ folder next to this script and writes a
// manifest.json into content/ itself and into every nested subfolder,
// listing that folder's immediate contents (both files and subfolders).
// index.html fetches these manifest.json files at runtime to build any
// folder marked with a `syncFolder` path -- so dropping a file (or a whole
// nested folder of files) anywhere under content/ and pushing to GitHub is
// all it takes for it to show up on the live site, at any depth, with no
// HTML editing.
//
// This runs automatically as the "build command" on Netlify / Cloudflare
// Pages every time you push new files -- you should not need to run it
// yourself. (If you ever do want to run it by hand: `node build-manifests.js`
// from inside the site folder, with Node.js installed.)

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');
const SAFE_TXT_NAME_RE = /^[a-z0-9._-]+\.txt$/;

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
      if (isTxt && !SAFE_TXT_NAME_RE.test(entry.name)) {
        throw new Error(
          'Invalid .txt filename "' + entry.name + '" in ' + path.relative(__dirname, folderPath) +
          '. Use lowercase URL-safe names (a-z, 0-9, ".", "_", "-") ending in .txt.'
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
  console.log('Validation OK: manifests generated and all .txt filenames are lowercase URL-safe.');
}

main();
