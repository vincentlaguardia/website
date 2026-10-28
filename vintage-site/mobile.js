/* Reuse the desktop open/context-menu handlers without changing desktop input. */
(() => {
  const mobile = window.matchMedia('(max-width: 768px), (max-width: 1024px) and (max-height: 500px) and (pointer: coarse)');
  const icons = '.desktop-icon-item, .grid-item, .details-row, .mc-grid-item, .mc-details-row';
  const editable = 'input, textarea, select, button, a, [contenteditable="true"]';
  let holdTimer;
  let heldItem = null;
  let touchDrag = null;
  let iconDrag = null;
  let pendingTap = null;
  let openingItem = false;
  let startX = 0, startY = 0;

  function positionKey(item) {
    return 'mobile-desktop-icon-pos-' + (item.dataset.itemId || item.id);
  }

  function updateDesktopHeight() {
    const desktop = document.getElementById('desktop-icons');
    const bottom = Math.max(44, ...Array.from(desktop.querySelectorAll('.desktop-icon-item'),
      item => parseFloat(item.style.getPropertyValue('--mobile-icon-top')) + item.offsetHeight + 20));
    desktop.style.setProperty('--mobile-icons-height', bottom + 'px');
  }

  function scalePlayer() {
    const taskbar = document.getElementById('taskbar');
    const availableHeight = window.innerHeight - (taskbar ? taskbar.offsetHeight : 40);
    document.documentElement.style.setProperty('--mobile-player-scale',
      Math.min(1, window.innerWidth / 380, availableHeight / 630));
  }
  window.addEventListener('resize', scalePlayer);
  scalePlayer();

  function scatterDesktopIcons() {
    const desktop = document.getElementById('desktop-icons');
    if (!mobile.matches || !desktop || !desktop.clientWidth) return;
    const columns = Math.max(1, Math.floor((desktop.clientWidth - 16) / 110));
    const columnWidth = (desktop.clientWidth - 16) / columns;
    const bottoms = Array(columns).fill(44);
    desktop.querySelectorAll('.desktop-icon-item').forEach(item => {
      const seed = item.dataset.itemId || item.id;
      let hash = 2166136261;
      for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
      const column = bottoms.indexOf(Math.min(...bottoms));
      const left = 8 + column * columnWidth + (hash % 100) / 100 * (columnWidth - 92);
      const top = bottoms[column] + (hash >>> 8) % 29;
      const saved = JSON.parse(localStorage.getItem(positionKey(item)) || 'null');
      const maxLeft = Math.max(0, desktop.clientWidth - 100);
      item.style.setProperty('--mobile-icon-left', (saved ? Math.max(8, Math.min(maxLeft, saved.x * maxLeft)) : left) + 'px');
      item.style.setProperty('--mobile-icon-top', (saved ? Math.max(44, saved.top) : top) + 'px');
      bottoms[column] = top + item.offsetHeight + 20;
    });
    updateDesktopHeight();
  }

  const desktop = document.getElementById('desktop-icons');
  if (desktop) {
    new MutationObserver(scatterDesktopIcons).observe(desktop, { childList: true });
    new ResizeObserver(scatterDesktopIcons).observe(desktop);
    document.fonts.ready.then(scatterDesktopIcons);
    mobile.addEventListener('change', scatterDesktopIcons);
    scatterDesktopIcons();
  }

  function cancelHold() {
    clearTimeout(holdTimer);
  }

  document.addEventListener('pointerdown', event => {
    if (mobile.matches && event.pointerType !== 'mouse' && event.isPrimary &&
        event.target.closest('.paint-canvas, .sol-card, .wmp-knob-wrap')) {
      touchDrag = { target: event.target, pointerId: event.pointerId };
      event.target.setPointerCapture(event.pointerId);
      event.preventDefault();
      event.target.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true, cancelable: true, clientX: event.clientX, clientY: event.clientY
      }));
      return;
    }
    heldItem = null;
    if (!mobile.matches || event.button !== 0 || event.target.closest(editable)) return;
    const item = event.target.closest(icons);
    if (!item) return;
    startX = event.clientX;
    startY = event.clientY;
    cancelHold();
    holdTimer = setTimeout(() => {
      heldItem = item;
      if (!item.matches('#desktop-icons .desktop-icon-item')) return;
      clearTimeout(pendingTap && pendingTap.timer);
      pendingTap = null;
      iconDrag = {
        item, pointerId: event.pointerId,
        left: parseFloat(item.style.getPropertyValue('--mobile-icon-left')),
        top: parseFloat(item.style.getPropertyValue('--mobile-icon-top'))
      };
      item.setPointerCapture(event.pointerId);
      item.classList.add('mobile-dragging');
    }, 550);
  });
  document.addEventListener('pointermove', event => {
    if (touchDrag && touchDrag.pointerId === event.pointerId) {
      touchDrag.target.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true, clientX: event.clientX, clientY: event.clientY
      }));
    }
    if (iconDrag && iconDrag.pointerId === event.pointerId) {
      const { item, left, top } = iconDrag;
      const desktop = item.parentElement;
      const maxLeft = Math.max(8, desktop.clientWidth - item.offsetWidth - 8);
      item.style.setProperty('--mobile-icon-left', Math.min(maxLeft, Math.max(8, left + event.clientX - startX)) + 'px');
      item.style.setProperty('--mobile-icon-top', Math.max(44, top + event.clientY - startY) + 'px');
      updateDesktopHeight();
    }
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > 10) cancelHold();
  }, { passive: true });
  document.addEventListener('pointerup', cancelHold);
  document.addEventListener('pointercancel', cancelHold);
  function endTouchDrag(event) {
    if (!touchDrag || touchDrag.pointerId !== event.pointerId) return;
    const target = touchDrag.target;
    touchDrag = null;
    target.dispatchEvent(new MouseEvent('mouseup', {
      bubbles: true, clientX: event.clientX, clientY: event.clientY
    }));
  }
  document.addEventListener('pointerup', endTouchDrag);
  document.addEventListener('pointercancel', endTouchDrag);
  function endIconDrag(event) {
    if (!iconDrag || iconDrag.pointerId !== event.pointerId) return;
    const { item } = iconDrag;
    item.classList.remove('mobile-dragging');
    if (item.hasPointerCapture(event.pointerId)) item.releasePointerCapture(event.pointerId);
    localStorage.setItem(positionKey(item), JSON.stringify({
      x: parseFloat(item.style.getPropertyValue('--mobile-icon-left')) / Math.max(1, item.parentElement.clientWidth - 100),
      top: parseFloat(item.style.getPropertyValue('--mobile-icon-top'))
    }));
    iconDrag = null;
  }
  document.addEventListener('pointerup', endIconDrag);
  document.addEventListener('pointercancel', endIconDrag);
  document.addEventListener('scroll', cancelHold, true);
  mobile.addEventListener('change', cancelHold);

  document.addEventListener('mousedown', event => {
    if (!mobile.matches || event.target.closest(editable + ', .win-btn')) return;
    if (event.target.closest(icons + ', .win98-titlebar, #desktop-icons')) {
      event.stopPropagation();
    }
  }, true);

  document.addEventListener('contextmenu', event => {
    if (mobile.matches && event.target.closest(icons) && event.isTrusted) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  document.addEventListener('dblclick', event => {
    if (mobile.matches && !openingItem && event.target.closest(icons)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  document.addEventListener('click', event => {
    if (!mobile.matches || event.target.closest(editable)) return;
    const item = event.target.closest(icons);
    if (!item) return;
    event.preventDefault();
    event.stopPropagation();
    if (heldItem === item) { heldItem = null; return; }
    if (pendingTap && pendingTap.item === item) {
      clearTimeout(pendingTap.timer);
      pendingTap = null;
      item.dispatchEvent(new MouseEvent('contextmenu', {
        bubbles: true, cancelable: true, clientX: event.clientX, clientY: event.clientY
      }));
      return;
    }
    if (pendingTap) {
      clearTimeout(pendingTap.timer);
      pendingTap.open();
    }
    const open = () => {
      openingItem = true;
      try {
        item.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
      } finally {
        openingItem = false;
      }
    };
    pendingTap = { item, open, timer: setTimeout(() => {
      pendingTap = null;
      open();
    }, 300) };
  }, true);
})();
