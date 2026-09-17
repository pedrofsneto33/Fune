'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

interface BurialsMapProps {
  burials: Array<{
    id: string;
    deceased_name: string;
    burial_date: string | null;
    cemetery_location: string | null;
    latitude: number;
    longitude: number;
  }>;
  height?: string;
}

const DEFAULT_CENTER: [number, number] = [-15.78, -47.93];

export default function BurialsMap({ burials, height = '500px' }: BurialsMapProps) {
  const center: [number, number] = burials.length > 0
    ? [burials[0].latitude, burials[0].longitude]
    : DEFAULT_CENTER;
  const zoom = burials.length > 0 ? 12 : 4;

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
        {burials.map((b) => (
          <Marker key={b.id} position={[b.latitude, b.longitude]}>
            <Popup>
              <div className="text-xs">
                <strong>{b.deceased_name}</strong>
                <br />
                {b.cemetery_location || 'Sem cemiterio'}
                <br />
                {b.burial_date ? new Date(b.burial_date).toLocaleDateString('pt-BR') : 'Data a definir'}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
