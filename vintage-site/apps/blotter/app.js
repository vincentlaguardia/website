(() => {
  const root = document.getElementById('blotter-generator');
  const $ = (selector) => root.querySelector(selector);
  const canvas = $('#blotterCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const source = document.createElement('canvas');
  const sctx = source.getContext('2d');
  const imageInput = $('#imageInput');
  const openImage = $('#openImage');
  const PAPER = '#ffffff';
  let img = null;
  let seed = 48271;
  const controls = ['thickness', 'depth', 'wear', 'saturation'];

  const getControlValue = (id) => Number($('#' + id).value);

  const mulberry = () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  function sync() {
    controls.forEach((id) => {
      const suffix = id === 'wear' || id === 'saturation'
        ? '%'
        : id === 'thickness' || id === 'depth'
          ? ' px'
          : '';
      const display = id === 'thickness' ? getControlValue(id).toFixed(1) : getControlValue(id);
      $('#' + id + 'Out').value = display + suffix;
    });
    draw();
  }

  function drawPlaceholder() {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.font = '28px Tahoma';
    ctx.textAlign = 'center';
    ctx.fillText('DROP IMAGE TO BEGIN', canvas.width / 2, canvas.height / 2);
  }

  function draw() {
    if (!img) {
      drawPlaceholder();
      return;
    }

    const grid = 100;
    const size = canvas.width;
    const cell = size / grid;
    const wear = getControlValue('wear') / 100;
    const perf = 0.36;
    const line = getControlValue('thickness');
    const depth = getControlValue('depth');
    const sat = getControlValue('saturation');

    source.width = grid;
    source.height = grid;

    const scale = Math.max(grid / img.width, grid / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    sctx.clearRect(0, 0, grid, grid);
    sctx.filter = 'saturate(' + sat + '%) contrast(112%)';
    sctx.drawImage(
      img,
      (grid - scaledWidth) / 2,
      (grid - scaledHeight) / 2,
      scaledWidth,
      scaledHeight,
    );
    sctx.filter = 'none';

    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.93;
    ctx.drawImage(source, 0, 0, grid, grid, 0, 0, size, size);
    ctx.globalAlpha = 1;

    seed = 48271 + grid * 97 + Math.round(wear * 1000);
    for (let i = 0; i < Math.round(grid * grid * wear * 0.48); i += 1) {
      const x = mulberry() * size;
      const y = mulberry() * size;
      const radius = (0.4 + mulberry() * 2.8) * cell / 30;
      ctx.fillStyle = mulberry() > 0.48 ? 'rgba(245,235,200,.38)' : 'rgba(31,21,12,.20)';
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.8, radius), 0, Math.PI * 2);
      ctx.fill();
    }

    const dot = Math.max(0.35, line * 1.2);
    const every = Math.max(2, Math.round(7 - perf * 5));
    const darkPaper = 'rgba(40,29,20,.78)';
    const rimPaper = 'rgba(255,249,220,.68)';

    function punch(x, y) {
      const wobbleX = (mulberry() - 0.5) * Math.min(dot, depth * 0.16);
      const wobbleY = (mulberry() - 0.5) * Math.min(dot, depth * 0.16);
      const radius = dot * (0.86 + mulberry() * 0.22);
      const inset = depth * 0.34;

      if (depth) {
        ctx.fillStyle = rimPaper;
        ctx.beginPath();
        ctx.arc(
          x - inset * 0.42,
          y - inset * 0.42,
          radius + Math.max(0.35, depth * 0.09),
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.shadowColor = 'rgba(0,0,0,.60)';
        ctx.shadowBlur = Math.max(1, depth * 1.4);
        ctx.shadowOffsetX = inset;
        ctx.shadowOffsetY = inset;
      }

      ctx.fillStyle = darkPaper;
      ctx.beginPath();
      ctx.arc(x + wobbleX, y + wobbleY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      if (depth > 2) {
        ctx.fillStyle = 'rgba(0,0,0,.26)';
        ctx.beginPath();
        ctx.arc(
          x + wobbleX + radius * 0.22,
          y + wobbleY + radius * 0.22,
          radius * 0.56,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    for (let i = 1; i < grid; i += 1) {
      if (i % every !== 0) continue;
      const position = i * cell;
      for (let distance = cell * 0.5; distance < size; distance += cell * 0.72) {
        punch(position, distance);
        punch(distance, position);
      }
    }

    ctx.strokeStyle = 'rgba(33,25,18,.32)';
    ctx.lineWidth = Math.max(0.45, line * 0.35);
    ctx.strokeRect(line, line, size - line * 2, size - line * 2);
    $('#status').textContent = grid + ' × ' + grid + ' squares · depth ' + depth;
    canvas.setAttribute('aria-label', 'Generated ' + grid + ' by ' + grid + ' blotter art sheet.');
  }

  function load(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const next = new Image();
    next.onload = () => {
      img = next;
      URL.revokeObjectURL(url);
      draw();
    };
    next.src = url;
  }

  imageInput.addEventListener('change', (event) => load(event.target.files[0]));
  openImage.addEventListener('click', () => imageInput.click());
  controls.forEach((id) => $('#' + id).addEventListener('input', sync));
  $('#randomize').addEventListener('click', () => {
    seed = Math.floor(Math.random() * 999999);
    $('#wear').value = Math.floor(8 + Math.random() * 65);
    sync();
  });
  $('#download').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'blotter-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  drawPlaceholder();
})();
