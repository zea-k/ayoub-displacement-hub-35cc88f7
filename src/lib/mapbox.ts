// Mapbox configuration. Token is injected at build time via Vite env.
// Add `VITE_MAPBOX_TOKEN` as a Build Secret in Workspace Settings.
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export const MAPBOX_STYLE_DARK = "mapbox://styles/mapbox/dark-v11";
export const MAPBOX_STYLE_LIGHT = "mapbox://styles/mapbox/light-v11";
export const MAPBOX_STYLE_STREETS = "mapbox://styles/mapbox/streets-v12";

// Default fallback center: Dar es Salaam, Tanzania.
export const DEFAULT_CENTER: [number, number] = [39.2083, -6.7924]; // [lng, lat]

export const hasMapboxToken = () => Boolean(MAPBOX_TOKEN && MAPBOX_TOKEN.length > 10);
