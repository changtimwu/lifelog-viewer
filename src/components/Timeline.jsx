import { CATEGORIES, SANS, MONO, C } from "../theme.js";
import { fmtDate } from "../lib/time.js";

export default function Timeline({ events, currentMs }) {
  const rows = [];
  let lastDay = null;

  events.forEach((e, idx) => {
    if (e.day !== lastDay) {
      lastDay = e.day;
      rows.push(
        <div key={`d${e.day}`} style={{ margin: idx === 0 ? "0 0 14px" : "22px 0 14px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 17, color: C.ink }}>第 {e.day} 天</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "#9a978b" }}>{fmtDate(e.ms)}</span>
          </div>
          <div style={{ height: 1, background: "#d9d1c0" }} />
        </div>
      );
    }

    const passed = currentMs >= e.ms;
    const cat = CATEGORIES[e.category] || { label: e.category };
    rows.push(
      <div key={idx} style={{ display: "flex", gap: 12, marginBottom: 16, opacity: passed ? 1 : 0.42 }}>
        <span style={{ fontFamily: MONO, fontSize: 12.5, color: passed ? "#8a8577" : C.inkFaded, paddingTop: 2, minWidth: 38 }}>
          {e.time}
        </span>
        <div>
          <span
            style={{
              display: "inline-block",
              fontFamily: SANS,
              fontSize: 10.5,
              fontWeight: 700,
              color: passed ? "#2c4a3e" : "#7c8a83",
              background: passed ? C.tag : "#cdd6cf",
              padding: "2px 9px",
              borderRadius: 999,
              marginBottom: 5,
            }}
          >
            {cat.label}
          </span>
          <div style={{ fontFamily: SANS, fontSize: 13.5, color: passed ? C.ink : C.inkFaded, lineHeight: 1.4 }}>
            {e.text}
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
