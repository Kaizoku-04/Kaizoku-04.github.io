// Two canvases of zeros and ones.
// #field: a sparse binary grid behind the page; digits near the pointer wake up and flip.
// #portrait: the portrait drawn in digits; the pointer develops the photograph underneath,
// and the exposure fades back slowly.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MONO = '"JetBrains Mono", ui-monospace, monospace';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- background field ---------- */
  const field = document.getElementById('field');
  const fctx = field.getContext('2d');
  const CELL = 22;
  let cols = 0, rows = 0, bits, energy, base;
  const pointer = { x: -1e4, y: -1e4, active: false };

  function sizeField() {
    const w = innerWidth, h = innerHeight;
    field.width = Math.round(w * dpr);
    field.height = Math.round(h * dpr);
    cols = Math.ceil(w / CELL) + 1;
    rows = Math.ceil(h / CELL) + 1;
    bits = new Uint8Array(cols * rows);
    energy = new Float32Array(cols * rows);
    for (let i = 0; i < bits.length; i++) bits[i] = Math.random() < 0.5 ? 1 : 0;
    // The resting layer is drawn once; only woken cells are redrawn each frame.
    base = document.createElement('canvas');
    base.width = field.width; base.height = field.height;
    const b = base.getContext('2d');
    b.scale(dpr, dpr);
    b.font = `11px ${MONO}`;
    b.textAlign = 'center'; b.textBaseline = 'middle';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Sparse: most cells stay empty, so the field reads as texture, not wallpaper.
        const n = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
        const v = n - Math.floor(n);
        if (v > 0.34) continue;
        b.fillStyle = `rgba(237,237,237,${0.035 + v * 0.09})`;
        b.fillText(bits[r * cols + c] ? '1' : '0', c * CELL + CELL / 2, r * CELL + CELL / 2);
      }
    }
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.clearRect(0, 0, field.width, field.height);
    fctx.drawImage(base, 0, 0);
  }

  let woken = new Set();
  function stir(x, y) {
    const R = 150, c0 = Math.floor((x - R) / CELL), c1 = Math.ceil((x + R) / CELL);
    const r0 = Math.floor((y - R) / CELL), r1 = Math.ceil((y + R) / CELL);
    for (let r = Math.max(0, r0); r <= Math.min(rows - 1, r1); r++) {
      for (let c = Math.max(0, c0); c <= Math.min(cols - 1, c1); c++) {
        const dx = c * CELL + CELL / 2 - x, dy = r * CELL + CELL / 2 - y;
        const d = Math.hypot(dx, dy);
        if (d > R) continue;
        const i = r * cols + c;
        const e = 1 - d / R;
        if (e > energy[i]) energy[i] = e;
        woken.add(i);
      }
    }
  }

  function drawField() {
    if (!woken.size) return;
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.clearRect(0, 0, field.width, field.height);
    fctx.drawImage(base, 0, 0);
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx.font = `12px ${MONO}`;
    fctx.textAlign = 'center'; fctx.textBaseline = 'middle';
    const next = new Set();
    for (const i of woken) {
      const e = energy[i];
      if (e < 0.02) { energy[i] = 0; continue; }
      if (Math.random() < e * 0.18) bits[i] ^= 1;
      const c = i % cols, r = (i / cols) | 0;
      const x = c * CELL + CELL / 2, y = r * CELL + CELL / 2;
      fctx.clearRect(x - CELL / 2, y - CELL / 2, CELL, CELL);
      fctx.fillStyle = `rgba(255,255,255,${0.08 + e * 0.6})`;
      fctx.fillText(bits[i] ? '1' : '0', x, y);
      energy[i] = e * 0.93;
      next.add(i);
    }
    woken = next;
  }

  /* ---------- portrait ---------- */
  const pc = document.getElementById('portrait');
  const pctx = pc.getContext('2d');
  const photo = new Image();
  photo.src = 'assets/media/portrait.webp';
  let pcols = 0, prows = 0, lum, pbits, exposure, settle, pcell = 0;
  let maskCanvas, maskCtx, maskData, layer, lctx;
  const pp = { x: -1e4, y: -1e4, inside: false };
  let started = 0;

  function sizePortrait() {
    if (!photo.complete || !photo.naturalWidth) return;
    const w = pc.clientWidth, h = Math.round(w * photo.naturalHeight / photo.naturalWidth);
    pc.width = Math.round(w * dpr); pc.height = Math.round(h * dpr);
    pcell = w < 380 ? 7 : 9;
    pcols = Math.floor(w / pcell); prows = Math.floor(h / pcell);
    // Sample the photo's brightness per cell.
    const s = document.createElement('canvas');
    s.width = pcols; s.height = prows;
    const sctx = s.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(photo, 0, 0, pcols, prows);
    const d = sctx.getImageData(0, 0, pcols, prows).data;
    lum = new Float32Array(pcols * prows);
    pbits = new Uint8Array(pcols * prows);
    exposure = new Float32Array(pcols * prows);
    settle = new Float32Array(pcols * prows);
    for (let i = 0; i < lum.length; i++) {
      lum[i] = d[i * 4] / 255;
      pbits[i] = lum[i] > 0.5 ? 1 : 0;
      // Page-load reveal: each cell settles at its own moment, top to bottom with jitter.
      settle[i] = reduced ? 0 : ((i / pcols) | 0) / prows * 900 + Math.random() * 500;
    }
    maskCanvas = document.createElement('canvas');
    maskCanvas.width = pcols; maskCanvas.height = prows;
    maskCtx = maskCanvas.getContext('2d');
    maskData = maskCtx.createImageData(pcols, prows);
    layer = document.createElement('canvas');
    layer.width = pc.width; layer.height = pc.height;
    lctx = layer.getContext('2d');
    if (!started) started = performance.now();
  }

  function exposeAt(x, y) {
    const R = Math.max(70, pc.clientWidth * 0.2);
    for (let r = 0; r < prows; r++) {
      for (let c = 0; c < pcols; c++) {
        const d = Math.hypot(c * pcell + pcell / 2 - x, r * pcell + pcell / 2 - y);
        if (d > R) continue;
        const i = r * pcols + c;
        exposure[i] = Math.min(1, exposure[i] + (1 - d / R) * 0.22);
      }
    }
  }

  function drawPortrait(now) {
    if (!lum) return;
    const t = now - started;
    if (pp.inside) exposeAt(pp.x, pp.y);
    const W = pc.width, H = pc.height;
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.fillStyle = '#000';
    pctx.fillRect(0, 0, W, H);

    // Developed photograph, masked by exposure.
    let any = false;
    const md = maskData.data;
    for (let i = 0; i < exposure.length; i++) {
      const e = exposure[i];
      if (e > 0.003) { any = true; exposure[i] = e * (pp.inside ? 0.992 : 0.975); } else exposure[i] = 0;
      md[i * 4 + 3] = Math.round(Math.min(1, exposure[i] * 1.6) * 255);
    }
    if (any) {
      maskCtx.putImageData(maskData, 0, 0);
      lctx.globalCompositeOperation = 'source-over';
      lctx.clearRect(0, 0, W, H);
      lctx.drawImage(photo, 0, 0, W, H);
      lctx.globalCompositeOperation = 'destination-in';
      lctx.imageSmoothingEnabled = true;
      lctx.drawImage(maskCanvas, 0, 0, W, H);
      pctx.drawImage(layer, 0, 0);
    }

    // Digits.
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pctx.font = `${pcell + 1}px ${MONO}`;
    pctx.textAlign = 'center'; pctx.textBaseline = 'middle';
    for (let r = 0; r < prows; r++) {
      for (let c = 0; c < pcols; c++) {
        const i = r * pcols + c;
        const L = lum[i];
        if (L < 0.035) continue;
        const settled = t > settle[i];
        let bit = pbits[i];
        if (!settled) bit = Math.random() < 0.5 ? 1 : 0;
        else if (!reduced && Math.random() < 0.0015) pbits[i] ^= 1;
        const a = (settled ? 0.1 + Math.sqrt(L) * 0.9 : 0.25) * (1 - Math.min(1, exposure[i] * 1.4));
        if (a < 0.03) continue;
        pctx.fillStyle = `rgba(255,255,255,${a})`;
        pctx.fillText(bit ? '1' : '0', c * pcell + pcell / 2, r * pcell + pcell / 2);
      }
    }
  }

  /* ---------- input ---------- */
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
    if (!reduced) stir(e.clientX, e.clientY);
    const b = pc.getBoundingClientRect();
    pp.x = e.clientX - b.left; pp.y = e.clientY - b.top;
    pp.inside = pp.x >= 0 && pp.y >= 0 && pp.x <= b.width && pp.y <= b.height;
  }, { passive: true });
  pc.addEventListener('pointerleave', () => { pp.inside = false; });
  pc.addEventListener('pointerdown', (e) => {
    const b = pc.getBoundingClientRect();
    pp.x = e.clientX - b.left; pp.y = e.clientY - b.top; pp.inside = true;
  });
  addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') pp.inside = false; });
  // Keyboard users: focusing the portrait develops the whole photograph.
  pc.tabIndex = 0;
  pc.addEventListener('focus', () => { if (exposure) exposure.fill(1); pp.inside = false; });

  /* ---------- loop ---------- */
  let visible = true, portraitOnScreen = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) requestAnimationFrame(loop); });
  new IntersectionObserver(([en]) => { portraitOnScreen = en.isIntersecting; }).observe(pc);
  let last = 0;
  function loop(now) {
    if (!visible) return;
    if (now - last > 33) {   // ~30 fps is plenty for flickering digits
      last = now;
      drawField();
      if (portraitOnScreen) drawPortrait(now);
    }
    requestAnimationFrame(loop);
  }

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { sizeField(); sizePortrait(); }, 150); });
  const go = () => { sizeField(); sizePortrait(); requestAnimationFrame(loop); };
  const ready = Promise.all([
    document.fonts ? document.fonts.load(`12px ${MONO}`) : Promise.resolve(),
    photo.decode ? photo.decode().catch(() => {}) : Promise.resolve(),
  ]);
  ready.then(go, go);
})();
