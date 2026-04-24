'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuthStore } from '@/lib/store';

export default function AuthPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-dark-gray flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <h1 className="text-4xl font-bold text-center text-primary mb-2 font-noto-sans">
          หมายน้า
        </h1>
        <p className="text-center text-gray-400 mb-8">
          แอปพลิเคชันสำหรับนักตกปลา
        </p>

        {/* Login Form */}
        <LoginForm />
      </div>
    </div>
  );
}
