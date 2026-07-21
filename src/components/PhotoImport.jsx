import { useEffect, useRef, useState } from "react";
import { readPhotoMeta } from "../lib/exif.js";
import { C, SANS } from "../theme.js";

// EXIF sits at the front of a JPEG; reading the first slice avoids pulling
// whole (multi-MB) photos into memory just to parse metadata.
const HEADER_BYTES = 256 * 1024;

// Header control: upload photos. Each file's EXIF (capture time + GPS) is read
// in the browser; the raw list is handed to `onAddPhotos`, which places them on
// the map/timeline. `count` is shown on the button as feedback.
export default function PhotoImport({ onAddPhotos, count = 0 }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const fileRef = useRef(null);
  const seq = useRef(0);

  // Auto-dismiss the status note.
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 5000);
    return () => clearTimeout(t);
  }, [note]);

  const onFiles = async (e) => {
    const files = [...(e.target.files || [])].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setBusy(true);
    setNote(null);
    try {
      const raw = [];
      for (const file of files) {
        let meta = {};
        try {
          meta = readPhotoMeta(await file.slice(0, HEADER_BYTES).arrayBuffer());
        } catch {
          meta = {};
        }
        raw.push({
          id: `p${seq.current++}`,
          name: file.name,
          url: URL.createObjectURL(file),
          dateTime: meta.dateTime || null,
          lat: Number.isFinite(meta.lat) ? meta.lat : null,
          lng: Number.isFinite(meta.lng) ? meta.lng : null,
        });
      }
      onAddPhotos(raw);
      const noGps = raw.filter((p) => p.lng == null).length;
      const noTime = raw.filter((p) => !p.dateTime).length;
      const bits = [`已加入 ${raw.length} 張`];
      if (noGps) bits.push(`${noGps} 張無定位（依時間放到路線上）`);
      if (noTime) bits.push(`${noTime} 張無拍攝時間`);
      setNote(bits.join("，"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        className="lv-import-btn"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        style={{
          fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.paper,
          background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.16)",
          borderRadius: 999, padding: "6px 14px", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>＋</span> 照片
        {count > 0 && (
          <span style={{ fontFamily: SANS, fontWeight: 700, color: "#cfc9bb" }}>· {count}</span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFiles}
        style={{ display: "none" }}
      />
      {note && (
        <div
          onClick={() => setNote(null)}
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, width: 240,
            background: C.paper, color: C.ink, borderRadius: 12, padding: "10px 12px",
            fontFamily: SANS, fontSize: 11.5, lineHeight: 1.4, zIndex: 20, cursor: "pointer",
            boxShadow: "0 12px 32px rgba(0,0,0,.32)",
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}
