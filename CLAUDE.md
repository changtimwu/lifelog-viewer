# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev      # Vite dev server, http://localhost:5173 (auto-opens)
npm run build    # production build to dist/
npm run preview  # serve the production build

# Convert a GPX track into a loadable trip JSON (see lib/gpx.js):
node scripts/gpx-to-trip.mjs track.gpx --tz=+02:00 --out public/data/my-trip.json
```

There are **no tests and no linter** configured (the lone `eslint-disable` comment in `MapView.jsx` is vestigial — no ESLint is installed). The `lib/` parsers are dependency-free ESM, so the fastest way to check one is a throwaway Node script that imports it (that's how `gpx.js`/`exif.js` were validated).

## Architecture

A "Travel Memory Player": a React + Vite SPA that replays one trip like a video. See `README.md` for the data schema + import UIs and `DESIGN.md` for the visual spec.

**The whole app is driven by a single playhead.** `LifelogViewer.jsx` holds one piece of truth — `progress`, a float in `[0, 1]` — and everything else is derived from it each render:

```
progress (0–1)
  └─ currentMs = startMs + progress * (endMs - startMs)
       ├─ positionAt(samples, currentMs)  → pin lng/lat      (MapView)
       ├─ sampleAt(samples, currentMs)    → 6 stat values    (StatColumn)
       ├─ dateKey(currentMs)              → day number       (Header)
       ├─ currentMs vs item.ms            → active/faded     (Timeline)
       └─ |photo.ms − currentMs| minimal  → activePhotoId    (MapView + Timeline highlight)
```

Data flow is one-directional: `useTrip` (data) → `LifelogViewer` (state + derivation) → panels (pure/presentational, take props only). All panel components — `Header`, `MapView`, `StatColumn`, `Timeline`, `PlayerBar` — are stateless views of the derived values; to change *what* is shown, change the derivation in `LifelogViewer`, not the panels.

- **`data/useTrip.js`** — takes a `source` that is **either a JSON URL string or an already-built trip object** (the latter is how in-memory imports load). Memoizes derived data: `route` coords, `startMs`/`endMs` (first/last sample), and a **flattened, time-sorted `events[]`** (each `days[].events[]` entry gets an absolute `ms`, `day`, `date`).
- **`lib/geo.js`** — `bracket()` finds the two samples surrounding a timestamp; `positionAt`/`sampleAt` linearly interpolate between them (why playback looks smooth despite sparse samples). `nearestSample()` finds the closest sample to a lat/lng.
- **`lib/time.js`** — timestamp parsing (`toMs`) and clock/date/duration formatting.
- **`theme.js`** — the single source of truth for palette (`C`), fonts (`SERIF`/`MONO`/`SANS`), timeline `CATEGORIES`, and `STAT_DEFS`. Add a stat pill or event category **here**, not in a component.

### Importing data (two subsystems, same house style)

Both parse a format with **zero dependencies** and run in Node *and* the browser:

- **GPX** — `lib/gpx.js` (`gpxToSamples`/`gpxToTrip`) turns a track into the trip shape, synthesizing the fields GPX lacks (cumulative `movedKm`, altitude-derived `pressureHpa`, constant fallbacks). Used by both the `scripts/gpx-to-trip.mjs` CLI and the in-app `GpxImport.jsx` control (upload or URL). `tzOffsetToMinutes` is shared between them.
- **Photos** — `lib/exif.js` (`readPhotoMeta`) reads capture time + GPS from JPEG EXIF. `PhotoImport.jsx` uploads photos; `LifelogViewer` resolves each onto the trip (GPS+time → both; time only → `positionAt`; GPS only → `nearestSample`; neither → trip start) and holds them in a **separate `photos` state** (not part of `trip`). `Timeline` merges photos with events into one time-sorted list; `MapView` renders thumbnail markers.

### Styling is a deliberate hybrid

Global layout/effects live as `.lv-*` classes in `src/index.css`; per-element colors and typography are **inline styles that pull tokens from `theme.js`**. When editing appearance, match the existing split — structural CSS in `index.css`, token-driven values inline.

### Map (`MapView.jsx`)

MapLibre GL. The map is created **once** in a mount effect. Separate effects then: move the position marker (easing the camera when `following`); redraw the route line + `fitBounds` when `route` changes — but **not** on first render, so the sample keeps its designed framing; and sync photo thumbnail markers to the `photos` array. Don't recreate the map on prop changes. Basemap: `VITE_MAPTILER_KEY` in `.env` → MapTiler vector style; no key → raster OpenStreetMap fallback (dev only).

## Gotchas

- **Timestamps are naive local wall-clock, everywhere, on purpose.** Sample/event ISO strings carry no `Z`, so `new Date(...)`/`toMs` read them in the browser's local zone. This is the load-bearing convention across four files: `time.js` parses it, GPX import shifts UTC→local via `--tz`/the UI timezone field to *produce* naive strings, and photo EXIF `DateTimeOriginal` is already camera-local. Everything aligns only because all sources share this one clock — adding a `Z`/offset anywhere shifts that source's whole timeline relative to the others.
- **Playback speed ≠ scrubber label.** `LOOP_SECONDS` (const in `LifelogViewer.jsx`, currently 42) is the real wall-clock time to play the trip once. `trip.playbackSeconds` is *only* the total-time text on the scrubber. Independent — changing one does not change the other.
- **`sampleAt` hardcodes the interpolated keys** (`alt`, `tempC`, `humidityPct`, `pressureHpa`, `movedKm`, `walkKm`). Every object in `samples[]` must contain all of them, and `samples[]` must be time-ordered (`bracket` assumes ascending `t`). A new stat requires editing both `sampleAt`'s key list and `STAT_DEFS` (and, for imports, `gpx.js`).
- **Trip-change effect resets the playhead.** On any `trip` change it sets `progress` and clears photos (revoking their object URLs). The bundled sample opens near `2026-07-13T16:50:26` (hero shot) *only* when `trip.id === "switzerland-2026"` and that instant is in range; every other trip starts at 0.
- **Photos live outside `trip`.** They're object-URL-backed React state, cleared/revoked on trip change — not persisted and not part of the trip JSON.
