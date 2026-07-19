# Lifelog Viewer — Design Specification

A "Travel Memory Player": a media-player-style interface that replays a trip
day by day. A large soft-toned map dominates the left, live stat readouts sit
in a colored column beside it, and a scrollable event timeline runs down the
right. A transport bar at the bottom scrubs through the journey like a video.

The mood is warm, nostalgic, and playful — cream paper tones, rounded
everything, hand-picked pastel accents, and a retro serif logo.

---

## 1. Layout

Overall canvas is a landscape frame (~16:9) wrapped in a dark rounded shell that
floats on a light page.

```
┌───────────────────────────────────────────────────────────────┐  ← dark shell
│  [logo]  TRAVEL MEMORY PLAYER          第 4 天 · date · time     │  header
│  ─────────────────────────────────────────────────────────────  │
│  ┌───────────────────────────────┐ ┌─────┐  ┌────────────────┐ │
│  │  [address pill]               │ │stat │  │ 10:04  ● 休息   │ │
│  │                               │ │stat │  │        …text…   │ │
│  │           MAP                 │ │stat │  │ 11:43  ● 休息   │ │
│  │        (route + pins)         │ │stat │  │ 12:32  ● 景點   │ │
│  │                               │ │stat │  │ …             … │ │
│  │  [mini-map inset]             │ │stat │  │ 第 5 天  date    │ │
│  └───────────────────────────────┘ └─────┘  └────────────────┘ │
│                                              stat column  timeline│
│  ─────────────────────────────────────────────────────────────  │
│  ▶  ⏸   00:02:01  ●━━━━━━━━━━━━○────────  00:04:56             │  player
└───────────────────────────────────────────────────────────────┘
```

Approximate horizontal proportions of the main content row:
- **Map card** — ~56%
- **Stat column** — ~14% (narrow vertical strip of pills)
- **Timeline panel** — ~28% (right, with a subtle gap/divider)

Structure notes:
- The whole app lives inside a **dark shell** with generous rounded corners
  (~24px) and a soft outer drop shadow, sitting on a light neutral page.
- Header, content, and player are three stacked bands separated by thin hairline
  rules the color of the shell edge.
- Everything is on a warm cream working surface inside the shell; individual
  regions are their own rounded cards.

---

## 2. Color

Values are estimates read from the screenshot — treat as a starting palette,
tune to taste.

### Surfaces & neutrals
| Token | Hex (approx) | Use |
|---|---|---|
| `shell` | `#151513` | Outer dark frame, hairline rules |
| `paper` | `#F3ECDF` | Working surface inside the shell |
| `card-map` | `#D3E4D2` | Map base (soft mint) |
| `card-map-light` | `#E4EEE0` | Lighter terrain / cleared areas on map |
| `pill-dark` | `#1C1C1A` | Address label pill (dark on map) |
| `ink` | `#2A2A26` | Primary text |
| `ink-faded` | `#B4B2A4` | Dimmed / inactive timeline entries |

### Accent palette (stat cards, top → bottom)
Each stat card is a solid pastel fill with a slightly darker same-hue border and
a small drop shadow.

| Metric | Token | Fill (approx) |
|---|---|---|
| 移動總距離 (distance) | `coral` | `#EF6555` |
| 步行總距離 (walk dist.) | `amber` | `#F3BE4D` |
| 溫度 (temp) | `orange` | `#F2A25A` |
| 濕度 (humidity) | `sky` | `#9CC0DC` |
| 氣壓 (pressure) | `lilac` | `#BFA5D4` |
| 高度 (altitude) | `mint` | `#ADD2A2` |

### Functional accents
| Token | Hex (approx) | Use |
|---|---|---|
| `route` | `#E8503A` | Route line on map, progress bar fill |
| `pin` | `#D6459A` | Current-location pin (magenta) |
| `play` | `#F2A03D` | Play button fill |
| `tag` | `#7FB69E` | Timeline category badges (soft teal-green) |

Palette principle: one warm cream ground, one cool mint map, and a **rainbow of
muted pastels** for data — saturated enough to read at a glance, soft enough to
stay calm together. Only two "hot" colors (route red, pin magenta) are allowed
to pop, and they mark the single thing the user is tracking: where they are.

---

## 3. Typography

Four distinct roles, intentionally contrasted:

