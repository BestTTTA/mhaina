import { supabase } from './supabase';
import { FishingPin, FishermanProfile, UserStats, FishingDiary, DiaryTemplate } from './types';
import { convertToWebP } from './image';

// ============ User Profile Services ============
export const userService = {
  async getProfile(userId: string): Promise<FishermanProfile | null> {
    const { data, error } = await supabase
      .from('fisherman_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) console.error('Error fetching profile:', error);
    return data;
  },

  async updateProfile(userId: string, updates: Partial<FishermanProfile>): Promise<FishermanProfile | null> {
    const { data, error } = await supabase
      .from('fisherman_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) console.error('Error updating profile:', error);
    return data;
  },

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const webp = await convertToWebP(file, { maxSize: 512 });
    const fileName = `${userId}-${Date.now()}.${webp.type === 'image/webp' ? 'webp' : webp.name.split('.').pop()}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, webp, { upsert: true, contentType: webp.type });

    if (error) console.error('Error uploading avatar:', error);

    if (data) {
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);
      return urlData.publicUrl;
    }
    return null;
  },

  async createProfile(userId: string, nickname: string): Promise<FishermanProfile | null> {
    const { data, error } = await supabase
      .from('fisherman_profiles')
      .insert([{ user_id: userId, nickname, total_catches: 0 }])
      .select()
      .single();
    
    if (error) console.error('Error creating profile:', error);
    return data;
  },
};

// Attach fisherman_profiles to each pin by user_id.
// fishing_pins and fisherman_profiles both FK to auth.users, so PostgREST cannot
// auto-join them — we do it in one extra round trip.
const attachUserProfiles = async (pins: FishingPin[]): Promise<FishingPin[]> => {
  if (pins.length === 0) return pins;
  const userIds = Array.from(new Set(pins.map((p) => p.user_id)));
  const { data: profiles } = await supabase
    .from('fisherman_profiles')
    .select('*')
    .in('user_id', userIds);
  const byUserId = new Map<string, FishermanProfile>(
    (profiles || []).map((p: FishermanProfile) => [p.user_id, p])
  );
  return pins.map((pin) => ({ ...pin, user: byUserId.get(pin.user_id) }));
};

// ============ Fishing Pin Services ============
export const pinService = {
  async createPin(pin: Omit<FishingPin, 'id' | 'created_at' | 'updated_at'> & { image_url_1: File; image_url_2?: File }): Promise<FishingPin | null> {
    // Upload images first
    const img1Url = await uploadImage(pin.user_id, pin.image_url_1 as any);
    let img2Url = null;
    if (pin.image_url_2) {
      img2Url = await uploadImage(pin.user_id, pin.image_url_2 as any);
    }

    const { data, error } = await supabase
      .from('fishing_pins')
      .insert([
        {
          user_id: pin.user_id,
          latitude: pin.latitude,
          longitude: pin.longitude,
          fish_species: pin.fish_species,
          fish_weight: pin.fish_weight,
          description: pin.description,
          image_url_1: img1Url,
          image_url_2: img2Url,
          likes_count: 0,
        },
      ])
      .select()
      .single();

    if (error) console.error('Error creating pin:', error);
    return data;
  },

  async getNearbyPins(latitude: number, longitude: number, distanceKm: number = 50): Promise<FishingPin[]> {
    const { data, error } = await supabase
      .from('fishing_pins')
      .select('*')
      .limit(100);

    if (error) {
      console.error('Error fetching pins:', error);
      return [];
    }

    const nearby = (data || []).filter((pin: { latitude: number; longitude: number; }) => {
      const dist = calculateDistanceSimple(latitude, longitude, pin.latitude, pin.longitude);
      return dist <= distanceKm;
    });
    return attachUserProfiles(nearby as FishingPin[]);
  },

  async getPinsByFishSpecies(species: string): Promise<FishingPin[]> {
    const { data, error } = await supabase
      .from('fishing_pins')
      .select('*')
      .eq('fish_species', species)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) console.error('Error fetching pins:', error);
    return attachUserProfiles((data || []) as FishingPin[]);
  },

  async getPopularPins(limit: number = 10): Promise<FishingPin[]> {
    const { data, error } = await supabase
      .from('fishing_pins')
      .select('*')
      .order('likes_count', { ascending: false })
      .limit(limit);

    if (error) console.error('Error fetching popular pins:', error);
    return attachUserProfiles((data || []) as FishingPin[]);
  },

  async getPinById(id: string): Promise<FishingPin | null> {
    const { data, error } = await supabase
      .from('fishing_pins')
      .select('*')
      .eq('id', id)
      .single();

    if (error) console.error('Error fetching pin:', error);
    if (!data) return null;
    const [withUser] = await attachUserProfiles([data as FishingPin]);
    return withUser;
  },

  async likePin(pinId: string, userId: string): Promise<boolean> {
    // First check if already liked
    const { data: existingLike } = await supabase
      .from('pin_likes')
      .select('id')
      .eq('pin_id', pinId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      await supabase
        .from('pin_likes')
        .delete()
        .eq('pin_id', pinId)
        .eq('user_id', userId);
      return false;
    } else {
      // Like
      await supabase.from('pin_likes').insert([{ pin_id: pinId, user_id: userId }]);
      return true;
    }
  },

  async getUserPins(userId: string): Promise<FishingPin[]> {
    const { data, error } = await supabase
      .from('fishing_pins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching user pins:', error);
    return attachUserProfiles((data || []) as FishingPin[]);
  },

  async deletePin(pinId: string, userId: string): Promise<boolean> {
    // Grab image URLs first so we can clean up storage after the row is gone.
    const { data: pin } = await supabase
      .from('fishing_pins')
      .select('image_url_1, image_url_2')
      .eq('id', pinId)
      .eq('user_id', userId)
      .maybeSingle();

    const { error } = await supabase
      .from('fishing_pins')
      .delete()
      .eq('id', pinId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting pin:', error);
      return false;
    }

    if (pin) {
      const paths = [pin.image_url_1, pin.image_url_2]
        .map((url) => extractStoragePath(url, 'fishing-images'))
        .filter((p): p is string => !!p);
      if (paths.length) {
        await supabase.storage.from('fishing-images').remove(paths);
      }
    }
    return true;
  },
};

// ============ User Stats Services ============
export const statsService = {
  async getTopFishermen(limit: number = 20): Promise<UserStats[]> {
    const { data, error } = await supabase
      .from('user_stats_view')
      .select('*')
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) console.error('Error fetching top fishermen:', error);
    return data || [];
  },

  async getUserRank(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('user_stats_view')
      .select('rank')
      .eq('user_id', userId)
      .single();

    if (error) console.error('Error fetching user rank:', error);
    return data?.rank || 0;
  },
};

// ============ Fishing Diary Services ============
export const diaryService = {
  async createDiary(diary: Omit<FishingDiary, 'id' | 'created_at' | 'updated_at'>): Promise<FishingDiary | null> {
    const { data, error } = await supabase
      .from('fishing_diaries')
      .insert([diary])
      .select()
      .single();

    if (error) console.error('Error creating diary entry:', error);
    return data;
  },

  async getUserDiaries(userId: string): Promise<FishingDiary[]> {
    const { data, error } = await supabase
      .from('fishing_diaries')
      .select('*, fishing_pins(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching diaries:', error);
    return data || [];
  },

  async saveDiaryAsTemplate(diaryId: string, template: DiaryTemplate): Promise<boolean> {
    const { error } = await supabase
      .from('fishing_diaries')
      .update({ template_data: template })
      .eq('id', diaryId);

    if (error) console.error('Error saving template:', error);
    return !error;
  },
};

// ============ Helper Functions ============
// Turns a Supabase public URL back into the storage key, e.g.
//   https://…/storage/v1/object/public/fishing-images/<userId>/<file>.webp
// becomes <userId>/<file>.webp. Returns null if the URL is not from the bucket.
const extractStoragePath = (url: string | null | undefined, bucket: string): string | null => {
  if (!url) return null;
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
};

const uploadImage = async (userId: string, file: File): Promise<string | null> => {
  const webp = await convertToWebP(file, { maxSize: 1600 });
  const ext = webp.type === 'image/webp' ? 'webp' : webp.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('fishing-images')
    .upload(fileName, webp, { contentType: webp.type });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  if (data) {
    const { data: urlData } = supabase.storage
      .from('fishing-images')
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  return null;
};

const calculateDistanceSimple = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
