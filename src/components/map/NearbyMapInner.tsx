import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { shopIcon, userIcon } from "./leaflet-setup";

interface NearbyShop {
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  userLocation: { lat: number; lng: number } | null;
  shops: NearbyShop[];
}

function Fit({ userLocation, shops }: Props) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [
      ...shops.map((s) => [s.lat, s.lng] as [number, number]),
      ...(userLocation ? [[userLocation.lat, userLocation.lng] as [number, number]] : []),
    ];
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(pts.map((p) => L.latLng(p[0], p[1]))), {
        padding: [40, 40],
      });
    }
  }, [shops.length, userLocation?.lat, userLocation?.lng]);
  return null;
}

export default function NearbyMapInner({ userLocation, shops }: Props) {
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : shops[0]
      ? [shops[0].lat, shops[0].lng]
      : [-6.7924, 39.2083]; // Dar es Salaam default

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}
      {shops.map((s) => (
        <Marker key={s.slug} position={[s.lat, s.lng]} icon={shopIcon}>
          <Popup>
            <div className="space-y-1">
              <strong>{s.name}</strong>
              <div>
                <a href={`/store/${s.slug}`} className="text-primary underline text-xs">
                  Open shop →
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      <Fit userLocation={userLocation} shops={shops} />
    </MapContainer>
  );
}
