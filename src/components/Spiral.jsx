import { C } from "../theme.js";

export default function Spiral() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="16" fill="none" stroke="#3a3a35" strokeWidth="1.5" />
      <path
        d="M17 5 A12 12 0 1 1 5 17 A9 9 0 1 0 17 8 A6 6 0 1 1 23 17 A3 3 0 1 0 17 14"
        fill="none"
        stroke={C.play}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="17" cy="17" r="2.2" fill={C.route} />
    </svg>
  );
}
