import Spiral from "./Spiral.jsx";
import { SERIF, SANS, MONO, C } from "../theme.js";

const Divider = () => (
  <span style={{ width: 1, height: 14, background: "#3a3a35", display: "inline-block" }} />
);

export default function Header({ day, date, clock }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 16px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Spiral />
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontFamily: SANS, fontSize: 8.5, letterSpacing: "0.32em", color: "#8f8b7f", marginBottom: 4 }}>
            TRAVEL&nbsp;MEMORY&nbsp;PLAYER
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 24, color: C.paper, letterSpacing: "0.5px" }}>
            Lifelog Viewer
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", fontFamily: MONO, color: "#EDE7DA", fontSize: 12.5 }}>
        <span style={{ padding: "0 16px", color: "#cfc9bb" }}>
          第 <b style={{ color: C.paper }}>{day}</b> 天
        </span>
        <Divider />
        <span style={{ padding: "0 16px" }}>{date}</span>
        <Divider />
        <span style={{ padding: "0 16px", minWidth: 78, textAlign: "center" }}>{clock}</span>
      </div>
    </header>
  );
}
