'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { RankingList } from '@/components/ui/RankingList';
import { PinCard } from '@/components/ui/PinCard';
import { statsService, pinService } from '@/lib/api';
import { UserStats, FishingPin } from '@/lib/types';

// Cap each home-page query so a slow Supabase response (common on first-visit
// iPhone Safari over cellular) can never hang the whole UI.
const HOME_FETCH_TIMEOUT_MS = 12000;
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// Drop replacement images at these paths (or rename and update here).
const POPUP_ADS = [
  '/ads/popup/ติดต่อลงโฆษณา.png',
  '/ads/popup/ad-1.png'
];
const POPUP_INTERVAL_MS = 4000;

export default function HomePage() {
  const [topUsers, setTopUsers] = useState<UserStats[]>([]);
  const [popularPins, setPopularPins] = useState<FishingPin[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPins, setLoadingPins] = useState(true);
  const [showAdPopup, setShowAdPopup] = useState(true);
  const [popupIndex, setPopupIndex] = useState(0);
  const popupTouchStartXRef = useRef<number | null>(null);
  const popupTouchStartYRef = useRef<number | null>(null);

  const handlePopupTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    popupTouchStartXRef.current = touch.clientX;
    popupTouchStartYRef.current = touch.clientY;
  };

  const handlePopupTouchMove = (e: React.TouchEvent) => {
    if (popupTouchStartXRef.current === null || popupTouchStartYRef.current === null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - popupTouchStartXRef.current;
    const deltaY = touch.clientY - popupTouchStartYRef.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  };

  const handlePopupTouchEnd = (e: React.TouchEvent) => {
    if (popupTouchStartXRef.current === null || popupTouchStartYRef.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - popupTouchStartXRef.current;
    const deltaY = touch.clientY - popupTouchStartYRef.current;
    if (
      POPUP_ADS.length > 1 &&
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > 40
    ) {
      if (deltaX < 0) {
        setPopupIndex((i) => (i + 1) % POPUP_ADS.length);
      } else {
        setPopupIndex((i) => (i - 1 + POPUP_ADS.length) % POPUP_ADS.length);
      }
    }
    popupTouchStartXRef.current = null;
    popupTouchStartYRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;

    // Fire each fetch independently so a slow query can't block the other —
    // and clamp each with a timeout so the UI never sits on a spinner forever.
    withTimeout(statsService.getTopFishermen(10), HOME_FETCH_TIMEOUT_MS, 'getTopFishermen')
      .then((users) => {
        if (!cancelled) setTopUsers(users);
      })
      .catch((error) => console.warn('[HomePage] top fishermen fetch failed:', error))
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });

    withTimeout(pinService.getPopularPins(10), HOME_FETCH_TIMEOUT_MS, 'getPopularPins')
      .then((pins) => {
        if (!cancelled) setPopularPins(pins);
      })
      .catch((error) => console.warn('[HomePage] popular pins fetch failed:', error))
      .finally(() => {
        if (!cancelled) setLoadingPins(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showAdPopup || POPUP_ADS.length <= 1) return;
    const timer = setInterval(() => {
      setPopupIndex((i) => (i + 1) % POPUP_ADS.length);
    }, POPUP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [showAdPopup]);

  // Carousel is 16:9 landscape (full width × auto).
  const carouselAds = [
    '/ads/carousel/ติดต่อลงโฆษณา.png',
    '/ads/carousel/cad-1.png',
    '/ads/carousel/cad-1.png',
    '/ads/carousel/cad-1.png',
    '/ads/carousel/cad-1.png',
  ];

  return (
    <>
      {/* Ad Popup */}
      {showAdPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="relative w-72 aspect-[2/3] bg-dark-gray rounded-lg overflow-hidden shadow-2xl touch-pan-y select-none"
            onTouchStart={handlePopupTouchStart}
            onTouchMove={handlePopupTouchMove}
            onTouchEnd={handlePopupTouchEnd}
          >
            {POPUP_ADS.map((src, idx) => (
              <Image
                key={src}
                src={src}
                alt={`โฆษณาที่ ${idx + 1}`}
                fill
                priority={idx === 0}
                sizes="288px"
                className={`object-cover transition-opacity duration-500 ${
                  idx === popupIndex ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}

            {POPUP_ADS.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {POPUP_ADS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPopupIndex(idx)}
                    aria-label={`โฆษณาที่ ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === popupIndex ? 'bg-light w-5' : 'bg-light/50 w-1.5'
                    }`}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => setShowAdPopup(false)}
              aria-label="ปิดโฆษณา"
              className="absolute top-2 right-2 bg-primary text-light rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-10"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* <h1 className="text-2xl font-bold text-light font-noto-sans">หมายน้า</h1> */}

        {/* Carousel */}
        <div>
          <ImageCarousel
            images={carouselAds}
            onAdClick={() => window.open(process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL)}
          />
        </div>

        {/* Top Fishermen */}
        {loadingUsers ? (
          <div className="space-y-2">
            <div className="h-6 w-40 rounded bg-dark-gray animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-dark-gray animate-pulse" />
              ))}
            </div>
          </div>
        ) : topUsers.length > 0 ? (
          <div>
            <RankingList
              users={topUsers}
              title="นักตกปลาชั้นนำ"
              showViewMore
              onViewMore={() => {
                // Navigate to full ranking
              }}
            />
          </div>
        ) : null}

        {/* Popular Pins */}
        {loadingPins ? (
          <div className="space-y-3">
            <div className="h-7 w-44 rounded bg-dark-gray animate-pulse" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-72 rounded-lg bg-dark-gray animate-pulse" />
            ))}
          </div>
        ) : popularPins.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold tracking-wide flex items-center gap-2">
                <Flame
                  size={26}
                  className="text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.7)] animate-pulse"
                  fill="currentColor"
                />
                <span className="bg-gradient-to-r from-amber-300 via-orange-500 to-rose-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(251,113,133,0.45)]">
                  หมายยอดฮิต
                </span>
              </h2>
              <Link
                href="/map"
                className="text-accent hover:text-blue-400 text-sm font-medium"
              >
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {popularPins.map((pin, idx) => (
                <PinCard key={pin.id} pin={pin} priority={idx === 0} rank={idx + 1} />
              ))}
            </div>
          </div>
        ) : null}

        {/* Empty state — only after BOTH fetches finished and returned nothing */}
        {!loadingUsers && !loadingPins && !topUsers.length && !popularPins.length && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">ยังไม่มีข้อมูล</p>
            <Link
              href="/map"
              className="inline-block px-6 py-2 bg-primary text-light rounded-lg hover:bg-opacity-80 transition-all"
            >
              ปักหมุดของคุณเองได้ที่นี่
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
