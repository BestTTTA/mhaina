// User Types
export interface FishermanProfile {
  id: string;
  user_id: string;
  nickname: string;
  avatar_url: string;
  bio: string;
  total_catches: number;
  created_at: string;
  updated_at: string;
}

// Fishing Pin Types
export interface FishingPin {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  fish_species: string;
  fish_weight: number | null;
  description: string;
  image_url_1: string;
  image_url_2: string | null;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: FishermanProfile;
  is_liked_by_me?: boolean;
}

// Fishing Diary Types
export interface FishingDiary {
  id: string;
  user_id: string;
  pin_id: string;
  title: string;
  description: string;
  images: string[];
  template_data: DiaryTemplate | null;
  created_at: string;
  updated_at: string;
  pin?: FishingPin;
}

export interface DiaryTemplate {
  fishermanAvatar: string;
  fishermanNickname: string;
  catchImages: string[];
  pinLocation: { lat: number; lng: number };
  locationName: string;
  fishSpecies: string;
}

// User Stats
export interface UserStats {
  rank: number;
  total_pins: number;
  total_likes: number;
  fisherman: FishermanProfile;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Auth Types
export type AuthProvider = 'google' | 'line' | 'email';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    nickname?: string;
    avatar_url?: string;
  };
}

// Map Filter Types
export interface MapFilters {
  fishSpecies: string | null;
  distanceKm: number | null;
  sortBy: 'recent' | 'popular' | 'nearest';
}

// Toast Notification
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}
