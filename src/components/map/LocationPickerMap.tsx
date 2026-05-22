import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { shopIcon } from "./leaflet-setup";

interface Props {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

// Default center: Dar es Salaam, Tanzania
const DEFAULT_CENTER: [number, number] = [-6.7924, 39.2083];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [position?.[0], position?.[1]]);
  return null;
}

export default function LocationPickerMap({ latitude, longitude, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const position: [number, number] | null =
    latitude != null && longitude != null ? [latitude, longitude] : null;

  const center = position ?? DEFAULT_CENTER;

  const handlePick = useCallback(
    (lat: number, lng: number) => {
      onChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    },
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={useMyLocation}
          disabled={locating}
          className="h-9"
        >
          {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
          Use my current location
        </Button>
      </div>

      <div className="relative h-[320px] w-full overflow-hidden rounded-xl border border-border/60 shadow-sm">
        <MapContainer
          center={center}
          zoom={position ? 15 : 11}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          <FlyTo position={position} />
          {position && (
            <Marker
              position={position}
              icon={shopIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target as L.Marker;
                  const ll = m.getLatLng();
                  handlePick(ll.lat, ll.lng);
                },
              }}
            />
          )}
        </MapContainer>
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
