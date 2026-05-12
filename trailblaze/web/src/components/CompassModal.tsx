// @ts-nocheck
import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  bearing: number;
  cardinal: string;
  distance: number | null;
  placeName: string;
  placeLat: number;
  placeLng: number;
  onClose: () => void;
};

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBearing(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Smoothly interpolate angles using shortest path
function shortestAngle(from, to) {
  let diff = ((to - from + 180) % 360) - 180;
  if (diff < -180) diff += 360;
  return from + diff;
}

export default function CompassModal({ bearing: initialBearing, cardinal, distance: initialDistance, placeName, placeLat, placeLng, onClose }: Props) {
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [destAngle, setDestAngle] = useState(initialBearing);
  const [liveDistance, setLiveDistance] = useState(initialDistance);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [error, setError] = useState(null);

  const prevHeadingRef = useRef(0);
  const smoothHeadingRef = useRef(0);
  const prevDestRef = useRef(initialBearing);
  const smoothDestRef = useRef(initialBearing);
  const [smoothHeading, setSmoothHeading] = useState(0);
  const [smoothDest, setSmoothDest] = useState(initialBearing);

  // Watch user position for live distance + bearing update
  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const dist = haversine(latitude, longitude, placeLat, placeLng);
          setLiveDistance(dist);
          const newBearing = getBearing(latitude, longitude, placeLat, placeLng);
          setDestAngle(newBearing);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [placeLat, placeLng]);

  // Device orientation
  useEffect(() => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      setNeedsPermission(true);
    } else {
      startListening();
    }
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation, true);
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, []);

  function handleOrientation(e) {
    const heading = e.webkitCompassHeading != null
      ? e.webkitCompassHeading
      : e.absolute && e.alpha != null
      ? (360 - e.alpha) % 360
      : null;
    if (heading !== null) {
      // Smooth heading
      const smooth = shortestAngle(smoothHeadingRef.current, heading);
      smoothHeadingRef.current = smooth;
      setSmoothHeading(smooth);
      setPermissionGranted(true);
    }
  }

  // Smooth destination angle
  useEffect(() => {
    const smooth = shortestAngle(smoothDestRef.current, destAngle);
    smoothDestRef.current = smooth;
    setSmoothDest(smooth);
  }, [destAngle]);

  function startListening() {
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);
    setPermissionGranted(true);
  }

  async function requestPermission() {
    try {
      const result = await DeviceOrientationEvent.requestPermission();
      if (result === "granted") startListening();
      else setError("Permission denied.");
    } catch { setError("Could not request compass permission."); }
  }

  const needleRotation = smoothDest - smoothHeading;
  const northRotation = -smoothHeading;

  const dist = liveDistance != null ? liveDistance : initialDistance;
  const distStr = dist != null
    ? dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(2)} km`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #1a1008 0%, #0a0804 100%)" }}>

      {/* Vintage texture overlay */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
        }} />

      {/* Close */}
      <button onClick={onClose}
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}>
        <X className="h-5 w-5" style={{ color: "#d4af37" }} />
      </button>

      {/* Title */}
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "#8b7355" }}>
        Navigating To
      </p>
      <h2 className="mb-1 text-lg font-bold" style={{ color: "#d4af37", fontFamily: "serif", letterSpacing: "0.05em" }}>
        {placeName}
      </h2>

      {/* Live distance */}
      {distStr && (
        <p className="mb-6 text-2xl font-bold" style={{ color: "#f5e6c8", fontFamily: "serif" }}>
          {distStr}
          <span className="ml-2 text-sm font-normal" style={{ color: "#8b7355" }}>
            {cardinal} · {Math.round(((smoothDest % 360) + 360) % 360)}°
          </span>
        </p>
      )}

      {/* Compass */}
      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>

        {/* Outer decorative ring */}
        <div className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 35%, #3d2b1a, #1a0e05)",
            border: "3px solid #d4af37",
            boxShadow: "0 0 40px rgba(212,175,55,0.2), inset 0 0 60px rgba(0,0,0,0.8)",
          }} />

        {/* Inner compass face */}
        <div className="absolute rounded-full"
          style={{
            inset: 16,
            background: "radial-gradient(circle at 40% 30%, #f5e6c8 0%, #c4a882 40%, #8b6914 100%)",
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)",
          }} />

        {/* Compass rose lines */}
        {[0, 45, 90, 135].map((deg) => (
          <div key={deg} className="absolute"
            style={{
              width: "1px",
              height: "220px",
              background: "rgba(100,70,30,0.4)",
              top: "50%",
              left: "50%",
              transformOrigin: "0 0",
              transform: `translate(-50%, -50%) rotate(${deg}deg)`,
            }} />
        ))}

        {/* Degree ticks */}
        {Array.from({ length: 72 }).map((_, i) => (
          <div key={i} className="absolute"
            style={{
              width: i % 9 === 0 ? "2px" : "1px",
              height: i % 9 === 0 ? "16px" : "8px",
              background: i % 9 === 0 ? "rgba(100,70,30,0.8)" : "rgba(100,70,30,0.4)",
              top: "18px",
              left: "50%",
              transformOrigin: `0px ${122}px`,
              transform: `translateX(-50%) rotate(${i * 5}deg)`,
            }} />
        ))}

        {/* Cardinal letters — rotate with compass */}
        {[
          { label: "N", deg: 0, color: "#8b0000", size: 18 },
          { label: "S", deg: 180, color: "#3d2b1a", size: 16 },
          { label: "E", deg: 90, color: "#3d2b1a", size: 16 },
          { label: "W", deg: 270, color: "#3d2b1a", size: 16 },
          { label: "NE", deg: 45, color: "#5a3e28", size: 10 },
          { label: "SE", deg: 135, color: "#5a3e28", size: 10 },
          { label: "SW", deg: 225, color: "#5a3e28", size: 10 },
          { label: "NW", deg: 315, color: "#5a3e28", size: 10 },
        ].map(({ label, deg, color, size }) => (
          <div key={label} className="absolute flex items-center justify-center font-bold"
            style={{
              width: 24, height: 24,
              color, fontSize: size,
              fontFamily: "serif",
              top: "50%", left: "50%",
              transformOrigin: "0 0",
              transform: `rotate(${deg + northRotation}deg) translateY(-88px) translateX(-12px)`,
              transition: "transform 0.1s ease-out",
            }}>
            {label}
          </div>
        ))}

        {/* North needle (red/white — classic) */}
        <div className="absolute" style={{
          width: 0, height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderBottom: "75px solid #cc2200",
          top: "50%", left: "50%",
          transformOrigin: "50% 100%",
          transform: `translate(-50%, -100%) rotate(${northRotation}deg)`,
          transition: "transform 0.12s ease-out",
          filter: "drop-shadow(0 0 6px rgba(204,34,0,0.4))",
        }} />
        <div className="absolute" style={{
          width: 0, height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "65px solid #5a3e28",
          top: "50%", left: "50%",
          transformOrigin: "50% 0%",
          transform: `translate(-50%, 0%) rotate(${northRotation}deg)`,
          transition: "transform 0.12s ease-out",
        }} />

        {/* Destination needle (gold) */}
        <div className="absolute" style={{
          width: 0, height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderBottom: "85px solid #d4af37",
          top: "50%", left: "50%",
          transformOrigin: "50% 100%",
          transform: `translate(-50%, -100%) rotate(${needleRotation}deg)`,
          transition: "transform 0.15s ease-out",
          filter: "drop-shadow(0 0 8px rgba(212,175,55,0.8))",
        }} />
        <div className="absolute" style={{
          width: 0, height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "50px solid rgba(212,175,55,0.3)",
          top: "50%", left: "50%",
          transformOrigin: "50% 0%",
          transform: `translate(-50%, 0%) rotate(${needleRotation}deg)`,
          transition: "transform 0.15s ease-out",
        }} />

        {/* Center jewel */}
        <div className="absolute z-10 rounded-full"
          style={{ width: 20, height: 20, background: "radial-gradient(circle at 35% 35%, #fff, #d4af37)", border: "2px solid #8b6914", boxShadow: "0 0 8px rgba(212,175,55,0.6)" }} />
        <div className="absolute z-10 rounded-full"
          style={{ width: 8, height: 8, background: "#1a0e05" }} />
      </div>

      {/* Legend */}
      <div className="mt-6 flex gap-8 text-xs" style={{ color: "#8b7355" }}>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ background: "#cc2200" }} />
          <span>North</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ background: "#d4af37" }} />
          <span>Destination</span>
        </div>
      </div>

      <p className="mt-3 text-[10px]" style={{ color: "#5a3e28" }}>
        Hold device flat · Turn to align gold needle
      </p>

      {/* iOS permission */}
      {needsPermission && !permissionGranted && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
          style={{ background: "radial-gradient(ellipse at center, #1a1008 0%, #0a0804 100%)" }}>
          <p className="text-5xl mb-4">🧭</p>
          <p className="font-bold mb-2" style={{ color: "#d4af37", fontFamily: "serif", fontSize: 18 }}>Compass Access Required</p>
          <p className="text-sm mb-6" style={{ color: "#8b7355" }}>Allow motion access to use the live compass.</p>
          <button onClick={requestPermission}
            className="rounded-full px-8 py-3 text-sm font-bold"
            style={{ background: "#d4af37", color: "#1a0e05" }}>
            Allow Compass Access
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm px-8 text-center" style={{ color: "#cc2200" }}>{error}</p>}
    </div>
  );
}