import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MapPickerProps {
  onLocationSelect: (address: string) => void;
  mapCenter?: [number, number] | null;
}

const CenterMarker = () => {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[400] pointer-events-none drop-shadow-2xl">
      {/* SVG Map Pin */}
      <svg className="w-10 h-10 text-rose-500" fill="currentColor" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.3))' }}>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
      {/* Small dot exactly at the center for visual precision */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black rounded-full opacity-40 shadow-[0_0_4px_rgba(0,0,0,0.8)] translate-y-0.5"></div>
    </div>
  );
};

const MapEvents = ({ onMoveEnd }: { onMoveEnd: (center: L.LatLng) => void }) => {
  const map = useMapEvents({
    moveend: () => {
      onMoveEnd(map.getCenter());
    },
  });
  return null;
};

export const MapPicker = ({ onLocationSelect, mapCenter }: MapPickerProps) => {
  const defaultCenter: [number, number] = [28.6315, 77.2167]; // Connaught Place, New Delhi
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  React.useEffect(() => {
    if (mapCenter && mapRef.current) {
      mapRef.current.flyTo(mapCenter, 16);
    }
  }, [mapCenter]);

  const fetchAddress = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        onLocationSelect(data.display_name);
      } else {
        onLocationSelect(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (err) {
      console.error(err);
      onLocationSelect(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 16);
        }
        fetchAddress(lat, lng);
      },
      (error) => {
        setIsLoading(false);
        alert('Unable to retrieve your location');
      }
    );
  };

  return (
    <div className="relative mt-2" style={{ height: '300px', width: '100%', borderRadius: '1rem', overflow: 'hidden' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={15} 
        style={{ height: '100%', width: '100%', zIndex: 10 }}
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onMoveEnd={(center) => fetchAddress(center.lat, center.lng)} />
      </MapContainer>
      
      {/* Fixed Center Marker */}
      <CenterMarker />

      {/* Locate Me Button */}
      <button 
        type="button"
        onClick={handleLocateMe}
        className="absolute bottom-4 right-4 z-[400] bg-white p-3 rounded-full shadow-2xl hover:bg-slate-100 transition-all border border-slate-200 active:scale-95"
        title="Locate Me"
      >
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
          <circle cx="12" cy="10" r="3" strokeWidth="2.5" />
        </svg>
      </button>

      {/* Instructions Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/80 text-white px-5 py-2.5 rounded-full text-[10px] font-black tracking-widest uppercase backdrop-blur-md shadow-2xl border border-white/20 pointer-events-none">
        Drag map to set pin
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-black/50 z-[500] flex items-center justify-center backdrop-blur-sm transition-opacity">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span className="text-white font-black tracking-widest uppercase text-[10px] shadow-sm">Fetching Address...</span>
          </div>
        </div>
      )}
    </div>
  );
};
