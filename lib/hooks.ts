'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/lib/store';

/**
 * Hook to check if user is authenticated
 */
export function useAuth() {
  const { user, profile, isAuthenticated, logout } = useAuthStore();
  
  return {
    user,
    profile,
    isAuthenticated,
    logout,
  };
}

/**
 * Hook to handle auth-required actions
 */
export function useAuthRequired() {
  const { isAuthenticated } = useAuthStore();
  const router =require('next/router').useRouter();

  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return false;
    }
    return true;
  }, [isAuthenticated, router]);

  return { requireAuth, isAuthenticated };
}

/**
 * Hook to handle fish species selection
 */
export function useFishSpecies() {
  const species = [
    'ปลาช่อน',
    'ปลาตัวเบ็ญ',
    'ปลาหมอ',
    'ปลากระพง',
    'ปลากะพง',
    'ปลาชะโอด',
    'ปลาแซลมอน',
    'ปลาทอง',
    'ปลาเบญจพรรณ',
    'ปลาสมอ',
    'ปลากัง',
    'ปลาแบน',
    'ปลากระเบน',
    'ปลาดุก',
    'ปลาลีลา',
    'ปลาส้อม',
    'ปลาเม็ด',
    'ปลาหนวด',
    'ปลาเขียด',
    'ปลาชอด',
  ];

  return species;
}
