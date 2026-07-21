import { useEffect, useState, useMemo } from "react";
import { toMs, eventMs } from "../lib/time.js";
import { routeCoords } from "../lib/geo.js";

// Loads a trip. `source` is either a JSON URL string (fetched from /public/data
// or an API) or an already-built trip object (e.g. from importing a GPX with
// lib/gpx.js). The shape is documented in README.md.
export function useTrip(source = "/data/trip-switzerland.json") {
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    // In-memory trip object: use it directly, no fetch.
    if (source && typeof source === "object") {
      setTrip(source);
      return;
    }
    // URL: fetch and parse JSON.
    let alive = true;
    setTrip(null);
    fetch(source)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load trip (${r.status})`);
        return r.json();
      })
      .then((data) => alive && setTrip(data))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [source]);

  const derived = useMemo(() => {
    if (!trip) return null;
    const samples = trip.samples;
    const route = routeCoords(samples);
    const startMs = toMs(samples[0].t);
    const endMs = toMs(samples[samples.length - 1].t);
    // Flatten events with absolute timestamps + their day number.
    const events = [];
    for (const d of trip.days) {
      for (const e of d.events) {
        events.push({ ...e, day: d.day, date: d.date, ms: eventMs(d.date, e.time) });
      }
    }
    events.sort((a, b) => a.ms - b.ms);
    return { samples, route, startMs, endMs, events };
  }, [trip]);

  return { trip, error, ...(derived || {}) };
}
