import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { C } from "../theme.js";

// With a MapTiler key you get a proper styled basemap; without one we fall
// back to raster OpenStreetMap tiles (fine for local dev only).
const KEY = import.meta.env.VITE_MAPTILER_KEY;
const mapStyle = KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${KEY}`
  : {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors",
        },
      },
      layers: [{ id: "osm", type: "raster", source: "osm" }],
    };

function makePin() {
  const el = document.createElement("div");
  el.className = "lv-pin";
  el.innerHTML = `
    <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 1 c -9 0 -15 7 -15 15 c 0 11 15 25 15 25 s 15 -14 15 -25 c 0 -8 -6 -15 -15 -15 Z"
            fill="${C.pin}" stroke="#fff" stroke-width="2.5"/>
      <circle cx="17" cy="16" r="5.5" fill="#fff"/>
    </svg>`;
  return el;
}

export default function MapView({ route, position, following }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Create the map once.
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: position,
      zoom: 12.5,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: route } },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": C.route, "line-width": 4.5, "line-opacity": 0.9 },
      });
    });

    markerRef.current = new maplibregl.Marker({ element: makePin(), anchor: "bottom" })
      .setLngLat(position)
      .addTo(map);

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move the pin (and gently follow it while playing) as the playhead moves.
  useEffect(() => {
    if (markerRef.current) markerRef.current.setLngLat(position);
    if (following && mapRef.current) {
      mapRef.current.easeTo({ center: position, duration: 500 });
    }
  }, [position, following]);

  return (
    <div className="lv-map-wrap">
      <div ref={containerRef} className="lv-map" />
      <div className="lv-map-wash" />
    </div>
  );
}
