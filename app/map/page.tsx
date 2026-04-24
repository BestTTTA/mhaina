'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { GoogleMap, Marker, InfoWindow, OverlayViewF, OVERLAY_MOUSE_TARGET, useJsApiLoader } from '@react-google-maps/api';
import { Plus, LocateFixed, Heart, ExternalLink, User } from 'lucide-react';
import { pinService } from '@/lib/api';
import { FishingPin } from '@/lib/types';
import { useAuthStore } from '@/lib/store';
import { FISH_SPECIES, DISTANCE_OPTIONS, formatDateThai, formatNumber } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const mapContainerStyle = { width: '100%', height: '100%' };
const MARKER_SIZE = 48;

export default function MapPage() {
  const [pins, setPins] = useState<FishingPin[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
  const [activePin, setActivePin] = useState<FishingPin | null>(null);
  const [locating, setLocating] = useState(false);
  const { user } = useAuthStore();
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    // Bangkok center — used when geolocation is denied, unavailable, or slow.
    // Without this fallback the map page hangs forever on the loading screen.
    const FALLBACK = { lat: 13.7563, lng: 100.5018 };
    let resolved = false;
    const fallbackTimer = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      setUserLocation(FALLBACK);
    }, 8000);

    if (!navigator.geolocation) {
      clearTimeout(fallbackTimer);
      resolved = true;
      setUserLocation(FALLBACK);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(fallbackTimer);
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(fallbackTimer);
        console.error('Geolocation error:', error);
        setUserLocation(FALLBACK);
      },
      { timeout: 8000, maximumAge: 60000 }
    );

    return () => clearTimeout(fallbackTimer);
  }, []);

  useEffect(() => {
    const fetchPins = async () => {
      try {
        let fetchedPins: FishingPin[] = [];
        if (selectedSpecies) {
          fetchedPins = await pinService.getPinsByFishSpecies(selectedSpecies);
        } else if (userLocation) {
          fetchedPins = await pinService.getNearbyPins(
            userLocation.lat,
            userLocation.lng,
            selectedDistance || 50
          );
        }
        setPins(fetchedPins);
      } catch (error) {
        console.error('Error fetching pins:', error);
      }
    };
    if (userLocation) fetchPins();
  }, [userLocation, selectedSpecies, selectedDistance]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const recenter = () => {
    if (!mapRef.current) return;
    const panTo = (loc: { lat: number; lng: number }) => {
      mapRef.current!.panTo(loc);
      mapRef.current!.setZoom(15);
    };
    if (!navigator.geolocation) {
      if (userLocation) panTo(userLocation);
      return;
    }
    setLocating(true);
    // maximumAge: 0 forces a fresh fix instead of returning the cached one.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const fresh = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(fresh);
        panTo(fresh);
      },
      (err) => {
        setLocating(false);
        console.error('Recenter geolocation error:', err);
        if (userLocation) panTo(userLocation);
      },
      { timeout: 8000, maximumAge: 0 }
    );
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-400">โหลดแผนที่ไม่สำเร็จ — ตรวจสอบ MAPS_API_KEY</p>
      </div>
    );
  }

  if (!isLoaded || !userLocation) {
    return <LoadingSpinner fullScreen message="กำลังโหลดแผนที่..." />;
  }

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={userLocation}
          zoom={13}
          mapTypeId="satellite"
          onLoad={onMapLoad}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
        >
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#0066FF',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />

          {pins.map((pin) => (
            <OverlayViewF
              key={pin.id}
              position={{ lat: pin.latitude, lng: pin.longitude }}
              mapPaneName={OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={() => ({ x: -MARKER_SIZE / 2, y: -MARKER_SIZE })}
            >
              <button
                type="button"
                onClick={() => setActivePin(pin)}
                aria-label={pin.user?.nickname || 'ดูรายละเอียดหมุด'}
                className="relative block cursor-pointer focus:outline-none"
                style={{ width: MARKER_SIZE, height: MARKER_SIZE }}
              >
                <span
                  className="absolute inset-0 rounded-full border-2 border-primary bg-dark-gray shadow-lg overflow-hidden flex items-center justify-center"
                >
                  {pin.user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pin.user.avatar_url}
                      alt={pin.user.nickname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-gray-300" />
                  )}
                </span>
                <span
                  className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-primary"
                />
              </button>
            </OverlayViewF>
          ))}

          {activePin && (
            <InfoWindow
              position={{ lat: activePin.latitude, lng: activePin.longitude }}
              onCloseClick={() => setActivePin(null)}
              options={{ pixelOffset: new google.maps.Size(0, -MARKER_SIZE - 4) }}
            >
              <div className="w-[260px] text-black">
                {activePin.image_url_1 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activePin.image_url_1}
                    alt={activePin.fish_species}
                    className="w-full h-32 object-cover rounded-md mb-2"
                  />
                )}

                <div className="flex items-center gap-2 mb-2">
                  {activePin.user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activePin.user.avatar_url}
                      alt={activePin.user.nickname}
                      className="w-9 h-9 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                      <User size={18} className="text-gray-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">
                      {activePin.user?.nickname || 'ไม่ระบุชื่อ'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateThai(activePin.created_at)}</p>
                  </div>
                </div>

                <p className="text-blue-600 font-bold text-base">{activePin.fish_species}</p>
                {activePin.fish_weight && (
                  <p className="text-sm text-gray-700">น้ำหนัก {activePin.fish_weight} กก.</p>
                )}
                {activePin.description && (
                  <p className="text-sm text-gray-700 mt-1 line-clamp-3 whitespace-pre-wrap">
                    {activePin.description}
                  </p>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  พิกัด {activePin.latitude.toFixed(4)}, {activePin.longitude.toFixed(4)}
                </p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
                  <span className="flex items-center gap-1 text-gray-600 text-sm">
                    <Heart size={16} />
                    {formatNumber(activePin.likes_count)}
                  </span>
                  <Link
                    href={`/pin/${activePin.id}`}
                    className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline"
                  >
                    ดูรายละเอียด
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      <div className="absolute top-0 left-0 right-0 bg-secondary/80 backdrop-blur p-4 space-y-3 z-40">
        <h1 className="text-lg font-bold text-light">แผนที่ปักหมุด</h1>
        <div className="flex gap-2">
          <select
            value={selectedSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-dark-gray text-light border border-dark-gray focus:border-primary outline-none text-sm"
          >
            <option value="">ทั้งหมด</option>
            {FISH_SPECIES.map((species) => (
              <option key={species} value={species}>{species}</option>
            ))}
          </select>
          <select
            value={selectedDistance || ''}
            onChange={(e) => setSelectedDistance(e.target.value ? parseInt(e.target.value) : null)}
            className="flex-1 px-3 py-2 rounded-lg bg-dark-gray text-light border border-dark-gray focus:border-primary outline-none text-sm"
          >
            <option value="">ระยะทาง</option>
            {DISTANCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lifted clear of the 80px BottomNavigation (h-20). bottom-28 = 7rem */}
      <div className="absolute bottom-28 right-4 flex flex-col gap-3 z-40">
        <button
          onClick={recenter}
          disabled={locating}
          aria-label="หาตำแหน่งปัจจุบัน"
          className="bg-primary hover:bg-opacity-80 text-light rounded-full p-3 transition-all shadow-lg disabled:opacity-50"
        >
          <LocateFixed size={24} className={locating ? 'animate-pulse' : ''} />
        </button>
        {user && (
          <button
            onClick={() => { window.location.href = '/pin/new'; }}
            aria-label="ปักหมุดใหม่"
            className="bg-primary hover:bg-opacity-80 text-light rounded-full p-3 transition-all shadow-lg"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      {!user && (
        <div className="absolute bottom-28 left-4 right-4 bg-accent/20 border border-accent text-accent px-4 py-2 rounded-lg text-sm z-40">
          กรุณาเข้าสู่ระบบเพื่อปักหมุด
        </div>
      )}
    </div>
  );
}
