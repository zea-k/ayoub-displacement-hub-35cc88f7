import { useEffect, useMemo } from "react";
import { Marker, Popup, Source, Layer, useMap } from "react-map-gl/mapbox";
import { useState } from "react";
import MapboxBase, { ShopMarkerPin, UserMarkerDot } from "./MapboxBase";

interface Props {
  shopPos: [number, number]; // [lat, lng] for backward compat
  userPos: [number, number] | null; // [lat, lng]
  routeCoords: [number, number][] | null; // [lat, lng]
  shopName: string;
}

function FitBounds({ shopPos, userPos, routeCoords }: Omit<Props, "shopName">) {
  const { current: map } = useMap();
  useEffect(() => {
    if (!map) return;
    const pts: [number, number][] = routeCoords?.length
      ? routeCoords.map(([lat, lng]) => [lng, lat])
      : userPos
        ? [
            [shopPos[1], shopPos[0]],
            [userPos[1], userPos[0]],
          ]
        : [[shopPos[1], shopPos[0]]];
    if (pts.length === 1) {
      map.flyTo({ center: pts[0], zoom: 16, duration: 1000 });
      return;
    }
    const lngs = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 50, duration: 1000, maxZoom: 17 },
    );
  }, [map, shopPos[0], shopPos[1], userPos?.[0], userPos?.[1], routeCoords?.length]);
  return null;
}

export default function ShopRouteMapInner({ shopPos, userPos, routeCoords, shopName }: Props) {
  const [showPopup, setShowPopup] = useState(true);

  const routeGeoJson = useMemo(() => {
    if (!routeCoords || routeCoords.length < 2) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: routeCoords.map(([lat, lng]) => [lng, lat]),
      },
    };
  }, [routeCoords]);

  return (
    <MapboxBase
      initialViewState={{
        longitude: shopPos[1],
        latitude: shopPos[0],
        zoom: 16,
        pitch: 50,
      }}
    >
      {routeGeoJson && (
        <Source id="route" type="geojson" data={routeGeoJson}>
          <Layer
            id="route-glow"
            type="line"
            paint={{
              "line-color": "#a78bfa",
              "line-width": 10,
              "line-opacity": 0.25,
              "line-blur": 4,
            }}
          />
          <Layer
            id="route-line"
            type="line"
            paint={{
              "line-color": "#7c3aed",
              "line-width": 5,
              "line-opacity": 0.9,
            }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
        </Source>
      )}

      <Marker longitude={shopPos[1]} latitude={shopPos[0]} anchor="bottom" onClick={() => setShowPopup(true)}>
        <ShopMarkerPin featured />
      </Marker>

      {showPopup && (
        <Popup
          longitude={shopPos[1]}
          latitude={shopPos[0]}
          anchor="top"
          offset={12}
          onClose={() => setShowPopup(false)}
          closeButton={false}
        >
          <strong className="text-sm">{shopName}</strong>
        </Popup>
      )}

      {userPos && (
        <Marker longitude={userPos[1]} latitude={userPos[0]} anchor="center">
          <UserMarkerDot />
        </Marker>
      )}

      <FitBounds shopPos={shopPos} userPos={userPos} routeCoords={routeCoords} />
    </MapboxBase>
  );
}
