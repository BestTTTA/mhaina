'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ExternalLink, Trash2, Share2, Download } from 'lucide-react';
import { FishingPin } from '@/lib/types';
import { formatDateThai, formatNumber } from '@/lib/utils';
import { getRankNameClasses, getRankMedal, isTopRank } from './rankStyles';
import {
  generateShareImage,
  shareOrDownload,
  downloadBlob,
  buildShareFilename,
} from '@/lib/shareImage';
import { useToast } from '@/lib/toast';

interface PinCardProps {
  pin: FishingPin;
  onLike?: (pinId: string) => void;
  isLiked?: boolean;
  onDelete?: (pinId: string) => void;
  deleting?: boolean;
  priority?: boolean;
  /** Rank within a leaderboard (1-based). 1–5 get colorful styling. */
  rank?: number;
  /** When set, shows Share + Download buttons. `userRank` is rendered onto
   *  the generated share image. */
  shareInfo?: { userRank?: number | null };
}

export function PinCard({
  pin,
  onLike,
  isLiked = false,
  onDelete,
  deleting = false,
  priority = false,
  rank,
  shareInfo,
}: PinCardProps) {
  const top = !!rank && isTopRank(rank);
  const speciesClass = top
    ? `${getRankNameClasses(rank!)} text-lg`
    : 'text-primary font-bold text-lg';
  const medal = rank ? getRankMedal(rank) : null;

  const toast = useToast();
  const [busy, setBusy] = useState<null | 'share' | 'download'>(null);

  const buildBlob = async () => {
    if (!pin.user) {
      throw new Error('ข้อมูลโปรไฟล์ไม่ครบ — ลองรีเฟรชหน้านี้');
    }
    return await generateShareImage({
      pin,
      profile: { nickname: pin.user.nickname, avatar_url: pin.user.avatar_url },
      rank: shareInfo?.userRank ?? null,
    });
  };

  const handleShare = async () => {
    if (busy) return;
    setBusy('share');
    try {
      const blob = await buildBlob();
      const filename = buildShareFilename(pin);
      const result = await shareOrDownload(blob, filename, {
        title: 'หมายน้า — ปักหมุดตกปลา',
        text: `${pin.user?.nickname ?? 'นักตกปลา'} ตกปลา ${pin.fish_species}${
          pin.fish_weight ? ` ${pin.fish_weight} กก.` : ''
        }`,
      });
      if (result === 'downloaded') {
        toast('info', 'บราวเซอร์ไม่รองรับการแชร์ — บันทึกรูปลงเครื่องแทน');
      } else if (result === 'shared') {
        toast('success', 'แชร์สำเร็จ');
      }
    } catch (err: any) {
      console.error('[PinCard] share failed:', err);
      toast('error', err?.message || 'แชร์ไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async () => {
    if (busy) return;
    setBusy('download');
    try {
      const blob = await buildBlob();
      downloadBlob(blob, buildShareFilename(pin));
      toast('success', 'บันทึกรูปแล้ว');
    } catch (err: any) {
      console.error('[PinCard] download failed:', err);
      toast('error', err?.message || 'บันทึกรูปไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-dark-gray rounded-lg overflow-hidden hover:shadow-lg transition-all">
      {/* Image */}
      {pin.image_url_1 && (
        <div className="relative h-40 w-full">
          <Image
            src={pin.image_url_1}
            alt={pin.fish_species}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* User Info */}
        {pin.user && (
          <div className="flex items-center gap-2 mb-3">
            {pin.user.avatar_url && (
              <Image
                src={pin.user.avatar_url}
                alt={pin.user.nickname}
                width={32}
                height={32}
                className="rounded-full w-8 h-8 object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-light font-medium text-sm truncate">{pin.user.nickname}</p>
              <p className="text-gray-400 text-xs">{formatDateThai(pin.created_at)}</p>
            </div>
          </div>
        )}

        {/* Fish Info */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            {medal && <span className="text-xl leading-none">{medal}</span>}
            {top && !medal && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                  rank === 4 ? 'border-sky-400/60 text-sky-300' : 'border-fuchsia-400/60 text-fuchsia-300'
                }`}
              >
                อันดับ {rank}
              </span>
            )}
            <p className={speciesClass}>{pin.fish_species}</p>
          </div>
          {pin.fish_weight && (
            <p className="text-gray-400 text-sm mt-1">{pin.fish_weight} กก.</p>
          )}
          {pin.description && (
            <p className="text-light text-sm mt-2 line-clamp-2">{pin.description}</p>
          )}
        </div>

        {/* Share + Download — only when this is the user's own diary view */}
        {shareInfo && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={handleShare}
              disabled={!!busy}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary hover:bg-opacity-80 text-light text-sm font-medium transition-all disabled:opacity-60"
            >
              <Share2 size={16} />
              {busy === 'share' ? 'กำลังเตรียม...' : 'แชร์'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!!busy}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary border border-dark-gray hover:border-primary text-light text-sm font-medium transition-all disabled:opacity-60"
            >
              <Download size={16} />
              {busy === 'download' ? 'กำลังเตรียม...' : 'บันทึกรูป'}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-secondary">
          <button
            onClick={() => onLike?.(pin.id)}
            className={`flex items-center gap-1 transition-all ${
              isLiked ? 'text-primary' : 'text-gray-400 hover:text-primary'
            }`}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-sm">{formatNumber(pin.likes_count)}</span>
          </button>

          <div className="flex items-center gap-3">
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(pin.id)}
                disabled={deleting}
                aria-label="ลบหมุด"
                className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                <Trash2 size={16} />
                <span className="text-sm">{deleting ? 'กำลังลบ...' : 'ลบ'}</span>
              </button>
            )}
            <Link
              href={`/pin/${pin.id}`}
              className="flex items-center gap-1 text-accent hover:text-blue-400 transition-colors"
            >
              <span className="text-sm">ดูรายละเอียด</span>
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
