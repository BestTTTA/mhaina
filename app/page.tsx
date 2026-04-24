'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { RankingList } from '@/components/ui/RankingList';
import { PinCard } from '@/components/ui/PinCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { statsService, pinService } from '@/lib/api';
import { UserStats, FishingPin } from '@/lib/types';

// Drop replacement images at these paths (or rename and update here).
const POPUP_ADS = [
  '/ads/popup/ติดต่อลงโฆษณา.png',
  '/ads/popup/ad-1.png',
  '/ads/popup/ad-1.png',
];
const POPUP_INTERVAL_MS = 4000;

export default function HomePage() {
  const [topUsers, setTopUsers] = useState<UserStats[]>([]);
  const [popularPins, setPopularPins] = useState<FishingPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdPopup, setShowAdPopup] = useState(true);
  const [popupIndex, setPopupIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, pins] = await Promise.all([
          statsService.getTopFishermen(10),
          pinService.getPopularPins(10),
        ]);
        setTopUsers(users);
        setPopularPins(pins);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <>
      {/* Ad Popup */}
      {showAdPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-72 aspect-[2/3] bg-dark-gray rounded-lg overflow-hidden shadow-2xl">
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
        <h1 className="text-2xl font-bold text-light font-noto-sans">หมายน้า</h1>

        {/* Carousel */}
        <div>
          <ImageCarousel
            images={carouselAds}
            onAdClick={() => window.open(process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL)}
          />
        </div>

        {/* Top Fishermen */}
        {topUsers.length > 0 && (
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
        )}

        {/* Popular Pins */}
        {popularPins.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-light">หมุดยอดฮิต</h2>
              <Link href="/map" className="text-accent hover:text-blue-400 text-sm">
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {popularPins.map((pin, idx) => (
                <PinCard key={pin.id} pin={pin} priority={idx === 0} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!topUsers.length && !popularPins.length && (
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
