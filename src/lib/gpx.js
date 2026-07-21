// Parse a GPX track into the app's sample/trip shape.
//
// GPX only carries position, elevation, time, and (via the Garmin
// TrackPointExtension) air temperature. The viewer needs six numeric fields on
// every sample (see lib/geo.js `sampleAt`), so the ones GPX lacks are filled in:
// `movedKm` is the cumulative great-circle distance along the track,
// `pressureHpa` is derived from altitude with the standard-atmosphere formula,
// and the rest fall back to configurable constants.
//
// Times in GPX are UTC. The app parses sample timestamps as *local* wall-clock
// (the ISO strings deliberately have no `Z` — see lib/time.js), so pass
// `tzOffsetMinutes` for the trip's local zone (e.g. 120 for CEST) to make the
// header clock read local time.
//
// Dependency-free so it runs in both Node (scripts/gpx-to-trip.mjs) and the
// browser.

const R_KM = 6371.0088;
const rad = (deg) => (deg * Math.PI) / 180;
const pad = (n) => String(n).padStart(2, "0");
const round = (n, d) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

// Great-circle distance between two [lng, lat] points, in km.
function haversineKm(aLng, aLat, bLng, bLat) {
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Standard-atmosphere pressure (hPa) at a given altitude in metres.
const pressureAtAlt = (alt) => 1013.25 * (1 - 2.25577e-5 * alt) ** 5.25588;

// Format a UTC instant (ms) as a *naive local* ISO string with no `Z`, after
// shifting by `offsetMinutes`. Uses UTC getters so the runtime's own zone can't
// leak into the result.
function naiveLocalISO(ms, offsetMinutes) {
  const d = new Date(ms + offsetMinutes * 60000);
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

// Estimate the per-index spacing (ms) around a known-time point, from its
// nearest timed neighbour.
function cadenceAround(known, i, fallbackMs) {
  for (let a = i - 1; a >= 0; a--)
    if (known[a] != null) return (known[i] - known[a]) / (i - a);
  for (let b = i + 1; b < known.length; b++)
    if (known[b] != null) return (known[b] - known[i]) / (b - i);
  return fallbackMs;
}

// Resolve one timestamp (ms) per trackpoint. Real <time> values win; points
// missing a time are interpolated between timed neighbours (extrapolated at the
// ends). A track with no times at all is spaced uniformly by `intervalSec`.
function resolveTimesMs(pts, intervalSec) {
  const known = pts.map((p) => (p.time ? Date.parse(p.time) : null));
  const stepMs = intervalSec * 1000;
  if (!known.some((v) => v != null)) {
    const t0 = Date.UTC(2000, 0, 1); // fallback epoch for time-less tracks
    return pts.map((_, i) => t0 + i * stepMs);
  }
  const out = known.slice();
  for (let k = 0; k < out.length; k++) {
    if (out[k] != null) continue;
    let prev = -1;
    let next = -1;
    for (let a = k - 1; a >= 0; a--) if (known[a] != null) { prev = a; break; }
    for (let b = k + 1; b < out.length; b++) if (known[b] != null) { next = b; break; }
    if (prev >= 0 && next >= 0)
      out[k] = known[prev] + ((known[next] - known[prev]) * (k - prev)) / (next - prev);
    else if (prev >= 0) out[k] = known[prev] + (k - prev) * cadenceAround(known, prev, stepMs);
    else out[k] = known[next] - (next - k) * cadenceAround(known, next, stepMs);
  }
  return out;
}

// Pull the trackpoints out of GPX text. GPX's <trkpt> subset is regular enough
// to read directly, which keeps this free of an XML-parser dependency.
function parseTrackpoints(gpx) {
  const pts = [];
  // <trkpt lat=".." lon=".."> … </trkpt>, plus the self-closing form.
  const re = /<trkpt\b([^>]*?)(?:\/>|>([\s\S]*?)<\/trkpt>)/gi;
  const attr = (s, name) => {
    const m = s.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));
    return m ? parseFloat(m[1]) : NaN;
  };
  const tag = (s, name) => {
    if (!s) return null;
    // Allow a namespace prefix, e.g. <ele>, <time>, <gpxtpx:atemp>.
    const m = s.match(
      new RegExp(`<(?:\\w+:)?${name}\\b[^>]*>([^<]*)</(?:\\w+:)?${name}>`, "i")
    );
    return m ? m[1].trim() : null;
  };
  let m;
  while ((m = re.exec(gpx))) {
    const attrs = m[1] || "";
    const body = m[2] || "";
    const lat = attr(attrs, "lat");
    const lng = attr(attrs, "lon");
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const eleStr = tag(body, "ele");
    const timeStr = tag(body, "time");
    const tempStr = tag(body, "atemp"); // Garmin TrackPointExtension
    pts.push({
      lat,
      lng,
      ele: eleStr != null ? parseFloat(eleStr) : null,
      time: timeStr, // ISO 8601 UTC (has Z), or null
      atemp: tempStr != null ? parseFloat(tempStr) : null,
    });
  }
  return pts;
}

