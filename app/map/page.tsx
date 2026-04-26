'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  GoogleMap,
  Marker,
  Circle,
  InfoWindow,
  OverlayViewF,
  OVERLAY_MOUSE_TARGET,
  useJsApiLoader,
} from '@react-google-maps/api';
import {
  LocateFixed,
  Heart,
  ExternalLink,
  User,
  Search,
  SlidersHorizontal,
  X,
  Navigation,
  Plus,
} from 'lucide-react';
import { pinService } from '@/lib/api';
import { FishingPin } from '@/lib/types';
import { useAuthStore } from '@/lib/store';
import { FISH_SPECIES, DISTANCE_OPTIONS, formatDateThai, formatNumber } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const mapContainerStyle = { width: '100%', height: '100%' };
const MARKER_SIZE = 48;
const DEFAULT_DISTANCE = 50;

const buildMapsDirectionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

export default function MapPage() {
  const [pins, setPins] = useState<FishingPin[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Pending = what's in the form. Committed = what was applied via "ค้นหา".
  // We split them so the radius circle only appears after the user actually
  // searches — typing into the dropdowns shouldn't redraw the map.
  const [pendingSpecies, setPendingSpecies] = useState<string>('');
  const [pendingDistance, setPendingDistance] = useState<number>(DEFAULT_DISTANCE);
  const [committedSpecies, setCommittedSpecies] = useState<string>('');
  const [committedDistance, setCommittedDistance] = useState<number>(DEFAULT_DISTANCE);

  // Circle is only drawn after the user presses "ค้นหา".
  const [searchArea, setSearchArea] = useState<{
    center: { lat: number; lng: number };
    radiusKm: number;
  } | null>(null);

  const [activePin, setActivePin] = useState<FishingPin | null>(null);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showLabels] = useState(true);
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
      if (!userLocation) return;
      setSearching(true);
      try {
        let fetchedPins: FishingPin[] = [];
        if (committedSpecies) {
          fetchedPins = await pinService.getPinsByFishSpecies(committedSpecies);
        } else {
          fetchedPins = await pinService.getNearbyPins(
            userLocation.lat,
            userLocation.lng,
            committedDistance
          );
        }
        setPins(fetchedPins);
      } catch (error) {
        console.error('Error fetching pins:', error);
      } finally {
        setSearching(false);
      }
    };
    fetchPins();
  }, [userLocation, committedSpecies, committedDistance]);

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

  // Approximate the circle's lat/lng bounds and fit them with a small pad so
  // the radius is fully visible. Using a Circle ref + getBounds() would also
  // work but requires waiting for the overlay to mount.
  const fitToRadius = (center: { lat: number; lng: number }, radiusKm: number) => {
    if (!mapRef.current) return;
    const earthRadiusKm = 6371;
    const dLat = (radiusKm / earthRadiusKm) * (180 / Math.PI);
    const dLng = dLat / Math.cos((center.lat * Math.PI) / 180);
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: center.lat + dLat, lng: center.lng + dLng });
    bounds.extend({ lat: center.lat - dLat, lng: center.lng - dLng });
    mapRef.current.fitBounds(bounds, 80);
  };

  const handleSearch = () => {
    if (!userLocation) return;
    setCommittedSpecies(pendingSpecies);
    setCommittedDistance(pendingDistance);
    setSearchArea({ center: userLocation, radiusKm: pendingDistance });
    setFiltersOpen(false);
    fitToRadius(userLocation, pendingDistance);
  };

  const handleResetFilters = () => {
    setPendingSpecies('');
    setPendingDistance(DEFAULT_DISTANCE);
    setCommittedSpecies('');
    setCommittedDistance(DEFAULT_DISTANCE);
    setSearchArea(null);
  };

  const filtersAreActive = !!committedSpecies || committedDistance !== DEFAULT_DISTANCE;

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
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation}
        zoom={13}
        mapTypeId="satellite"
        onLoad={onMapLoad}
        options={{
          mapTypeId: 'satellite',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          styles: showLabels
            ? []
            : [
                {
                  featureType: 'all',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }],
                },
              ],
        }}
      >
        {/* Search radius — only visible after user pressed "ค้นหา". */}
        {searchArea && (
          <Circle
            center={searchArea.center}
            radius={searchArea.radiusKm * 1000}
            options={{
              strokeColor: '#22C55E',
              strokeOpacity: 0.9,
              strokeWeight: 2,
              fillColor: '#22C55E',
              fillOpacity: 0.1,
              clickable: false,
            }}
          />
        )}

        {/* Current user location */}
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
          zIndex={999}
        />

        {/* Other users' fishing pins (and the current user's) */}
        {pins.map((pin) => {
          const isMine = !!user && pin.user_id === user.id;
          return (
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
                  className={`absolute inset-0 rounded-full border-[3px] shadow-lg overflow-hidden flex items-center justify-center bg-dark-gray transition-transform hover:scale-110 ${
                    isMine ? 'border-accent ring-2 ring-accent/40' : 'border-primary'
                  }`}
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
                  className={`absolute left-1/2 -translate-x-1/2 -bottom-1 w-2.5 h-2.5 rotate-45 ${
                    isMine ? 'bg-accent' : 'bg-primary'
                  }`}
                />
              </button>
            </OverlayViewF>
          );
        })}

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

              <a
                href={buildMapsDirectionsUrl(activePin.latitude, activePin.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm transition-colors"
              >
                <Navigation size={16} />
                ไปตามหมาย
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Floating filter panel — sits ON the map. */}
      <div className="absolute top-3 left-3 right-3 z-40 pointer-events-none">
        <div className="pointer-events-auto bg-secondary/95 backdrop-blur-md rounded-2xl shadow-2xl border border-dark-gray overflow-hidden">
          {/* Compact header — always visible */}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/15 text-primary flex-shrink-0">
              <SlidersHorizontal size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-light text-sm font-semibold truncate">
                {committedSpecies ? committedSpecies : `หมายในรัศมี ${committedDistance} กม.`}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {searching ? 'กำลังค้นหา...' : `พบ ${pins.length} หมาย`}
                {filtersAreActive && ' · มีการกรอง'}
              </p>
            </div>
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-full bg-dark-gray text-light flex-shrink-0 transition-transform ${
                filtersOpen ? 'rotate-45' : ''
              }`}
              aria-hidden
            >
              {filtersOpen ? <X size={16} /> : <SlidersHorizontal size={16} />}
            </span>
          </button>

          {/* Expanded filter form */}
          {filtersOpen && (
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-dark-gray/60">
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">ชนิดปลา</label>
                <SearchableSelect
                  value={pendingSpecies}
                  onChange={setPendingSpecies}
                  options={FISH_SPECIES}
                  placeholder="ทุกชนิด"
                  allowEmpty
                  emptyLabel="ทุกชนิด"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1.5">รัศมีค้นหา</label>
                <div className="flex flex-wrap gap-2">
                  {DISTANCE_OPTIONS.map((opt) => {
                    const active = pendingDistance === opt.value;
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setPendingDistance(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                          active
                            ? 'bg-primary text-light border-primary'
                            : 'bg-dark-gray text-gray-300 border-dark-gray hover:border-primary/60'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2.5 rounded-lg bg-dark-gray text-gray-300 text-sm font-medium hover:bg-dark-gray/70"
                >
                  ล้าง
                </button>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-opacity-80 text-light text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  <Search size={16} />
                  {searching ? 'กำลังค้นหา...' : 'ค้นหา'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating action buttons — bottom-right */}
      <div className="absolute right-4 bottom-6 z-40 flex flex-col gap-3 items-end">
        {user && (
          <Link
            href="/pin/new"
            aria-label="ปักหมุดใหม่"
            className="flex items-center gap-2 pl-4 pr-5 py-3 bg-primary hover:bg-opacity-80 text-light rounded-full shadow-2xl font-semibold transition-colors"
          >
            <Plus size={20} />
            ปักหมาย
          </Link>
        )}
        <button
          type="button"
          onClick={recenter}
          disabled={locating}
          aria-label="หาตำแหน่งปัจจุบัน"
          className="w-12 h-12 flex items-center justify-center bg-secondary/95 backdrop-blur-md hover:bg-dark-gray text-primary rounded-full shadow-2xl border border-dark-gray transition-colors disabled:opacity-60"
        >
          <LocateFixed size={20} className={locating ? 'animate-pulse' : ''} />
        </button>
      </div>

      {!user && (
        <div className="absolute bottom-6 left-4 right-20 bg-accent/20 border border-accent text-accent px-4 py-2 rounded-lg text-sm z-40">
          กรุณาเข้าสู่ระบบเพื่อปักหมุด
        </div>
      )}
    </div>
  );
}
