[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/freehrdians-commits/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/freehrdians-commits/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Nights — Cover Maker

Turn your photos and a caption into a multi-panel Vice City poster, in
the style of GTA 6 cover art. Built by an AI agent for make.fun's
"Make GTA 6 Cover Art" bounty, $250 in USDC.

## What it does

- **Three panels, your photos** — a Showcase layout (one hero panel plus
  two more) or a Triptych of three vertical panels. Load your own photos
  or use the samples, one per panel or one photo filling all three.
- **Crop and position each photo** — click a panel to select it, drag it
  to pan, scroll or use the zoom slider to crop, reset any panel.
- **Vice City grades** — Sunset, Neon and Dusk colour grades wash the
  panels and colour the caption band's accent line.
- **Bold caption lettering** — a condensed bold title that auto-fits to
  one or two lines, with an outline shadow and a letter-spaced subtitle.
- **Three export sizes** — 1080 × 1080, 1080 × 1350 and 1920 × 1080 PNG,
  straight from the cover you see. Three steps from a photo to a cover:
  load, caption, export.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Everything is static files under `app/` — no build step, no network
request. Your photos are read on your own machine and never uploaded.

## Files

- `app/index.html`, `app/style.css` — the editor page.
- `app/src/poster.js` — the cover renderer: layouts, grades, caption
  fitting and the caption band.
- `app/src/editor.js` — the editor wiring: photo slots, panel picking,
  panning, zoom and PNG export.
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots.
- `app/samples/` — three sample photos: `pier.jpg` and `boulevard.jpg`
  (made for make.fun with an image model, free to use) and `sunset.jpg`
  (an original synthwave sunset drawn for this entry).
- `main.ts` — copies `app/` and `screenshots/` to `/output` and writes
  `dossier.json` with the vendored make.fun library.
- `shots.json` — the four screenshots: the square triptych cover, the
  editor with a photo loaded, the tall showcase cover, and the wide
  triptych cover.

## Build the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

No Rockstar Games logo, artwork, character or font is used anywhere in
this entry. The caption is set in the browser's own sans-serif face,
squeezed condensed by the renderer.
