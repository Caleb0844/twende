import type { Place } from "../types";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../types";

type Props = {
  place: Place;
  onCheckIn?: (place: Place) => void;
  isLoggedIn: boolean;
};

export default function PlaceCard({ place, onCheckIn, isLoggedIn }: Props) {
  const color = CATEGORY_COLORS[place.category] ?? "#64748b";
  const label = CATEGORY_LABELS[place.category] ?? place.category;

  return (
    <div style={{
      border: `1px solid #e2e8f0`,
      borderRadius: "12px",
      padding: "14px",
      marginBottom: "10px",
      background: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "white",
          background: color,
          borderRadius: "999px",
          padding: "2px 10px",
          letterSpacing: "0.5px",
        }}>
          {label}
        </span>
        {place.distance_km != null && (
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            {place.distance_km.toFixed(1)} km
          </span>
        )}
      </div>

      <h3 style={{ margin: "8px 0 4px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
        {place.name}
      </h3>

      {place.description && (
        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 8px" }}>
          {place.description}
        </p>
      )}

      {place.address && (
        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 10px" }}>
          📍 {place.address}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {place.added_by && (
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            Added by @{place.added_by}
          </span>
        )}
        {place.checked_in ? (
          <span style={{ fontSize: "13px", color: "#22c55e", fontWeight: 600 }}>✅ Visited</span>
        ) : isLoggedIn && onCheckIn ? (
          <button
            onClick={() => onCheckIn(place)}
            style={{
              background: "#1e293b",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "6px 14px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Mark as visited · +5 pts
          </button>
        ) : null}
      </div>
    </div>
  );
}