1. **Logo wordmark** — bold *italic serif* ("Lifelog Viewer"). High-contrast,
   editorial, slightly nostalgic (think Playfair Display / Georgia italic).
2. **Eyebrow / kicker** — "TRAVEL MEMORY PLAYER" in a light sans, uppercase,
   wide letter-spacing (~0.2em), small size, muted.
3. **Data / numerals** — **monospace**, bold, large for the value
   (`805.82`, `1173`) with a much smaller monospace unit trailing (`km`, `m`,
   `°C`, `%`, `hPa`). All player timestamps (`00:02:01`) use this mono too.
4. **Body / labels** — clean sans-serif for Chinese labels and timeline text
   (Noto Sans TC style). Stat labels (移動總距離) are small; timeline
   descriptions are regular weight.

Hierarchy inside a stat card: tiny label on top, oversized mono number below,
tiny unit riding the baseline of the number.

---

## 4. Components

### Header
- Left: circular spiral/target glyph + stacked wordmark (eyebrow over serif logo).
- Right: two monospace groups — `第 N 天 · YYYY/MM/DD` and a live `HH:MM:SS`
  clock, separated by thin vertical dividers.

### Map card
- Rounded (~20px) mint surface with muted street/terrain rendering and
  light-gray labeled roads (Schwendistadel, Boden, Maiezyt, Tschiemen…).
- **Route** drawn as a solid red polyline.
- **Current position**: magenta teardrop pin; **footprints** icon nearby shows
  recent walking direction.
- **Address pill** (top-left overlay): dark rounded pill, white text, holds the
  full place string, e.g. `Naturfreundenhaus, Tschiemen 755, 3804 Habkern, 瑞士`.
- **Mini-map inset** (bottom-left): small rounded card showing a zoomed-out
  locator view with a red dot for context.

### Stat cards (the color column)
- Vertical stack of 6 identical **pill cards**, evenly gapped.
- Each: solid pastel fill, ~1px darker border, soft drop shadow, ~16px radius.
- Content: small label (top-left) → big mono value → small mono unit.
- Order is fixed: distance, walk distance, temp, humidity, pressure, altitude.

### Timeline panel
- Cream rounded card, vertically scrollable.
- Each **event row**: left gutter with monospace time (`10:04`), a small colored
  category **badge** (景點 scenic / 休息 rest / 住宿 lodging), and a one-line
  Chinese description beneath.
- **Day dividers**: bold `第 N 天` heading with a right-aligned mono date and a
  full-width hairline rule.
- **Active vs. inactive**: events at/near the current playback time are full-ink
  black; events outside the current window are rendered in `ink-faded` gray
  (both already-passed tail and not-yet-reached future). This ties the list to
  the scrubber position.

### Player bar
- Left cluster: round **play** button (amber, dark triangle) + outlined
  **pause** button.
- Elapsed timestamp (mono) → **progress track**: gray rounded rail, red fill up
  to the round scrubber **handle**, then gray remainder → total-time timestamp.
- The bar visually mirrors a video/audio scrubber so the "replay your trip"
  metaphor reads instantly.

---

## 5. Shape, depth & spacing

- **Roundness everywhere.** Shell ~24px; cards ~16–20px; pills fully rounded;
  buttons circular. Nothing is a sharp corner.
- **Soft elevation.** Cards and the shell use low, diffuse drop shadows — enough
  to lift off the paper, never harsh.
- **Breathing room.** Consistent gaps between the three regions and between stat
  pills; the paper ground shows through as connective tissue.
- **One thin line for structure.** Section separators and day dividers are
  single hairlines in the shell/edge color, no boxes.

---

## 6. Design principles (the why)

1. **Journey as media.** A trip is treated like a recording you can play, pause,
   and scrub. Every element supports that mental model — the timeline is the
   playlist, the map is the video, the stats are the live overlay.
2. **Calm data, hot position.** Metrics live in a soothing pastel rainbow;
   saturated red and magenta are reserved exclusively for *where you are now*.
3. **Warm and analog.** Cream paper, italic serif logo, and rounded forms give a
   scrapbook/keepsake feeling rather than a clinical dashboard.
4. **Glanceable numbers.** Monospace, oversized values with tiny units make each
   stat readable in a fraction of a second while playback runs.
5. **Time is the spine.** The scrubber, the clock, the per-event timestamps, and
   the fade state of the timeline are all bound to a single playback position.
