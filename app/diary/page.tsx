'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { pinService, statsService } from '@/lib/api';
import { FishingPin } from '@/lib/types';
import { PinCard } from '@/components/ui/PinCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DiaryPage() {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);
  const [pins, setPins] = useState<FishingPin[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const handleDelete = async (pinId: string) => {
    if (!user) return;
    if (!window.confirm('ลบหมุดนี้ถาวร? รูปภาพและยอดไลก์จะถูกลบทั้งหมด')) return;

    setDeletingId(pinId);
    try {
      const ok = await pinService.deletePin(pinId, user.id);
      if (ok) setPins((prev) => prev.filter((p) => p.id !== pinId));
    } catch (error) {
      console.error('Error deleting pin:', error);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFetchFailed(false);

    // Safety net: getUserPins triggers two awaited Supabase round-trips
    // (pins + profiles). If either hangs, release the spinner and surface
    // a retry path instead of leaving the page stuck.
    const safetyTimer = setTimeout(() => {
      if (cancelled) return;
      console.warn('[DiaryPage] getUserPins exceeded 8s — showing retry');
      setFetchFailed(true);
      setLoading(false);
    }, 8000);

    (async () => {
      try {
        // Rank fetch is best-effort: it must never block the diary list.
        const [data, rank] = await Promise.all([
          pinService.getUserPins(user.id),
          statsService.getUserRank(user.id).catch(() => 0),
        ]);
        if (!cancelled) {
          setPins(data);
          setUserRank(rank > 0 ? rank : null);
        }
      } catch (error) {
        console.error('Error fetching user pins:', error);
        if (!cancelled) setFetchFailed(true);
      } finally {
        if (!cancelled) {
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
    };
  }, [user?.id, authLoading, retryToken]);

  if (authLoading || loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-400 mb-4">กรุณาเข้าสู่ระบบ</p>
          <Link href="/" className="text-primary hover:underline">
            กลับไปหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold text-light font-noto-sans">สมุดบันทึก</h1>
        <p className="text-gray-400 text-sm">{pins.length} หมุด</p>
      </div>

      {fetchFailed ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-red-400">ดึงข้อมูลไม่สำเร็จ — เครือข่ายช้าหรือเซิร์ฟเวอร์ไม่ตอบสนอง</p>
          <button
            type="button"
            onClick={() => setRetryToken((n) => n + 1)}
            className="px-6 py-2 bg-primary text-light rounded-lg hover:bg-opacity-80 transition-all"
          >
            ลองใหม่
          </button>
        </div>
      ) : pins.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pins.map((pin) => (
            <PinCard
              key={pin.id}
              pin={pin}
              onDelete={handleDelete}
              deleting={deletingId === pin.id}
              shareInfo={{ userRank }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">ยังไม่มีหมุดที่ปักไว้</p>
          <Link
            href="/pin/new"
            className="inline-block px-6 py-2 bg-primary text-light rounded-lg hover:bg-opacity-80 transition-all"
          >
            ปักหมุดแรก
          </Link>
        </div>
      )}
    </div>
  );
}
