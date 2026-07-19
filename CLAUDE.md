# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev      # Vite dev server, http://localhost:5173 (auto-opens)
npm run build    # production build to dist/
npm run preview  # serve the production build
```

There are **no tests and no linter** configured (the lone `eslint-disable` comment in `MapView.jsx` is vestigial — no ESLint is installed). This is not a git repository.

## Architecture

A "Travel Memory Player": a React + Vite SPA that replays one trip like a video. See `README.md` for the data schema and `DESIGN.md` for the visual spec.

**The whole app is driven by a single playhead.** `LifelogViewer.jsx` holds one piece of truth — `progress`, a float in `[0, 1]` — and everything else is derived from it each render:

```
progress (0–1)
  └─ currentMs = startMs + progress * (endMs - startMs)
       ├─ positionAt(samples, currentMs)  → pin lng/lat   (MapView)
       ├─ sampleAt(samples, currentMs)    → 6 stat values (StatColumn)
       ├─ dateKey(currentMs)              → day number    (Header)
       └─ currentMs vs event.ms           → active/faded  (Timeline)
```

Data flow is one-directional: `useTrip` (data) → `LifelogViewer` (state + derivation) → panels (pure/presentational, take props only). All panel components — `Header`, `MapView`, `StatColumn`, `Timeline`, `PlayerBar` — are stateless views of the derived values; to change *what* is shown, change the derivation in `LifelogViewer`, not the panels.

- **`data/useTrip.js`** — fetches the trip JSON and memoizes derived data: `route` coords, `startMs`/`endMs` (from the first/last sample), and a **flattened, time-sorted `events[]`** (each `days[].events[]` entry gets an absolute `ms`, `day`, and `date`). Swap the fetch URL here to load real data.
- **`lib/geo.js`** — `bracket()` finds the two samples surrounding a timestamp; `positionAt`/`sampleAt` linearly interpolate between them. This is why playback looks smooth despite sparse samples.
- **`lib/time.js`** — timestamp parsing and clock/date/duration formatting.
- **`theme.js`** — the single source of truth for palette (`C`), fonts (`SERIF`/`MONO`/`SANS`), timeline `CATEGORIES`, and `STAT_DEFS`. Add a stat pill or event category **here**, not in a component.

### Styling is a deliberate hybrid

Global layout/effects live as `.lv-*` classes in `src/index.css`; per-element colors and typography are **inline styles that pull tokens from `theme.js`**. When editing appearance, match the existing split — structural CSS in `index.css`, token-driven values inline.

### Map (`MapView.jsx`)

MapLibre GL. The map is created **once** in a mount effect; a second effect only moves the marker (and eases the camera when `following`) as `position` changes — don't recreate the map on playhead moves. Basemap: `VITE_MAPTILER_KEY` in `.env` → MapTiler vector style; no key → raster OpenStreetMap fallback (dev only).

## Gotchas

- **Playback speed ≠ scrubber label.** `LOOP_SECONDS` (const in `LifelogViewer.jsx`, currently 42) is the real wall-clock time to play the trip once. `trip.playbackSeconds` (296 in the sample) is *only* the total-time text on the scrubber. They are independent — changing one does not change the other.
- **Times are parsed as local time on purpose.** Sample/event ISO strings have no `Z`, so `new Date(...)` reads them in the browser's local zone. Adding a `Z` or an offset would shift the whole timeline.
- **`sampleAt` hardcodes the interpolated keys** (`alt`, `tempC`, `humidityPct`, `pressureHpa`, `movedKm`, `walkKm`). Every object in `samples[]` must contain all of them, and `samples[]` must be time-ordered (`bracket` assumes ascending `t`). A new stat requires editing both `sampleAt`'s key list and `STAT_DEFS`.
- **Initial playhead is hardcoded** to `2026-07-13T16:50:26` (a one-time effect gated by `ready`) to echo the original screenshot — not the trip start.
