import { useState, useEffect, useMemo, useCallback } from "react";
import { useTrip } from "../data/useTrip.js";
import { positionAt, sampleAt } from "../lib/geo.js";
import { fmtClock, fmtDate, dateKey } from "../lib/time.js";
import { C, SANS } from "../theme.js";
import Header from "./Header.jsx";
import MapView from "./MapView.jsx";
import StatColumn from "./StatColumn.jsx";
import Timeline from "./Timeline.jsx";
import PlayerBar from "./PlayerBar.jsx";
import GpxImport from "./GpxImport.jsx";

const LOOP_SECONDS = 42; // real seconds to scrub the whole trip once
const DEFAULT_SOURCE = "/data/trip-switzerland.json";

export default function LifelogViewer() {
  // `source` is a JSON URL (the bundled sample) or an imported trip object.
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const { trip, error, samples, route, startMs, endMs, events } = useTrip(source);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Reset the playhead whenever the trip changes. The bundled sample opens near
  // 16:50 on day 4 (echoing the original screenshot); imports start at 0.
  useEffect(() => {
    if (!trip) return;
    const target = new Date("2026-07-13T16:50:26").getTime();
    const useHero = trip.id === "switzerland-2026" && target >= startMs && target <= endMs;
    setProgress(useHero ? (target - startMs) / (endMs - startMs) : 0);
    setPlaying(false);
  }, [trip, startMs, endMs]);

  // Playback loop.
  useEffect(() => {
    if (!playing) return;
    const perMs = 1 / (LOOP_SECONDS * 1000);
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = now - last;
      last = now;
      setProgress((p) => {
        const next = p + perMs * dt;
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const currentMs = trip ? startMs + progress * (endMs - startMs) : 0;

  const dayNumber = useMemo(() => {
    if (!trip) return "";
    const key = dateKey(currentMs);
    const match = trip.days.find((d) => d.date === key);
    return match ? match.day : trip.days[trip.days.length - 1].day;
  }, [trip, currentMs]);

  const position = trip ? positionAt(samples, currentMs) : [0, 0];
  const values = trip ? sampleAt(samples, currentMs) : null;

  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (progress >= 1) {
        setProgress(0);
        return true;
      }
      return !p;
    });
  }, [progress]);

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: SANS, color: C.ink }}>
        Couldn’t load the trip: {error}. Check that <code>public/data/trip-switzerland.json</code> exists.
      </div>
    );
  }
  if (!trip) {
    return <div style={{ padding: 40, fontFamily: SANS, color: "#8f8b7f" }}>Loading trip…</div>;
  }

  const placeLabel =
    [trip.place, trip.country].filter(Boolean).join(", ") || trip.title;

  return (
    <div className="lv-page">
      <div className="lv-shell" style={{ fontVariantNumeric: "tabular-nums" }}>
        <Header
          day={dayNumber}
          date={fmtDate(currentMs)}
          clock={fmtClock(currentMs)}
          tools={<GpxImport onImport={setSource} />}
        />

        <div style={{ display: "flex", gap: 12, padding: "0 4px" }}>
          <div className="lv-map-card">
            <MapView route={route} position={position} following={playing} />
            {placeLabel && <div className="lv-address">{placeLabel}</div>}
          </div>

          <StatColumn values={values} />

          <Timeline events={events} currentMs={currentMs} />
        </div>

        <PlayerBar
          progress={progress}
          playing={playing}
          totalSeconds={trip.playbackSeconds}
          onToggle={toggle}
          onStop={() => setPlaying(false)}
          onSeek={(p) => setProgress(p)}
        />
      </div>
    </div>
  );
}
