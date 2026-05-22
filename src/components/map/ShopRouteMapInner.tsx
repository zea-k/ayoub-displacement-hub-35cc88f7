import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { shopIcon, userIcon } from "./leaflet-setup";

interface Props {
  shopPos: [number, number];
  userPos: [number, number] | null;
  routeCoords: [number, number][] | null;
  shopName: string;
}

function FitBounds({ shopPos, userPos, routeCoords }: Omit<Props, "shopName">) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = routeCoords?.length
      ? routeCoords
      : userPos
        ? [shopPos, userPos]
        : [shopPos];
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [shopPos[0], shopPos[1], userPos?.[0], userPos?.[1], routeCoords?.length]);
  return null;
}

export default function ShopRouteMapInner({ shopPos, userPos, routeCoords, shopName }: Props) {
  return (
    <MapContainer center={shopPos} zoom={14} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={shopPos} icon={shopIcon}>
        <Popup>
          <strong>{shopName}</strong>
        </Popup>
      </Marker>
      {userPos && (
        <Marker position={userPos} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}
      {routeCoords && routeCoords.length > 1 && (
        <Polyline
          positions={routeCoords}
          pathOptions={{ color: "#7c3aed", weight: 5, opacity: 0.85 }}
        />
      )}
      <FitBounds shopPos={shopPos} userPos={userPos} routeCoords={routeCoords} />
    </MapContainer>
  );
}
