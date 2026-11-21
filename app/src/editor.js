// Vice Nights editor wiring: photo slots, panel picking and panning,
// layout and grade picks, caption editing, and PNG export in the three
// post sizes. A `?shot=` query sets up a fixed scene for a screenshot.
import { renderCover, GRADES, LAYOUTS } from './poster.js';
import { shotState, markShotReady } from './shots.js';

const canvas = document.getElementById('preview');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const statusLine = document.getElementById('status');
const zoomSlider = document.getElementById('zoom');
const fillAllBox = document.getElementById('fillAll');

const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  tall: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

const state = {
  layout: 'showcase',
  grade: 'sunset',
  title: 'Vice Nights',
  subtitle: 'A Leonida Story',
  size: 'square',
  fillAll: false,
  selected: 0,
  panels: [
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
  ],
};

let lastRects = [];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function say(msg) {
  statusLine.textContent = msg;
}

function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  lastRects = renderCover(canvas, state);
  document.querySelectorAll('[data-panel]').forEach((el) => {
    el.classList.toggle('active', Number(el.dataset.panel) === state.selected);
  });
  zoomSlider.value = String(state.panels[state.selected].zoom);
}

function pickPanelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const x = ((clientX - box.left) / box.width) * canvas.width;
  const y = ((clientY - box.top) / box.height) * canvas.height;
  const hit = lastRects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  if (hit >= 0) {
    state.selected = hit;
    say(`Panel ${hit + 1} selected — drag to move the photo, use the zoom slider to crop.`);
    redraw();
  }
  return hit;
}

let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const hit = pickPanelAt(e.clientX, e.clientY);
  if (hit >= 0) {
    dragging = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const box = canvas.getBoundingClientRect();
  const panel = state.panels[state.selected];
  const rect = lastRects[state.selected];
  panel.ox += ((e.clientX - dragging.x) / box.width) * (canvas.width / rect.w);
  panel.oy += ((e.clientY - dragging.y) / box.height) * (canvas.height / rect.h);
  panel.ox = Math.max(-1, Math.min(1, panel.ox));
  panel.oy = Math.max(-1, Math.min(1, panel.oy));
  dragging = { x: e.clientX, y: e.clientY };
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  panel.zoom = Math.max(1, Math.min(2.5, panel.zoom - Math.sign(e.deltaY) * 0.1));
  redraw();
}, { passive: false });

// Photo slots: one file picker per panel, plus the sample photos.
document.querySelectorAll('[data-slot]').forEach((input) => {
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    const idx = Number(input.dataset.slot);
    state.panels[idx].img = await loadImage(URL.createObjectURL(file));
    state.selected = idx;
    say(`Photo loaded into panel ${idx + 1}.`);
    redraw();
  });
});

document.querySelectorAll('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const name = btn.dataset.sample;
    const img = await loadImage(`samples/${name}.jpg`);
    if (btn.dataset.all === '1') {
      state.panels.forEach((p) => { p.img = img; });
      say(`Sample "${name}" placed in every panel.`);
    } else {
      state.panels[state.selected].img = img;
      say(`Sample "${name}" placed in panel ${state.selected + 1}.`);
    }
    redraw();
  });
});

document.querySelectorAll('[data-panel-btn]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.selected = Number(btn.dataset.panelBtn);
    say(`Panel ${state.selected + 1} selected.`);
    redraw();
  });
});

document.querySelectorAll('[data-layout]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.layout = btn.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
  });
});

document.querySelectorAll('[data-grade]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.grade = btn.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
  });
});

document.querySelectorAll('[data-size]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.size = btn.dataset.size;
    document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
  });
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
fillAllBox.addEventListener('change', () => {
  state.fillAll = fillAllBox.checked;
  say(state.fillAll ? 'One photo now fills every panel.' : 'Panels use their own photos again.');
  redraw();
});
zoomSlider.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(zoomSlider.value);
  redraw();
});
document.getElementById('resetPanel').addEventListener('click', () => {
  const p = state.panels[state.selected];
  p.zoom = 1; p.ox = 0; p.oy = 0;
  redraw();
});

document.querySelectorAll('[data-export]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const size = SIZES[btn.dataset.export];
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    renderCover(off, state);
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-nights-${size.w}x${size.h}.png`;
      a.click();
      say(`Exported ${size.label} PNG.`);
    }, 'image/png');
  });
});

async function boot() {
  const query = new URLSearchParams(location.search);
  if (query.has('shot')) {
    const shot = shotState(query);
    state.layout = shot.layout in LAYOUTS ? shot.layout : 'showcase';
    state.grade = shot.grade in GRADES ? shot.grade : 'sunset';
    state.size = shot.size in SIZES ? shot.size : 'square';
    document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
    state.title = shot.title;
    state.subtitle = shot.subtitle;
    titleInput.value = state.title;
    subtitleInput.value = state.subtitle;
    try {
      const img = await loadImage(`samples/${shot.photo}.jpg`);
      state.panels.forEach((p, i) => {
        p.img = img;
        p.zoom = 1 + i * 0.15;
        p.oy = i === 2 ? -0.08 : 0;
      });
    } catch (err) {
      say('Sample photo could not be loaded.');
    }
    redraw();
    markShotReady();
    return;
  }
  try {
    const img = await loadImage('samples/pier.jpg');
    state.panels[0].img = img;
  } catch (err) {
    say('Sample photo could not be loaded.');
  }
  redraw();
}

boot();
