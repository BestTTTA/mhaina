'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { userService } from '@/lib/api';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // Check if profile exists
          const profile = await userService.getProfile(session.user.id);

          if (!profile) {
            // Create new profile
            const nickname = session.user.user_metadata?.name ||
              session.user.email?.split('@')[0] ||
              'Fisherman';
            await userService.createProfile(session.user.id, nickname);
          }

          // Redirect to home
          router.push('/');
        } else {
          // No session, redirect to login
          router.push('/auth');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/auth');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-light">กำลังเข้าสู่ระบบ...</p>
    </div>
  );
}
