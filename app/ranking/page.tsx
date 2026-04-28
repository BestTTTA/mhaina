'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Trophy } from 'lucide-react';
import { statsService } from '@/lib/api';
import { UserStats } from '@/lib/types';
import { getRankNameClasses, getRankMedal, isTopRank } from '@/components/ui/rankStyles';
import { formatNumber } from '@/lib/utils';

const FETCH_TIMEOUT_MS = 12000;
const RANKING_LIMIT = 100;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export default function RankingPage() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    withTimeout(statsService.getTopFishermen(RANKING_LIMIT), FETCH_TIMEOUT_MS, 'getTopFishermen')
      .then((data) => {
        if (cancelled) return;
        setUsers(data);
      })
      .catch((err) => {
        console.warn('[RankingPage] fetch failed:', err);
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="กลับหน้าแรก"
          className="text-primary hover:text-opacity-80 p-1 -ml-1"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-2xl font-bold text-light font-noto-sans flex items-center gap-2">
          <Trophy className="text-primary" size={26} />
          นักตกปลาชั้นนำ
        </h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-dark-gray animate-pulse" />
          ))}
        </div>
      ) : failed ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-red-400">
            ดึงข้อมูลไม่สำเร็จ — เครือข่ายช้าหรือเซิร์ฟเวอร์ไม่ตอบสนอง
          </p>
          <button
            type="button"
            onClick={() => setRetryToken((n) => n + 1)}
            className="px-6 py-2 bg-primary text-light rounded-lg hover:bg-opacity-80 transition-all"
          >
            ลองใหม่
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">ยังไม่มีข้อมูลอันดับ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u, idx) => {
            const rank = idx + 1;
            const top = isTopRank(rank);
            const medal = getRankMedal(rank);
            const nameClass = top ? getRankNameClasses(rank) : 'text-light font-medium';
            return (
              <div
                key={u.fisherman?.user_id ?? rank}
                className="flex items-center gap-3 bg-dark-gray p-3 rounded-lg"
              >
                <div
                  className={`w-8 text-center font-extrabold text-lg flex-shrink-0 ${
                    top ? getRankNameClasses(rank) : 'text-primary'
                  }`}
                >
                  {medal ?? rank}
                </div>

                {u.fisherman?.avatar_url ? (
                  <Image
                    src={u.fisherman.avatar_url}
                    alt={u.fisherman.nickname}
                    width={44}
                    height={44}
                    className={`rounded-full w-11 h-11 object-cover flex-shrink-0 ${
                      rank === 1
                        ? 'ring-2 ring-amber-400'
                        : rank === 2
                        ? 'ring-2 ring-zinc-300'
                        : rank === 3
                        ? 'ring-2 ring-orange-400'
                        : ''
                    }`}
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-gray-400 flex-shrink-0">
                    👤
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className={`truncate ${nameClass}`}>
                    {u.fisherman?.nickname ?? 'ไม่ระบุชื่อ'}
                  </p>
                  <p className="text-gray-400 text-xs">{u.total_pins} หมุด</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-primary font-bold">
                    {formatNumber(u.total_likes)}
                  </p>
                  <p className="text-gray-400 text-xs">ถูกใจ</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
