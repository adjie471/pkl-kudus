'use client';

import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Icon Marker Leaflet di Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ pickMode, onPick }: { pickMode: 'start' | 'end'; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface AreaMapProps {
  latStart: number;
  lonStart: number;
  latEnd: number;
  lonEnd: number;
  pickMode: 'start' | 'end';
  onMapClick: (lat: number, lng: number) => void;
}

export default function AreaMap({ latStart, lonStart, latEnd, lonEnd, pickMode, onMapClick }: AreaMapProps) {
  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-10">
      <MapContainer center={[latStart, lonStart]} zoom={17} maxZoom={20} style={{ height: '100%', width: '100%' }}>
        <LayersControl position="topright">
          {/* Layer 1: Google Hybrid (Satelit + Label Nama Jalan) */}
          <LayersControl.BaseLayer checked name="Google Hybrid (Satelit + Nama Jalan)">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          </LayersControl.BaseLayer>

          {/* Layer 2: Google Streets (Standard Google Maps) */}
          <LayersControl.BaseLayer name="Google Maps (Peta Jalan)">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          </LayersControl.BaseLayer>

          {/* Layer 3: OpenStreetMap */}
          <LayersControl.BaseLayer name="OpenStreetMap Standard">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <LocationPicker pickMode={pickMode} onPick={onMapClick} />

        <Marker position={[latStart, lonStart]}>
          <Popup>Titik Awal Jalan</Popup>
        </Marker>
        <Marker position={[latEnd, lonEnd]}>
          <Popup>Titik Akhir Jalan</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}