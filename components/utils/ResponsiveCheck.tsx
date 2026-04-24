'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ResponsiveCheckProps {
  children: React.ReactNode;
}

export function ResponsiveCheck({ children }: ResponsiveCheckProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check on mount
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024); // Treat iPad and below as mobile
    };

    checkDevice();
    setIsLoading(false);

    // Listen to resize
    const handleResize = () => {
      checkDevice();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isMobile) {
    return (
      <div className="bg-gradient-to-br from-secondary to-dark-gray text-light min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4 text-primary">หมายน้า</h1>
          <p className="text-xl mb-4">แอปนี้ออกแบบสำหรับอุปกรณ์เคลื่อนที่เท่านั้น</p>
          <p className="text-gray-400">โปรดเข้าใช้บนโทรศัพท์มือถือ หรือแท็บเล็ต</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
