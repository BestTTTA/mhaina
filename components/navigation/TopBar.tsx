'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export function TopBar() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-secondary border-b border-dark-gray z-50 flex items-center justify-between px-4">
      <Link
        href="/"
        aria-label="หมายน้า — กลับหน้าหลัก"
        className="flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <span className="relative w-9 h-9 rounded-xl overflow-hidden ring-1 ring-primary/40 shadow-[0_0_14px_rgba(255,68,68,0.45)]">
          <Image
            src="/android-chrome-192x192.png"
            alt=""
            fill
            sizes="36px"
            className="object-cover"
            priority
          />
        </span>
        <span className="font-noto-sans font-extrabold text-xl tracking-wide bg-gradient-to-r from-primary via-amber-400 to-accent bg-clip-text text-transparent drop-shadow-[0_1px_8px_rgba(255,68,68,0.35)]">
          หมายน้า
        </span>
      </Link>

      {user ? (
        <Link
          href="/profile"
          aria-label="ไปหน้าโปรไฟล์"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-light text-sm font-medium max-w-[140px] truncate">
            {profile?.nickname || 'นักตกปลา'}
          </span>
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex-shrink-0 border border-dark-gray">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.nickname}
                fill
                sizes="32px"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-base">👤</span>
            )}
          </div>
        </Link>
      ) : (
        <Link
          href="/auth"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-opacity-80 text-light rounded-lg text-sm font-medium transition-all"
        >
          <LogIn size={16} />
          เข้าสู่ระบบ
        </Link>
      )}
    </header>
  );
}
