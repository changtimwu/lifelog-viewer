import { toMs } from "./time.js";

// [[lng,lat], ...] for drawing the route line.
export const routeCoords = (samples) => samples.map((s) => [s.lng, s.lat]);

const lerp = (a, b, f) => a + (b - a) * f;

// Find the two samples bracketing `ms` and return the blend factor.
function bracket(samples, ms) {
  if (ms <= toMs(samples[0].t)) return { i: 0, j: 0, f: 0 };
  const last = samples.length - 1;
  if (ms >= toMs(samples[last].t)) return { i: last, j: last, f: 0 };
  for (let i = 0; i < last; i++) {
    const a = toMs(samples[i].t);
    const b = toMs(samples[i + 1].t);
    if (ms >= a && ms <= b) return { i, j: i + 1, f: b === a ? 0 : (ms - a) / (b - a) };
  }
  return { i: last, j: last, f: 0 };
}

// Interpolated position [lng, lat] at time `ms`.
export function positionAt(samples, ms) {
  const { i, j, f } = bracket(samples, ms);
  return [lerp(samples[i].lng, samples[j].lng, f), lerp(samples[i].lat, samples[j].lat, f)];
}

// Interpolated sensor/stat values at time `ms`.
export function sampleAt(samples, ms) {
  const { i, j, f } = bracket(samples, ms);
  const keys = ["alt", "tempC", "humidityPct", "pressureHpa", "movedKm", "walkKm"];
  const out = {};
  for (const k of keys) out[k] = lerp(samples[i][k], samples[j][k], f);
  return out;
}
