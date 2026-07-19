// Design tokens from DESIGN.md. Single source of truth for the palette + type.
export const C = {
  shell: "#151513",
  paper: "#F3ECDF",
  ink: "#2A2A26",
  inkFaded: "#B4B2A4",
  pillDark: "#1C1C1A",
  route: "#E8503A",
  pin: "#D6459A",
  play: "#F2A03D",
  tag: "#7FB69E",
  mint: "#D3E4D2",
};

// Rounded / friendly type. Fraunces (soft italic display), Fredoka (chunky
// rounded numerals + Latin), Huninn 粉圓 (rounded Traditional-Chinese gothic),
// Noto Sans TC as the graceful CJK fallback.
export const SERIF = "'Fraunces', Georgia, serif";
export const MONO = "'Fredoka', 'Baloo 2', ui-rounded, system-ui, sans-serif";
export const SANS =
  "'Fredoka', 'Huninn', 'Noto Sans TC', ui-rounded, 'PingFang TC', sans-serif";

// Timeline category -> label + whether it uses the "active" tag color.
export const CATEGORIES = {
  scenic: { label: "景點" },
  rest: { label: "休息" },
  lodging: { label: "住宿" },
};

// Stat readouts: which sample field each pill shows, plus formatting + color.
export const STAT_DEFS = [
  { key: "movedKm", label: "移動總距離", unit: "km", digits: 2, bg: "#EF6555", fg: "#FFF4F1", sh: "#C7392B" },
  { key: "walkKm", label: "步行總距離", unit: "km", digits: 2, bg: "#F3BE4D", fg: "#3F320F", sh: "#D19E2E" },
  { key: "tempC", label: "溫度", unit: "°C", digits: 1, bg: "#F2A25A", fg: "#3E2510", sh: "#D0803A" },
  { key: "humidityPct", label: "濕度", unit: "%", digits: 1, bg: "#9CC0DC", fg: "#173241", sh: "#79A3C2" },
  { key: "pressureHpa", label: "氣壓", unit: "hPa", digits: 1, bg: "#BFA5D4", fg: "#2C2043", sh: "#9E82B6" },
  { key: "alt", label: "高度", unit: "m", digits: 0, bg: "#ADD2A2", fg: "#22391C", sh: "#8AB57E" },
];
