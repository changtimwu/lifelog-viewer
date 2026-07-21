import { useRef, useState } from "react";
import { gpxToTrip, tzOffsetToMinutes } from "../lib/gpx.js";
import { C, SANS, MONO } from "../theme.js";

const pad2 = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
// minutes east of UTC -> "+02:00"
const formatOffset = (mins) =>
  `${mins < 0 ? "-" : "+"}${pad2(mins / 60)}:${pad2(mins % 60)}`;

// Derive a trip title from a file name or URL path.
const baseName = (name) =>
  (name || "")
    .split(/[\\/]/)
    .pop()
    .replace(/[?#].*$/, "")
    .replace(/\.gpx$/i, "") || "Imported Trip";

// Import a GPX track (file upload or URL) and hand the built trip to `onImport`.
// Parsing is done in the browser by lib/gpx.js — no round-trip to a server.
export default function GpxImport({ onImport }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [tz, setTz] = useState(() => formatOffset(-new Date().getTimezoneOffset()));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);

  const build = (text, title) => {
    const trip = gpxToTrip(text, { title }, { tzOffsetMinutes: tzOffsetToMinutes(tz) });
    onImport(trip);
    setErr(null);
    setUrl("");
    setOpen(false);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      build(await file.text(), baseName(file.name));
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onLoadUrl = async () => {
    const u = url.trim();
    if (!u) return;
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch(u);
      if (!r.ok) throw new Error(`Fetch failed (${r.status}).`);
      const text = await r.text();
      build(text, baseName(new URL(u, window.location.href).pathname));
    } catch (e2) {
      setErr(/fetch/i.test(e2.message) ? "Fetch failed — network or CORS blocked." : e2.message);
    } finally {
      setBusy(false);
    }
  };

  const label = { fontFamily: SANS, fontSize: 11, fontWeight: 700, color: "#7c7869", letterSpacing: ".02em" };
  const input = {
    width: "100%", fontFamily: MONO, fontSize: 12.5, color: C.ink,
    background: "#fff", border: "1px solid #d9d1c0", borderRadius: 10,
    padding: "8px 10px", outline: "none",
  };
  const solidBtn = {
    fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: "#3F320F",
    background: C.play, border: "none", borderRadius: 10, padding: "8px 12px",
    cursor: "pointer", whiteSpace: "nowrap",
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        className="lv-import-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.paper,
          background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.16)",
          borderRadius: 999, padding: "6px 14px", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>＋</span> 匯入 GPX
      </button>

      {open && (
        <>
          {/* click-away catcher */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 19 }}
          />
          <div
            style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0, width: 300,
              background: C.paper, color: C.ink, borderRadius: 16, padding: 16,
              zIndex: 20, boxShadow: "0 16px 40px rgba(0,0,0,.35)",
              display: "flex", flexDirection: "column", gap: 12,
            }}
          >
            <div style={label}>上傳 GPX 檔案</div>
            <input
              ref={fileRef}
              type="file"
              accept=".gpx,application/gpx+xml,text/xml"
              onChange={onFile}
              disabled={busy}
              style={{ fontFamily: SANS, fontSize: 12, color: C.ink }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#b3ab99", fontFamily: SANS, fontSize: 11 }}>
              <span style={{ flex: 1, height: 1, background: "#e0d8c7" }} /> 或 <span style={{ flex: 1, height: 1, background: "#e0d8c7" }} />
            </div>

            <div style={label}>GPX 連結</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="url"
                placeholder="https://…/track.gpx"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onLoadUrl()}
                disabled={busy}
                style={{ ...input, flex: 1 }}
              />
              <button className="lv-import-load" onClick={onLoadUrl} disabled={busy} style={solidBtn}>
                載入
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={label}>時區</span>
              <input
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                disabled={busy}
                style={{ ...input, width: 90, textAlign: "center" }}
              />
              <span style={{ fontFamily: SANS, fontSize: 10.5, color: "#a49c8a", lineHeight: 1.3 }}>
                UTC 位移，讓時鐘顯示當地時間
              </span>
            </div>

            {err && (
              <div style={{ fontFamily: SANS, fontSize: 11.5, color: "#C7392B", lineHeight: 1.35 }}>
                {err}
              </div>
            )}
            <div style={{ fontFamily: SANS, fontSize: 10.5, color: "#a49c8a", lineHeight: 1.35 }}>
              GPX 只含軌跡，時間軸事件會是空的。溫度取自 Garmin 擴充欄位，氣壓由高度推算。
            </div>
          </div>
        </>
      )}
    </div>
  );
}