// Parse a timezone offset into minutes east of UTC. Accepts "+02:00", "-0130",
// or a bare minute count ("120"). Returns 0 for null/empty.
export function tzOffsetToMinutes(tz) {
  if (tz == null || tz === "") return 0;
  if (/^[+-]?\d+$/.test(String(tz).trim())) return parseInt(tz, 10);
  const m = String(tz).trim().match(/^([+-])(\d{2}):?(\d{2})$/);
  if (!m) throw new Error(`Bad timezone offset "${tz}" (use ±HH:MM or minutes).`);
  const mins = parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
  return m[1] === "-" ? -mins : mins;
}

export const DEFAULTS = {
  tzOffsetMinutes: 0, // UTC -> local shift applied to every timestamp
  tempC: 0, // used for points with no <atemp>
  humidityPct: 0, // GPX carries no humidity
  pressureHpa: null, // null => derive from altitude (standard atmosphere)
  walkAsMoved: false, // true => walkKm mirrors movedKm (pure on-foot tracks)
  sampleIntervalSec: 1, // spacing used only when the GPX has no <time> at all
};

// GPX text -> samples[] ready for the viewer.
export function gpxToSamples(gpx, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const pts = parseTrackpoints(gpx);
  if (!pts.length) throw new Error("No <trkpt> points found in GPX.");

  const timesMs = resolveTimesMs(pts, o.sampleIntervalSec);

  let movedKm = 0;
  return pts.map((p, i) => {
    if (i > 0) {
      const prev = pts[i - 1];
      movedKm += haversineKm(prev.lng, prev.lat, p.lng, p.lat);
    }
    const ms = timesMs[i];
    const alt = Number.isFinite(p.ele) ? p.ele : 0;
    return {
      t: naiveLocalISO(ms, o.tzOffsetMinutes),
      lng: round(p.lng, 6),
      lat: round(p.lat, 6),
      alt: round(alt, 1),
      tempC: round(Number.isFinite(p.atemp) ? p.atemp : o.tempC, 1),
      humidityPct: round(o.humidityPct, 1),
      pressureHpa: round(
        o.pressureHpa == null ? pressureAtAlt(alt) : o.pressureHpa,
        1
      ),
      movedKm: round(movedKm, 2),
      walkKm: round(o.walkAsMoved ? movedKm : 0, 2),
    };
  });
}

// GPX text -> a full trip object (samples + a day skeleton) in the shape useTrip
// expects. Timeline events aren't part of a GPX track, so `days[].events` start
// empty — populate them from photos/notes/calendar, or merge an events file, in
// a later step.
export function gpxToTrip(gpx, meta = {}, opts = {}) {
  const samples = gpxToSamples(gpx, opts);

  // One day entry per distinct local date, numbered from 1.
  const days = [];
  const seen = new Set();
  for (const s of samples) {
    const date = s.t.slice(0, 10);
    if (!seen.has(date)) {
      seen.add(date);
      days.push({ day: days.length + 1, date, events: [] });
    }
  }

  const first = Date.parse(samples[0].t);
  const last = Date.parse(samples[samples.length - 1].t);
  const spanSec = Math.round((last - first) / 1000);

  return {
    id: meta.id || "imported-trip",
    title: meta.title || "Imported Trip",
    place: meta.place || "",
    country: meta.country || "",
    playbackSeconds: meta.playbackSeconds || Math.max(1, spanSec) || 300,
    days,
    samples,
  };
}
