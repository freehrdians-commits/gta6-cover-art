// Vice Nights — the cover renderer. Pure canvas drawing: given a state
// (layout, grade, caption, three panel photos with their crop), it paints
// a multi-panel GTA-style poster onto any canvas at any size.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    sky: ['rgba(255,154,61,0)', 'rgba(255,94,122,0.42)', 'rgba(123,47,190,0.55)'],
    wash: 'rgba(255,120,70,0.14)',
    accent: '#ffb347',
    band: 'rgba(24,8,38,0.88)',
    ink: '#fff6e8',
  },
  neon: {
    label: 'Neon',
    sky: ['rgba(0,229,255,0)', 'rgba(255,47,179,0.40)', 'rgba(91,46,229,0.55)'],
    wash: 'rgba(255,47,179,0.13)',
    accent: '#3ae2ff',
    band: 'rgba(8,6,30,0.88)',
    ink: '#f2feff',
  },
  dusk: {
    label: 'Dusk',
    sky: ['rgba(138,123,255,0)', 'rgba(61,43,143,0.45)', 'rgba(18,14,46,0.60)'],
    wash: 'rgba(96,74,220,0.18)',
    accent: '#c9b8ff',
    band: 'rgba(10,8,26,0.88)',
    ink: '#f2efff',
  },
};

export const LAYOUTS = {
  showcase: 'Showcase',
  triptych: 'Triptych',
};

function gapFor(w) {
  return Math.max(4, Math.round(w * 0.014));
}

// Panel rectangles for a layout at a given canvas size. Every layout
// returns exactly three panels.
export function panelRects(layout, w, h) {
  const g = gapFor(w);
  if (layout === 'triptych') {
    const pw = (w - g * 2) / 3;
    return [
      { x: 0, y: 0, w: pw, h },
      { x: pw + g, y: 0, w: pw, h },
      { x: (pw + g) * 2, y: 0, w: pw, h },
    ];
  }
  // showcase
  if (w >= h) {
    const heroW = Math.round(w * 0.62);
    const sideW = w - heroW - g;
    const ph = (h - g) / 2;
    return [
      { x: 0, y: 0, w: heroW, h },
      { x: heroW + g, y: 0, w: sideW, h: ph },
      { x: heroW + g, y: ph + g, w: sideW, h: ph },
    ];
  }
  const heroH = Math.round(h * 0.60);
  const lowH = h - heroH - g;
  const pw = (w - g) / 2;
  return [
    { x: 0, y: 0, w, h: heroH },
    { x: 0, y: heroH + g, w: pw, h: lowH },
    { x: pw + g, y: heroH + g, w: pw, h: lowH },
  ];
}

// Draws one photo cover-fitting its panel, with a zoom factor and a
// pan offset (both in fractions of the panel size).
function paintPhoto(ctx, img, rect, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih) * (zoom || 1);
  const dw = iw * base;
  const dh = ih * base;
  const dx = rect.x + (rect.w - dw) / 2 + (ox || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (oy || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function paintGrade(ctx, rect, grade) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, grade.sky[0]);
  grad.addColorStop(0.55, grade.sky[1]);
  grad.addColorStop(1, grade.sky[2]);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = grade.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // Vignette: darken the panel corners so the panels read as separate plates.
  const vg = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vg;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

// Splits a caption into at most two lines that fit maxWidth at size.
function wrapCaption(ctx, text, maxWidth, size) {
  ctx.font = `900 ${size}px "Arial Narrow", "Helvetica Neue", sans-serif`;
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width * 0.85 <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
      if (lines.length === 2) break;
    }
  }
  if (line && lines.length < 2) lines.push(line);
  return lines;
}

function drawCondensed(ctx, text, cx, y, size) {
  ctx.save();
  ctx.translate(cx, y);
  ctx.scale(0.85, 1);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function paintCaption(ctx, w, h, grade, title, subtitle) {
  const bandH = Math.round(h * 0.17);
  const by = h - bandH;
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, by, w, bandH);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, by, w, Math.max(3, Math.round(h * 0.006)));
  const pad = Math.round(w * 0.045);
  const maxW = w - pad * 2;
  const words = (title || 'VICE NIGHTS').trim().toUpperCase();
  const sub = (subtitle || '').trim().toUpperCase();
  const subSize = Math.max(12, Math.round(h * 0.028));
  const subRoom = sub ? subSize * 2.4 : 0;
  let size = Math.round(h * 0.105);
  let lines = wrapCaption(ctx, words, maxW, size);
  // Shrink until the title fits the width AND the band height.
  while (size > Math.round(h * 0.04)) {
    lines = wrapCaption(ctx, words, maxW, size);
    const widest = Math.max(...lines.map((ln) => ctx.measureText(ln).width * 0.85));
    const need = lines.length * size * 1.02 + subRoom;
    if (widest <= maxW && need <= bandH * 0.96) break;
    size -= 2;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = grade.ink;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.04;
  const lineH = size * 1.02;
  const totalH = lines.length * lineH;
  const startY = by + (bandH - totalH) / 2 + lineH / 2 - (subtitle ? size * 0.16 : 0);
  lines.forEach((ln, i) => {
    ctx.font = `900 ${size}px "Arial Narrow", "Helvetica Neue", sans-serif`;
    drawCondensed(ctx, ln, w / 2, startY + i * lineH, size);
  });
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (sub) {
    ctx.font = `700 ${subSize}px "Arial Narrow", "Helvetica Neue", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.35)}px`; } catch (_) { /* older canvas */ }
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub, w / 2, by + bandH - subSize * 0.9);
    try { ctx.letterSpacing = '0px'; } catch (_) { /* older canvas */ }
  }
}

// Renders the whole poster. `state` holds layout, grade, title, subtitle,
// fillAll, and panels: [{ img, zoom, ox, oy }]. Photos may be null.
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#0b0714';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  const first = state.panels[0] && state.panels[0].img;
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || {};
    const img = state.fillAll ? first : panel.img;
    if (img) {
      paintPhoto(ctx, img, rect, panel.zoom, panel.ox, panel.oy);
    } else {
      const g2 = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      g2.addColorStop(0, '#241a3d');
      g2.addColorStop(1, '#120b22');
      ctx.fillStyle = g2;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `700 ${Math.max(14, Math.round(rect.w * 0.05))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`PANEL ${i + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    paintGrade(ctx, rect, grade);
  });
  paintCaption(ctx, w, h, grade, state.title, state.subtitle);
  return rects;
}
