'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, User, BookOpen, Home } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'หน้าแรก' },
  { href: '/map', icon: MapPin, label: 'ปักหมุด' },
  { href: '/diary', icon: BookOpen, label: 'สมุดบันทึก' },
  { href: '/profile', icon: User, label: 'โปรไฟล์' },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-dark-gray bg-secondary z-50">
      <div className="flex justify-around items-center h-20 gap-safe-bottom">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-light'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
