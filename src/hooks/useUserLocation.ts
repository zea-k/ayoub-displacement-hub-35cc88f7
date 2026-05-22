import { useEffect, useState, useCallback } from "react";

export type UserLocation = { lat: number; lng: number } | null;

const LS_KEY = "zeetop_user_location_v1";
const TTL_MS = 1000 * 60 * 30; // 30 min

function readCached(): { loc: UserLocation; ts: number } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation>(() => {
    const c = readCached();
    if (c && Date.now() - c.ts < TTL_MS) return c.loc;
    return null;
  });
  const [status, setStatus] = useState<"idle" | "requesting" | "granted" | "denied" | "unavailable">(
    location ? "granted" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setStatus("granted");
        try {
          localStorage.setItem(LS_KEY, JSON.stringify({ loc, ts: Date.now() }));
        } catch {}
      },
      (err) => {
        setError(err.message);
        setStatus(err.code === 1 ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 1000 * 60 * 5 },
    );
  }, []);

  // Auto-prompt on mount if no cached location (silently — browser will gate the prompt)
  useEffect(() => {
    if (!location && status === "idle") request();
  }, [location, status, request]);

  return { location, status, error, request };
}
