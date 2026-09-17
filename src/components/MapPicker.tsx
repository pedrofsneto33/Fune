'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Corrige o path dos icones padrao (bundlers quebram sem isso)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onSelect: (lat: number, lng: number) => void;
  height?: string;
}

function ClickHandler({ onSelect }: { onSelect: MapPickerProps['onSelect'] }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const DEFAULT_CENTER: [number, number] = [-15.78, -47.93]; // Brasil

export default function MapPicker({ latitude, longitude, onSelect, height = '400px' }: MapPickerProps) {
  const hasCoords = latitude !== null && longitude !== null;
  const center: [number, number] = hasCoords ? [latitude, longitude] : DEFAULT_CENTER;
  const zoom = hasCoords ? 15 : 4;

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasCoords && <Marker position={[latitude, longitude]} />}
        <ClickHandler onSelect={onSelect} />
      </MapContainer>
    </div>
  );
}
