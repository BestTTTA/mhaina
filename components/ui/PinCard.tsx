'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ExternalLink, Trash2 } from 'lucide-react';
import { FishingPin } from '@/lib/types';
import { formatDateThai, formatNumber } from '@/lib/utils';

interface PinCardProps {
  pin: FishingPin;
  onLike?: (pinId: string) => void;
  isLiked?: boolean;
  onDelete?: (pinId: string) => void;
  deleting?: boolean;
  priority?: boolean;
}

export function PinCard({ pin, onLike, isLiked = false, onDelete, deleting = false, priority = false }: PinCardProps) {
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
          <p className="text-primary font-bold text-lg">{pin.fish_species}</p>
          {pin.fish_weight && (
            <p className="text-gray-400 text-sm">{pin.fish_weight} กก.</p>
          )}
          {pin.description && (
            <p className="text-light text-sm mt-2 line-clamp-2">{pin.description}</p>
          )}
        </div>

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
