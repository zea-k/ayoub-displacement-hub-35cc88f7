import { useCallback, useState } from "react";
import { Marker, useMap } from "react-map-gl/mapbox";
import { useEffect } from "react";
import MapboxBase, { ShopMarkerPin } from "./MapboxBase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LocateFixed, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Props {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const { current: map } = useMap();
  useEffect(() => {
    if (!map || !position) return;
    map.flyTo({ center: [position[1], position[0]], zoom: 15, duration: 800 });
  }, [map, position?.[0], position?.[1]]);
  return null;
}

export default function LocationPickerMap({ latitude, longitude, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const position: [number, number] | null =
    latitude != null && longitude != null ? [latitude, longitude] : null;

  const handlePick = useCallback(
    (lat: number, lng: number) => onChange(Number(lat.toFixed(6)), Number(lng.toFixed(6))),
    [onChange],
  );

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePick(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
        toast.success("Location detected");
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || "Could not get location");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          Bonyeza ramani au buruta alama kuchagua eneo la duka.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={useMyLocation} disabled={locating} className="h-9">
          {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
          Use my current location
        </Button>
      </div>

      <div className="relative h-[320px] w-full overflow-hidden rounded-xl border border-border/60 shadow-sm">
        <MapboxBase
          initialViewState={{
            longitude: position ? position[1] : 39.2083,
            latitude: position ? position[0] : -6.7924,
            zoom: position ? 15 : 11,
            pitch: 35,
          }}
          onClick={(e) => handlePick(e.lngLat.lat, e.lngLat.lng)}
        >
          {position && (
            <Marker
              longitude={position[1]}
              latitude={position[0]}
              anchor="bottom"
              draggable
              onDragEnd={(e) => handlePick(e.lngLat.lat, e.lngLat.lng)}
            >
              <ShopMarkerPin featured />
            </Marker>
          )}
          <FlyTo position={position} />
        </MapboxBase>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Latitude</Label>
          <Input
            type="number"
            step="any"
            value={latitude ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") return;
              const n = Number(v);
              if (!isFinite(n)) return;
              onChange(n, longitude ?? 0);
            }}
            placeholder="-6.7924"
            className="h-10 font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Longitude</Label>
          <Input
            type="number"
            step="any"
            value={longitude ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") return;
              const n = Number(v);
              if (!isFinite(n)) return;
              onChange(latitude ?? 0, n);
            }}
            placeholder="39.2083"
            className="h-10 font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}
