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

const lineFeature = (route) => ({
  type: "Feature",
  geometry: { type: "LineString", coordinates: route },
});

// Frame the whole route in view (used when a new trip is imported).
function fitToRoute(map, route) {
  if (!route || route.length < 2) return;
  const b = route.reduce(
    (bb, c) => bb.extend(c),
    new maplibregl.LngLatBounds(route[0], route[0])
  );
  map.fitBounds(b, { padding: 48, duration: 700, maxZoom: 14 });
}

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

function makePhotoPin(photo, onClick) {
  const el = document.createElement("div");
  el.className = "lv-photo-pin";
  const img = document.createElement("img");
  img.src = photo.url;
  img.alt = photo.name || "";
  el.appendChild(img);
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick(photo);
  });
  return el;
}

export default function MapView({
  route,
  position,
  following,
  photos = [],
  activePhotoId = null,
  onPhotoClick,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const routeRef = useRef(route);
  routeRef.current = route;
  const firstRouteRef = useRef(true);
  // Latest click handler, read at click time so the marker sync effect doesn't
  // depend on the (inline) callback's identity.
  const onPhotoClickRef = useRef(onPhotoClick);
  onPhotoClickRef.current = onPhotoClick;
  const photoMarkersRef = useRef(new Map()); // id -> { marker, el }

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
      map.addSource("route", { type: "geojson", data: lineFeature(routeRef.current) });
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

  // Redraw the route line + refit when the trip (route) changes. The initial
  // route keeps the designed center/zoom; later changes (imports) fit the view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (firstRouteRef.current) {
      firstRouteRef.current = false;
      return;
    }
    const draw = () => {
      const src = map.getSource("route");
      if (!src) return;
      src.setData(lineFeature(route));
      fitToRoute(map, route);
    };
    if (map.getSource("route")) draw();
    else map.once("load", draw);
  }, [route]);

  // Move the pin (and gently follow it while playing) as the playhead moves.
  useEffect(() => {
    if (markerRef.current) markerRef.current.setLngLat(position);
    if (following && mapRef.current) {
      mapRef.current.easeTo({ center: position, duration: 500 });
    }
  }, [position, following]);

  // Sync photo thumbnail markers with the `photos` list.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const store = photoMarkersRef.current;
    const next = new Set(photos.map((p) => p.id));
    // Drop markers for photos that are gone.
    for (const [id, { marker }] of store) {
      if (!next.has(id)) {
        marker.remove();
        store.delete(id);
      }
    }
    // Add markers for new photos.
    for (const photo of photos) {
      if (store.has(photo.id)) continue;
      const el = makePhotoPin(photo, (p) => onPhotoClickRef.current?.(p));
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([photo.lng, photo.lat])
        .addTo(map);
      store.set(photo.id, { marker, el });
    }
  }, [photos]);

  // Highlight the photo nearest the playhead.
  useEffect(() => {
    for (const [id, { el }] of photoMarkersRef.current) {
      el.classList.toggle("is-active", id === activePhotoId);
    }
  }, [activePhotoId, photos]);

  return (
    <div className="lv-map-wrap">
      <div ref={containerRef} className="lv-map" />
      <div className="lv-map-wash" />
    </div>
  );
}
