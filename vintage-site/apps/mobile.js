/* Embedded apps follow the shell viewport, not a narrow desktop window. */
(() => {
  let host = window;
  try {
    if (window.parent !== window && window.parent.document.getElementById('taskbar') &&
        window.parent.document.getElementById('desktop')) host = window.parent;
  } catch (_) { /* Cross-origin embeds use their own viewport. */ }
  const mobile = host.matchMedia('(max-width: 768px), (max-width: 1024px) and (max-height: 500px) and (pointer: coarse)');
  const stylesheet = document.querySelector('link[data-mobile-styles]');
  const update = () => { stylesheet.media = mobile.matches ? 'all' : 'not all'; };
  mobile.addEventListener('change', update);
  update();
})();
