-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Fisherman Profiles Table
CREATE TABLE public.fisherman_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  nickname VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  total_catches INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  phone VARCHAR(20),
  email VARCHAR(255)
);

-- Create index for user_id
CREATE INDEX idx_fisherman_profiles_user_id ON public.fisherman_profiles(user_id);

-- Fishing Pins Table (Main Table for Catch Locations)
CREATE TABLE public.fishing_pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  fish_species VARCHAR(255) NOT NULL,
  fish_weight DECIMAL(5, 2),
  description TEXT,
  image_url_1 TEXT NOT NULL,
  image_url_2 TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for fishing_pins
CREATE INDEX idx_fishing_pins_user_id ON public.fishing_pins(user_id);
CREATE INDEX idx_fishing_pins_fish_species ON public.fishing_pins(fish_species);
CREATE INDEX idx_fishing_pins_created_at ON public.fishing_pins(created_at DESC);
CREATE INDEX idx_fishing_pins_likes_count ON public.fishing_pins(likes_count DESC);

-- Pin Likes Table
CREATE TABLE public.pin_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_id UUID NOT NULL REFERENCES public.fishing_pins (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(pin_id, user_id)
);

-- Indexes for pin_likes
CREATE INDEX idx_pin_likes_pin_id ON public.pin_likes(pin_id);
CREATE INDEX idx_pin_likes_user_id ON public.pin_likes(user_id);

-- Fishing Diaries Table
CREATE TABLE public.fishing_diaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  pin_id UUID REFERENCES public.fishing_pins (id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  images JSONB, -- Array of image URLs
  template_data JSONB, -- Template configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for fishing_diaries
CREATE INDEX idx_fishing_diaries_user_id ON public.fishing_diaries(user_id);
CREATE INDEX idx_fishing_diaries_pin_id ON public.fishing_diaries(pin_id);
CREATE INDEX idx_fishing_diaries_created_at ON public.fishing_diaries(created_at DESC);

-- User Stats View (for leaderboard)
CREATE OR REPLACE VIEW public.user_stats_view AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY COUNT(fp.id) DESC) as rank,
  p.user_id,
  p.id as profile_id,
  p.nickname,
  p.avatar_url,
  COUNT(fp.id) as total_pins,
  COALESCE(SUM(fp.likes_count), 0) as total_likes,
  json_build_object(
    'id', p.id,
    'user_id', p.user_id,
    'nickname', p.nickname,
    'avatar_url', p.avatar_url,
    'bio', p.bio,
    'total_catches', p.total_catches,
    'created_at', p.created_at,
    'updated_at', p.updated_at
  ) as fisherman
FROM public.fisherman_profiles p
LEFT JOIN public.fishing_pins fp ON p.user_id = fp.user_id
GROUP BY p.id, p.user_id, p.nickname, p.avatar_url, p.bio, p.total_catches, p.created_at, p.updated_at;

-- Enable Row Level Security
ALTER TABLE public.fisherman_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fishing_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fishing_diaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fisherman_profiles
CREATE POLICY "Users can read all profiles" ON public.fisherman_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.fisherman_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.fisherman_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for fishing_pins
CREATE POLICY "Users can read all pins" ON public.fishing_pins FOR SELECT USING (true);
CREATE POLICY "Users can insert their own pins" ON public.fishing_pins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pins" ON public.fishing_pins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pins" ON public.fishing_pins FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pin_likes
CREATE POLICY "Users can read all likes" ON public.pin_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON public.pin_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.pin_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for fishing_diaries
CREATE POLICY "Users can read their own diaries" ON public.fishing_diaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own diaries" ON public.fishing_diaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own diaries" ON public.fishing_diaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own diaries" ON public.fishing_diaries FOR DELETE USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public) VALUES
('avatars', 'avatars', true),
('fishing-images', 'fishing-images', true);

ต้องการให้สามารถกดถูกใจหมายที่หน้า ปักหมุดตรงส่วนแสดงข้อมูลของหมุดได้ด้วย