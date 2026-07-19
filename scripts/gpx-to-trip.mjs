#!/usr/bin/env node
// Convert a GPX track into a trip JSON the viewer can load.
//
//   node scripts/gpx-to-trip.mjs track.gpx > public/data/my-trip.json
//   node scripts/gpx-to-trip.mjs track.gpx --tz=+02:00 --title="Switzerland" \
//        --country="瑞士" --place="Habkern" --walk-as-moved --out public/data/swiss.json
//
// Then point the viewer at it via useTrip("/data/my-trip.json").
//
// Flags:
//   --tz=±HH:MM | <minutes>   local offset applied to UTC timestamps (default 0)
//   --title --id --place --country --playback   trip metadata
//   --temp=<°C> --humidity=<%> --pressure=<hPa>  constant fallbacks for the
//                                                fields GPX doesn't carry
//                                                (pressure defaults to
//                                                altitude-derived)
//   --walk-as-moved           set walkKm = cumulative distance (on-foot tracks)
//   --out <file>              write here instead of stdout

import { readFileSync, writeFileSync } from "node:fs";
import { gpxToTrip } from "../src/lib/gpx.js";

function parseArgs(argv) {
  const flags = {};
  let input = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      input = a;
      continue;
    }
    const eq = a.indexOf("=");
    if (eq !== -1) flags[a.slice(2, eq)] = a.slice(eq + 1);
    else if (i + 1 < argv.length && !argv[i + 1].startsWith("--"))
      flags[a.slice(2)] = argv[++i];
    else flags[a.slice(2)] = true;
  }
  return { input, flags };
}

// "+02:00" / "-0130" / "120" (minutes) -> minutes east of UTC.
function tzToMinutes(tz) {
  if (tz == null) return 0;
  if (/^[+-]?\d+$/.test(String(tz))) return parseInt(tz, 10);
  const m = String(tz).match(/^([+-])(\d{2}):?(\d{2})$/);
  if (!m) throw new Error(`Bad --tz "${tz}" (use ±HH:MM or minutes).`);
  const mins = parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
  return m[1] === "-" ? -mins : mins;
}

const USAGE =
  "Usage: node scripts/gpx-to-trip.mjs <track.gpx> [--tz=±HH:MM] [--title=..] " +
  "[--id=..] [--place=..] [--country=..] [--playback=<sec>] [--temp=<°C>] " +
  "[--humidity=<%>] [--pressure=<hPa>] [--walk-as-moved] [--out <file>]";

const { input, flags } = parseArgs(process.argv.slice(2));
if (!input || flags.help) {
  console.error(USAGE);
  process.exit(input ? 0 : 1);
}

const gpx = readFileSync(input, "utf8");

const opts = {
  tzOffsetMinutes: tzToMinutes(flags.tz),
  walkAsMoved: !!flags["walk-as-moved"],
};
if (flags.temp != null) opts.tempC = parseFloat(flags.temp);
if (flags.humidity != null) opts.humidityPct = parseFloat(flags.humidity);
if (flags.pressure != null) opts.pressureHpa = parseFloat(flags.pressure);

const meta = {
  id: flags.id,
  title: flags.title,
  place: flags.place,
  country: flags.country,
  playbackSeconds: flags.playback != null ? parseInt(flags.playback, 10) : undefined,
};

let trip;
try {
  trip = gpxToTrip(gpx, meta, opts);
} catch (e) {
  console.error(`gpx-to-trip: ${e.message}`);
  process.exit(1);
}
const json = JSON.stringify(trip, null, 2) + "\n";

if (flags.out) {
  writeFileSync(flags.out, json);
  console.error(
    `Wrote ${trip.samples.length} samples over ${trip.days.length} day(s) -> ${flags.out}`
  );
} else {
  process.stdout.write(json);
}
