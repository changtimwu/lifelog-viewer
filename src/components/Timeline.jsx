import { CATEGORIES, SANS, MONO, C } from "../theme.js";
import { fmtDate } from "../lib/time.js";

const pad = (n) => String(n).padStart(2, "0");
const hhmm = (ms) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function Timeline({ events, photos = [], currentMs, activePhotoId, onPhotoClick }) {
  // Merge events and photos into one time-ordered list; day dividers and the
  // passed/faded state then apply uniformly to both.
  const items = [
    ...events.map((e) => ({ ...e, kind: "event" })),
    ...photos.map((p) => ({ ...p, kind: "photo" })),
  ].sort((a, b) => a.ms - b.ms);

  const rows = [];
  let lastDay = null;

  items.forEach((item, idx) => {
    if (item.day !== lastDay) {
      lastDay = item.day;
      rows.push(
        <div key={`d${item.day}-${idx}`} style={{ margin: idx === 0 ? "0 0 14px" : "22px 0 14px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 17, color: C.ink }}>第 {item.day} 天</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "#9a978b" }}>{fmtDate(item.ms)}</span>
          </div>
          <div style={{ height: 1, background: "#d9d1c0" }} />
        </div>
      );
    }

    const passed = currentMs >= item.ms;
    const time = (
      <span style={{ fontFamily: MONO, fontSize: 12.5, color: passed ? "#8a8577" : C.inkFaded, paddingTop: 2, minWidth: 38 }}>
        {item.kind === "event" ? item.time : hhmm(item.ms)}
      </span>
    );

    if (item.kind === "photo") {
      const active = item.id === activePhotoId;
      rows.push(
        <div key={`p${item.id}`} style={{ display: "flex", gap: 12, marginBottom: 16, opacity: passed ? 1 : 0.42 }}>
          {time}
          <button
            onClick={() => onPhotoClick?.(item)}
            title={item.name}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: active ? 4 : 0,
              margin: active ? -4 : 0, border: "none", background: active ? "rgba(214,69,154,.1)" : "transparent",
              borderRadius: 12, cursor: "pointer", textAlign: "left", font: "inherit",
            }}
          >
            <img
              className="lv-tl-photo"
              src={item.url}
              alt={item.name || ""}
              style={{ outline: active ? `2px solid ${C.pin}` : "2px solid transparent" }}
            />
            <span style={{ fontFamily: SANS, fontSize: 13, color: passed ? C.ink : C.inkFaded, lineHeight: 1.35, wordBreak: "break-word" }}>
              {item.name || "照片"}
            </span>
          </button>
        </div>
      );
      return;
    }

    const cat = CATEGORIES[item.category] || { label: item.category };
    rows.push(
      <div key={`e${idx}`} style={{ display: "flex", gap: 12, marginBottom: 16, opacity: passed ? 1 : 0.42 }}>
        {time}
        <div>
          <span
            style={{
              display: "inline-block", fontFamily: SANS, fontSize: 10.5, fontWeight: 700,
              color: passed ? "#2c4a3e" : "#7c8a83", background: passed ? C.tag : "#cdd6cf",
              padding: "2px 9px", borderRadius: 999, marginBottom: 5,
            }}
          >
            {cat.label}
          </span>
          <div style={{ fontFamily: SANS, fontSize: 13.5, color: passed ? C.ink : C.inkFaded, lineHeight: 1.4 }}>
            {item.text}
          </div>
        </div>
      </div>
    );
  });

  return (
    <div
      style={{
        flex: "0 0 30%",
        background: C.paper,
        borderRadius: 18,
        padding: "4px 4px",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,.03)",
      }}
    >
      <div
        style={{
          height: 468,
          overflowY: "auto",
          padding: "12px 16px",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, #000 26px, #000 calc(100% - 26px), transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0, #000 26px, #000 calc(100% - 26px), transparent 100%)",
        }}
      >
        {rows}
      </div>
    </div>
  );
}
