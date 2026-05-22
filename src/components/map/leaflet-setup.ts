// Fix default Leaflet marker icons (broken under bundlers like Vite).
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// @ts-expect-error: private prop
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

export const shopIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:34px;height:34px;border-radius:50% 50% 50% 0;
    background:#e87b35;transform:rotate(-45deg);
    box-shadow:0 4px 14px rgba(0,0,0,.25);border:3px solid white;
    display:flex;align-items:center;justify-content:center;">
    <div style="width:10px;height:10px;background:white;border-radius:50%;transform:rotate(45deg);"></div>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

export const userIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#2563eb;border:3px solid white;
    box-shadow:0 0 0 4px rgba(37,99,235,.25);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default L;
