'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { pinService } from '@/lib/api';
import { FishingPin } from '@/lib/types';
import { Heart, MapPin, ArrowLeft, Trash2, Navigation } from 'lucide-react';
import Link from 'next/link';
import { formatDateThai, formatNumber } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/lib/toast';

export default function PinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const [pin, setPin] = useState<FishingPin | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchPin = async () => {
      try {
        const data = await pinService.getPinById(id);
        if (cancelled) return;
        if (!data) {
          setPin(null);
          return;
        }

        // Authoritative like count from pin_likes — avoids the stale
        // fishing_pins.likes_count when the DB trigger hasn't been installed.
        const [count, liked] = await Promise.all([
          pinService.getPinLikeCount(data.id),
          user ? pinService.hasUserLikedPin(data.id, user.id) : Promise.resolve(false),
        ]);
        if (cancelled) return;
        setPin({ ...data, likes_count: count });
        setIsLiked(liked);
      } catch (error) {
        console.error('Error fetching pin:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPin();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  const handleLike = async () => {
    if (!pin || !user || liking) return;
    setLiking(true);
    try {
      const { liked, count } = await pinService.likePin(pin.id, user.id);
      setIsLiked(liked);
      setPin({ ...pin, likes_count: count });
    } catch (error: any) {
      console.error('Error liking pin:', error);
      toast('error', error?.message || 'ทำรายการไม่สำเร็จ');
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!pin || !user || pin.user_id !== user.id) return;
    if (!window.confirm('ลบหมุดนี้ถาวร? รูปภาพและยอดไลก์จะถูกลบทั้งหมด')) return;

    setDeleting(true);
    try {
      const ok = await pinService.deletePin(pin.id, user.id);
      if (ok) {
        router.push('/diary');
      } else {
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting pin:', error);
      setDeleting(false);
    }
  };

  const isOwner = !!user && !!pin && pin.user_id === user.id;

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!pin) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400 mb-4">ไม่พบข้อมูล</p>
        <Link href="/map" className="text-primary hover:underline">
          กลับไปแผนที่
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-secondary border-b border-dark-gray z-40 flex items-center gap-4 p-4">
        <Link href="/map" className="text-primary hover:text-opacity-80">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-light flex-1">รายละเอียด</h1>
        {isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="ลบหมุด"
            className="flex items-center gap-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600 rounded-lg text-sm disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleting ? 'กำลังลบ...' : 'ลบ'}
          </button>
        )}
      </div>

      {/* Images */}
      {pin.image_url_1 && (
        <div className="relative w-full h-64">
          <Image
            src={pin.image_url_1}
            alt={pin.fish_species}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* User Info */}
        {pin.user && (
          <div className="flex items-center gap-3">
            {pin.user.avatar_url && (
              <Image
                src={pin.user.avatar_url}
                alt={pin.user.nickname}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            )}
            <div>
              <p className="text-light font-medium">{pin.user.nickname}</p>
              <p className="text-gray-400 text-sm">{formatDateThai(pin.created_at)}</p>
            </div>
          </div>
        )}

        {/* Fish Info */}
        <div className="bg-dark-gray rounded-lg p-4 space-y-3">
          <div>
            <p className="text-gray-400 text-sm mb-1">ชนิดปลา</p>
            <p className="text-xl font-bold text-primary">{pin.fish_species}</p>
          </div>

          {pin.fish_weight && (
            <div>
              <p className="text-gray-400 text-sm mb-1">น้ำหนัก</p>
              <p className="text-light font-medium">{pin.fish_weight} กก.</p>
            </div>
          )}

          {pin.description && (
            <div>
              <p className="text-gray-400 text-sm mb-1">คำบรรยาย</p>
              <p className="text-light">{pin.description}</p>
            </div>
          )}
        </div>

        {/* Location + navigate */}
        <div className="bg-dark-gray rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <MapPin className="text-primary flex-shrink-0" size={24} />
            <div className="min-w-0">
              <p className="text-gray-400 text-sm">ตำแหน่ง</p>
              <p className="text-light truncate">
                {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
              </p>
            </div>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${pin.latitude},${pin.longitude}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Navigation size={20} />
            ไปตามหมาย
          </a>
        </div>

        {/* Second Image */}
        {pin.image_url_2 && (
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <Image
              src={pin.image_url_2}
              alt="Second photo"
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={!user || liking}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium disabled:opacity-60 ${
            isLiked
              ? 'bg-primary text-light'
              : 'bg-dark-gray text-gray-400 hover:text-primary'
          }`}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          ถูกใจ ({formatNumber(Math.max(0, pin.likes_count))})
        </button>

        {!user && (
          <div className="bg-accent/20 border border-accent text-accent px-4 py-2 rounded-lg text-sm text-center">
            <Link href="/auth" className="hover:underline">
              เข้าสู่ระบบเพื่อถูกใจ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
