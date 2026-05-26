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

export const shopIcon = new L.Icon.Default();

// Pulsing "you are here" marker — animated dot using DivIcon
// Animation styles are injected once.
if (typeof document !== "undefined" && !document.getElementById("user-pulse-style")) {
  const style = document.createElement("style");
  style.id = "user-pulse-style";
  style.innerHTML = `
    .user-pulse-marker { position: relative; width: 22px; height: 22px; }
    .user-pulse-marker .core {
      position: absolute; inset: 6px; border-radius: 9999px;
      background: hsl(217 91% 60%); border: 2px solid #fff;
      box-shadow: 0 2px 8px hsl(217 91% 60% / 0.45);
    }
    .user-pulse-marker .ring {
      position: absolute; inset: 0; border-radius: 9999px;
      background: hsl(217 91% 60% / 0.35);
      animation: user-pulse 1.8s ease-out infinite;
    }
    .user-pulse-marker .ring.delay { animation-delay: 0.9s; }
    @keyframes user-pulse {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(2.4); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

export const userIcon = L.divIcon({
  className: "",
  html: `<div class="user-pulse-marker"><span class="ring"></span><span class="ring delay"></span><span class="core"></span></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default L;
