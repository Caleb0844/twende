import { useState, useEffect } from "react";

type LocationState = {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
};

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    lat: null,
    lng: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported by this browser", loading: false }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState((s) => ({ ...s, error: err.message, loading: false }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return state;
}
