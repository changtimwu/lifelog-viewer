import { useRef, useCallback } from "react";
import { MONO, C } from "../theme.js";
import { fmtDuration } from "../lib/time.js";

export default function PlayerBar({ progress, playing, totalSeconds, onToggle, onStop, onSeek }) {
  const railRef = useRef(null);

  const seekFromX = useCallback(
    (clientX) => {
      const el = railRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      onSeek(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
    },
    [onSeek]
  );

  const onRailDown = (e) => {
    seekFromX(e.clientX);
    const move = (ev) => seekFromX(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <footer style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px 8px" }}>
      <button
        className="lv-btn"
        onClick={onToggle}
        aria-label={playing ? "Pause" : "Play"}
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          border: "none",
          background: C.play,
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 3px 8px rgba(0,0,0,.3)",
        }}
      >
        {playing ? (
          <svg width="12" height="13" viewBox="0 0 12 13">
            <rect x="1" y="0" width="3.4" height="13" rx="1" fill="#2A2A26" />
            <rect x="7.6" y="0" width="3.4" height="13" rx="1" fill="#2A2A26" />
          </svg>
        ) : (
          <svg width="13" height="14" viewBox="0 0 13 14">
            <path d="M1 1.2 12 7 1 12.8Z" fill="#2A2A26" />
          </svg>
        )}
      </button>

      <button
        className="lv-btn"
        onClick={onStop}
        aria-label="Stop playback"
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          cursor: "pointer",
          background: "transparent",
          border: "1.5px solid #4a4a45",
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg width="11" height="12" viewBox="0 0 11 12">
          <rect x="1" y="0" width="3" height="12" rx="1" fill="#c9c4b7" />
          <rect x="7" y="0" width="3" height="12" rx="1" fill="#c9c4b7" />
        </svg>
      </button>

      <span style={{ fontFamily: MONO, fontSize: 12, color: "#cfc9bb", minWidth: 62 }}>
        {fmtDuration(progress * totalSeconds)}
      </span>

      <div
        ref={railRef}
        onPointerDown={onRailDown}
        style={{ flex: 1, height: 20, display: "flex", alignItems: "center", cursor: "pointer", touchAction: "none" }}
      >
        <div style={{ position: "relative", width: "100%", height: 5, background: "#3a3a35", borderRadius: 999 }}>
          <div style={{ position: "absolute", inset: 0, width: `${progress * 100}%`, background: C.route, borderRadius: 999 }} />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${progress * 100}%`,
              transform: "translate(-50%,-50%)",
              width: 14,
              height: 14,
              borderRadius: 999,
              background: C.paper,
              border: `3px solid ${C.route}`,
              boxShadow: "0 2px 5px rgba(0,0,0,.4)",
            }}
          />
        </div>
      </div>

      <span style={{ fontFamily: MONO, fontSize: 12, color: "#cfc9bb", minWidth: 62, textAlign: "right" }}>
        {fmtDuration(totalSeconds)}
      </span>
    </footer>
  );
}
