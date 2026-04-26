'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface CarouselProps {
  images: string[];
  onAdClick?: () => void;
}

const SWIPE_THRESHOLD_PX = 40;

export function ImageCarousel({ images, onAdClick }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = images.length + 1;
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const swipedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  const isAdSlide = currentIndex === images.length;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    swipedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
      swipedRef.current = true;
      if (deltaX < 0) goToNext();
      else goToPrevious();
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const handleAdClickGuarded = (e: React.MouseEvent) => {
    if (swipedRef.current) {
      e.preventDefault();
      swipedRef.current = false;
      return;
    }
    onAdClick?.();
  };

  return (
    <div
      className="relative w-full bg-dark-gray rounded-lg overflow-hidden aspect-[16/10] touch-pan-y select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {!isAdSlide ? (
        <Image
          src={images[currentIndex]}
          alt={`Carousel slide ${currentIndex + 1}`}
          fill
          priority={currentIndex === 0}
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />
      ) : (
        <Link
          href={process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL || '#'}
          target="_blank"
          className="relative flex items-center justify-center h-full overflow-hidden group"
          onClick={handleAdClickGuarded}
        >
          <Image
            src="/og-image.jpg"
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Dark overlay so text stays readable on any image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

          <div className="relative text-center px-6">
            <p className="text-2xl font-bold text-light mb-2 drop-shadow-lg">ติดตามเราได้ที่นี่</p>
            <p className="text-light/90 mb-4 drop-shadow">ที่ หมายน้า.com</p>

            <span className="inline-block px-6 py-2 bg-white text-red-600 font-semibold rounded-full shadow hover:bg-gray-100 transition">
              เยี่ยมชมเพจ
            </span>
          </div>
        </Link>
      )}

      {/* Navigation buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {Array.from({ length: images.length + 1 }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${index === currentIndex ? 'bg-primary w-6' : 'bg-gray-400 w-2'
              }`}
          />
        ))}
      </div>
    </div>
  );
}
