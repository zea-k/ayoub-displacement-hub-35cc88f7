import { ReactNode, useMemo } from "react";
import Map, { MapProps, NavigationControl } from "react-map-gl/mapbox";
import { MAPBOX_STYLE_DARK, MAPBOX_TOKEN, hasMapboxToken } from "@/lib/mapbox";
import { AlertTriangle } from "lucide-react";
import "./mapbox-styles.css";

/**
 * MapboxBase — reusable map wrapper.
 *
 * Initialization:
 *  - Reads the public token from VITE_MAPBOX_TOKEN (build-time Vite env var).
 *  - Uses the modern Mapbox dark style by default.
 *  - Renders a fallback panel when no token is configured so the app keeps working.
 *
 * Future scalability:
 *  - Real-time features: pass children (Sources/Layers/Markers) and update props.
 *  - Delivery tracking: animate a Marker by updating its longitude/latitude state.
 *  - AI-powered discovery: feed dynamic markers + Popups from your data layer.
 */
export interface MapboxBaseProps extends Partial<Omit<MapProps, "mapboxAccessToken">> {
  children?: ReactNode;
  className?: string;
  /** Enables 3D buildings & smooth pitch on the dark style. */
  enable3D?: boolean;
  showControls?: boolean;
}

export default function MapboxBase({
  children,
  className,
  enable3D = true,
  showControls = true,
  initialViewState,
  mapStyle = MAPBOX_STYLE_DARK,
  ...rest
}: MapboxBaseProps) {
  const initial = useMemo(
    () =>
      initialViewState ?? {
        longitude: 39.2083,
        latitude: -6.7924,
        zoom: 11,
        pitch: enable3D ? 45 : 0,
        bearing: 0,
      },
    [initialViewState, enable3D],
  );

  if (!hasMapboxToken()) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-muted/40 text-center p-6">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <p className="text-sm font-medium">Mapbox token missing</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Add <code className="font-mono">VITE_MAPBOX_TOKEN</code> in Workspace Settings → Build Secrets,
          then redeploy.
        </p>
      </div>
    );
  }

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={initial}
      mapStyle={mapStyle}
      style={{ width: "100%", height: "100%" }}
      attributionControl={{ compact: true }}
      reuseMaps
      onLoad={(e) => {
        // Enable 3D buildings layer on style load.
        if (!enable3D) return;
        const map = e.target;
        const layers = map.getStyle()?.layers;
        const labelLayerId = layers?.find(
          (l: any) => l.type === "symbol" && l.layout?.["text-field"],
        )?.id;
        if (!map.getLayer("3d-buildings")) {
          try {
            map.addLayer(
              {
                id: "3d-buildings",
                source: "composite",
                "source-layer": "building",
                filter: ["==", "extrude", "true"],
                type: "fill-extrusion",
                minzoom: 14,
                paint: {
                  "fill-extrusion-color": "#1a1f2e",
                  "fill-extrusion-height": [
                    "interpolate", ["linear"], ["zoom"],
                    14, 0, 16, ["get", "height"],
                  ],
                  "fill-extrusion-base": [
                    "interpolate", ["linear"], ["zoom"],
                    14, 0, 16, ["get", "min_height"],
                  ],
                  "fill-extrusion-opacity": 0.75,
                },
              },
              labelLayerId,
            );
          } catch {
            /* style may not support composite source — ignore */
          }
        }
      }}
      {...rest}
    >
      {showControls && <NavigationControl position="top-right" visualizePitch />}
      {children}
    </Map>
  );
}

/** Animated user-location marker content (use inside <Marker>). */
export function UserMarkerDot() {
  return (
    <div className="mb-user-marker" aria-label="Your location">
      <span className="ring" />
      <span className="ring delay" />
      <span className="core" />
    </div>
  );
}

/** Glowing shop marker content (use inside <Marker>). */
export function ShopMarkerPin({ featured = false }: { featured?: boolean }) {
  return (
    <div className={`mb-shop-marker${featured ? " featured" : ""}`} aria-label="Shop">
      <span className="pin" />
      <span className="dot" />
    </div>
  );
}
