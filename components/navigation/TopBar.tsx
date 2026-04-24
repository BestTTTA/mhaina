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
        className="font-noto-sans font-bold text-light text-lg hover:opacity-80 transition-opacity"
      >
        หมายน้า
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
