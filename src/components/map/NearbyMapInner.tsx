import { useEffect, useRef } from "react";
import { Marker, Popup, useMap } from "react-map-gl/mapbox";
import { useState } from "react";
import MapboxBase, { ShopMarkerPin, UserMarkerDot } from "./MapboxBase";

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

function FitBounds({ userLocation, shops }: Props) {
  const { current: map } = useMap();
  useEffect(() => {
    if (!map) return;
    const pts: [number, number][] = [
      ...shops.map((s) => [s.lng, s.lat] as [number, number]),
      ...(userLocation ? [[userLocation.lng, userLocation.lat] as [number, number]] : []),
    ];
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.flyTo({ center: pts[0], zoom: 14, duration: 1200 });
      return;
    }
    const lngs = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 60, duration: 1000, maxZoom: 15 },
    );
  }, [map, userLocation?.lat, userLocation?.lng, shops.length]);
  return null;
}

export default function NearbyMapInner({ userLocation, shops }: Props) {
  const [active, setActive] = useState<NearbyShop | null>(null);
  const initialCenter = userLocation
    ? { longitude: userLocation.lng, latitude: userLocation.lat }
    : shops[0]
      ? { longitude: shops[0].lng, latitude: shops[0].lat }
      : { longitude: 39.2083, latitude: -6.7924 };

  return (
    <MapboxBase
      initialViewState={{ ...initialCenter, zoom: 12, pitch: 45, bearing: -10 }}
    >
      {userLocation && (
        <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
          <UserMarkerDot />
        </Marker>
      )}
      {shops.map((s) => (
        <Marker
          key={s.slug}
          longitude={s.lng}
          latitude={s.lat}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setActive(s);
          }}
        >
          <ShopMarkerPin />
        </Marker>
      ))}
      {active && (
        <Popup
          longitude={active.lng}
          latitude={active.lat}
          anchor="top"
          onClose={() => setActive(null)}
          closeButton={false}
          offset={12}
        >
          <div className="space-y-1 min-w-[140px]">
            <strong className="block text-sm">{active.name}</strong>
            <a
              href={`/store/${active.slug}`}
              className="text-primary text-xs hover:underline"
            >
              Open shop →
            </a>
          </div>
        </Popup>
      )}
      <FitBounds userLocation={userLocation} shops={shops} />
    </MapboxBase>
  );
}
