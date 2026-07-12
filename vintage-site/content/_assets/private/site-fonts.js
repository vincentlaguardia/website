(function () {
  const STORAGE_KEY = 'site-font-choice';
  const DEFAULT_FONT_STACK = 'Tahoma, "MS Sans Serif", Geneva, sans-serif';
  const STYLE_ID = 'site-font-style';
  const scriptEl = document.currentScript;
  if (!scriptEl || !scriptEl.src) return;
  const fontDirUrl = new URL('./fonts/', scriptEl.src).toString();
  const manifestUrl = new URL('./fonts/manifest.json', scriptEl.src).toString();
  const rootEl = document.documentElement;
  let fontOptions = [];
  let activeFile = null;
  let ready = false;

  function isTtfFile(file) {
    return typeof file === 'string' && /\.ttf$/i.test(file.trim());
  }

  function safeLocalStorage(action, fallback) {
    try {
      return action();
    } catch (error) {
      return fallback;
    }
  }

  function fileBaseName(file) {
    return String(file || '').replace(/\.[^.]+$/, '');
  }

  function toDisplayLabel(file) {
    return fileBaseName(file)
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }

  function faceNameForFile(file) {
    const slug = fileBaseName(file)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'custom_font';
    return 'SiteFont__' + slug;
  }

  function cssString(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function fontUrlForFile(file) {
    return new URL(file, fontDirUrl).toString();
  }

  function normalizeOption(entry) {
    const file = typeof entry === 'string'
      ? entry.trim()
      : entry && typeof entry.file === 'string'
        ? entry.file.trim()
        : '';
    if (!isTtfFile(file)) return null;
    const label = typeof entry === 'object' && entry && typeof entry.name === 'string' && entry.name.trim()
      ? entry.name.trim()
      : toDisplayLabel(file);
    return {
      file,
      label,
      faceName: faceNameForFile(file),
      fontStack: '"' + cssString(faceNameForFile(file)) + '", ' + DEFAULT_FONT_STACK
    };
  }

  function uniqueFontOptions(options) {
    const seen = new Set();
    return options.filter(option => {
      if (!option || seen.has(option.file)) return false;
      seen.add(option.file);
      return true;
    });
  }

  function getStoredFile() {
    const stored = safeLocalStorage(() => localStorage.getItem(STORAGE_KEY), '');
    return isTtfFile(stored) ? stored.trim() : '';
  }

  function getStyleEl() {
    let styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    return styleEl;
  }

  function getFontFaceSources() {
    const dynamic = activeFile ? [normalizeOption({ file: activeFile })] : [];
    return uniqueFontOptions(dynamic.concat(fontOptions).filter(Boolean));
  }

  function buildStyleText() {
    const faceRules = getFontFaceSources().map(option => (
      '@font-face {' +
      'font-family: "' + cssString(option.faceName) + '";' +
      'src: url("' + cssString(fontUrlForFile(option.file)) + '") format("truetype");' +
      'font-display: swap;' +
      '}'
    )).join('\n');
    const currentStack = activeFile ? ('"' + cssString(faceNameForFile(activeFile)) + '", ' + DEFAULT_FONT_STACK) : DEFAULT_FONT_STACK;
    return [
      ':root {',
      '  --site-font-default-family: ' + DEFAULT_FONT_STACK + ';',
      '  --site-font-family: ' + currentStack + ';',
      '}',
      'html, body, button, input, select, textarea {',
      '  font-family: var(--site-font-family, ' + DEFAULT_FONT_STACK + ') !important;',
      '}',
      faceRules
    ].join('\n');
  }

  function refreshStyles() {
    getStyleEl().textContent = buildStyleText();
  }

  function dispatchChange() {
    window.dispatchEvent(new CustomEvent('sitefontchange', {
      detail: {
        file: activeFile || '',
        label: activeFile ? toDisplayLabel(activeFile) : 'Default'
      }
    }));
  }

  function loadActiveFont() {
    if (!activeFile || !document.fonts || typeof document.fonts.load !== 'function') return;
    document.fonts.load('12px "' + faceNameForFile(activeFile) + '"').catch(error => {
      // Missing or invalid uploaded font files should fall back to the default stack without breaking the page.
      console.debug('Site font load skipped for ' + activeFile + ':', error);
    });
  }

  function applyFontFile(file, persist) {
    activeFile = isTtfFile(file) ? file.trim() : null;
    if (persist !== false) {
      safeLocalStorage(() => {
        if (activeFile) localStorage.setItem(STORAGE_KEY, activeFile);
        else localStorage.removeItem(STORAGE_KEY);
      });
    }
    if (activeFile) rootEl.dataset.siteFont = faceNameForFile(activeFile);
    else delete rootEl.dataset.siteFont;
    refreshStyles();
    loadActiveFont();
    dispatchChange();
    return activeFile;
  }

  function setFontOptions(options) {
    fontOptions = uniqueFontOptions((options || []).map(normalizeOption).filter(Boolean));
    ready = true;
    refreshStyles();
    loadActiveFont();
    return fontOptions.slice();
  }

  async function loadManifest() {
    try {
      const response = await fetch(manifestUrl, { cache: 'default' });
      if (!response.ok) return [];
      const payload = await response.json();
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      return [];
    }
  }

  function getAvailableFonts() {
    return fontOptions.slice();
  }

  function getActiveLabel() {
    const match = fontOptions.find(option => option.file === activeFile);
    return match ? match.label : (activeFile ? toDisplayLabel(activeFile) : 'Default');
  }

  function getCanvasFont(size, defaultStack, options) {
    const opts = options || {};
    const prefix = [];
    if (opts.style) prefix.push(opts.style);
    if (opts.weight) prefix.push(opts.weight);
    prefix.push(String(size || 12) + 'px');
    const fallback = defaultStack || DEFAULT_FONT_STACK;
    const stack = activeFile ? ('"' + faceNameForFile(activeFile) + '", ' + fallback) : fallback;
    return prefix.join(' ') + ' ' + stack;
  }

  const readyPromise = loadManifest().then(setFontOptions).catch(error => {
    console.debug('Site font manifest load skipped:', error);
    return setFontOptions([]);
  });

  window.SiteFontManager = {
    STORAGE_KEY,
    DEFAULT_FONT_STACK,
    ready: readyPromise,
    isReady: () => ready,
    getAvailableFonts,
    getActiveFile: () => activeFile || '',
    getActiveLabel,
    applyFontFile: file => applyFontFile(file, true),
    reset: () => applyFontFile('', true),
    getCanvasFont
  };

  applyFontFile(getStoredFile(), false);

  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY) return;
    applyFontFile(event.newValue || '', false);
  });
})();
