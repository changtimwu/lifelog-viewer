import { STAT_DEFS, SANS, MONO } from "../theme.js";

export default function StatColumn({ values }) {
  return (
    <div style={{ flex: "0 0 130px", display: "flex", flexDirection: "column", gap: 11 }}>
      {STAT_DEFS.map((s) => (
        <div
          key={s.key}
          className="lv-stat"
          style={{
            background: s.bg,
            color: s.fg,
            border: `1.5px solid ${s.sh}`,
            borderRadius: 16,
            padding: "9px 13px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxShadow: "0 3px 8px rgba(0,0,0,.12)",
          }}
        >
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, opacity: 0.85, marginBottom: 3 }}>
            {s.label}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: "-0.5px", lineHeight: 1 }}>
              {values ? values[s.key].toFixed(s.digits) : "—"}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 9.5, opacity: 0.8 }}>{s.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
