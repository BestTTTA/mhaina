'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface CarouselProps {
  images: string[];
  onAdClick?: () => void;
}

export function ImageCarousel({ images, onAdClick }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (images.length + 1)); // +1 for ad
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  const isAdSlide = currentIndex === images.length;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length + 1) % (images.length + 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % (images.length + 1));
  };

  return (
    <div className="relative w-full bg-dark-gray rounded-lg overflow-hidden aspect-[16/10]">
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
          className="flex items-center justify-center h-full bg-red-600 hover:bg-red-700 transition-colors"
          onClick={onAdClick}
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-light mb-2">ติดตามเราได้ที่นี่</p>
            <p className="text-light">ที่ Facebook Page ของเรา</p>
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
            className={`h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-primary w-6' : 'bg-gray-400 w-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
