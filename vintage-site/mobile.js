/* Reuse the desktop open/context-menu handlers without changing desktop input. */
(() => {
  const mobile = window.matchMedia('(max-width: 768px), (max-width: 1024px) and (max-height: 500px) and (pointer: coarse)');
  const icons = '.desktop-icon-item, .grid-item, .details-row, .mc-grid-item, .mc-details-row';
  const editable = 'input, textarea, select, button, a, [contenteditable="true"]';
  let holdTimer;
  let heldItem = null;
  let touchDrag = null;
  let startX = 0, startY = 0;

  function cancelHold() {
    clearTimeout(holdTimer);
  }

  document.addEventListener('pointerdown', event => {
    if (mobile.matches && event.pointerType !== 'mouse' && event.isPrimary &&
        event.target.closest('.paint-canvas, .sol-card:not(.facedown), .wmp-knob-wrap')) {
      touchDrag = { target: event.target, pointerId: event.pointerId,
        startX: event.clientX, startY: event.clientY, moved: false };
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
      item.dispatchEvent(new PointerEvent('contextmenu', {
        bubbles: true, cancelable: true, pointerType: 'mouse',
        clientX: startX, clientY: startY
      }));
    }, 550);
  });
  document.addEventListener('pointermove', event => {
    if (touchDrag && touchDrag.pointerId === event.pointerId) {
      if (Math.hypot(event.clientX - touchDrag.startX, event.clientY - touchDrag.startY) > 5) touchDrag.moved = true;
      touchDrag.target.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true, clientX: event.clientX, clientY: event.clientY
      }));
    }
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > 10) cancelHold();
  }, { passive: true });
  document.addEventListener('pointerup', cancelHold);
  document.addEventListener('pointercancel', cancelHold);
  function endTouchDrag(event) {
    if (!touchDrag || touchDrag.pointerId !== event.pointerId) return;
    const { target, moved } = touchDrag;
    touchDrag = null;
    target.dispatchEvent(new MouseEvent('mouseup', {
      bubbles: true, clientX: event.clientX, clientY: event.clientY
    }));
    if (event.type === 'pointerup' && !moved && target.isConnected && target.closest('.sol-card')) {
      target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    }
  }
  document.addEventListener('pointerup', endTouchDrag);
  document.addEventListener('pointercancel', endTouchDrag);
  document.addEventListener('scroll', cancelHold, true);
  mobile.addEventListener('change', cancelHold);

  document.addEventListener('contextmenu', event => {
    if (!mobile.matches || event.target.closest(editable)) return;
    const item = event.target.closest(icons);
    if (!item) return;
    event.preventDefault();
    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      event.stopPropagation();
      cancelHold();
      heldItem = item;
      item.dispatchEvent(new PointerEvent('contextmenu', {
        bubbles: true, cancelable: true, pointerType: 'mouse',
        clientX: event.clientX, clientY: event.clientY
      }));
    }
  }, true);

  document.addEventListener('mousedown', event => {
    if (!mobile.matches || event.target.closest(editable + ', .win-btn')) return;
    if (event.target.closest(icons + ', .win98-titlebar, .face-nowplaying, #desktop-icons')) {
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
    if (event.detail > 1) return;
    item.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
  }, true);
})();
