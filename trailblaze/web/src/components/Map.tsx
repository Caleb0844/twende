import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "../types";
import { CATEGORY_COLORS } from "../types";

// Fix Leaflet default icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Props = {
  userLat: number;
  userLng: number;
  places: Place[];
  onPlaceClick?: (place: Place) => void;
};

function categoryIcon(category: string, checkedIn: boolean) {
  const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? "#64748b";
  return L.divIcon({
    html: `
      <div style="
        background:${color};
        width:28px;height:28px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
        opacity:${checkedIn ? 0.5 : 1};
      "></div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

export default function Map({ userLat, userLng, places, onPlaceClick }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerId = "trailblaze-map";

  useEffect(() => {
    if (mapRef.current) return; // Already initialized

    const map = L.map(containerId).setView([userLat, userLng], 13);
    mapRef.current = map;

    // OpenStreetMap tiles — free, no API key
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // User location marker
    L.circleMarker([userLat, userLng], {
      radius: 8,
      fillColor: "#3b82f6",
      color: "white",
      weight: 2,
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup("📍 You are here");

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [userLat, userLng]);

  // Update place markers when places change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing place markers (keep user marker)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    places.forEach((place) => {
      const marker = L.marker([place.lat, place.lng], {
        icon: categoryIcon(place.category, !!place.checked_in),
      }).addTo(map);

      const dist = place.distance_km ? `${place.distance_km.toFixed(1)} km away` : "";
      marker.bindPopup(`
        <strong>${place.name}</strong><br>
        <span style="text-transform:capitalize">${place.category}</span> · ${dist}
        ${place.checked_in ? '<br><em>✅ Visited</em>' : ''}
      `);

      if (onPlaceClick) marker.on("click", () => onPlaceClick(place));
    });
  }, [places, onPlaceClick]);

  return <div id={containerId} style={{ height: "100%", width: "100%", borderRadius: "12px" }} />;
}
