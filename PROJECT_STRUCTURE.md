# หมายน้า - โครงสร้างโปรเจค

## 📋 Overview

นี่คือแอปพลิเคชันสำหรับนักตกปลาที่สร้างบน Next.js 16.2 และ Supabase

## 🗂️ โครงสร้างโฟลเดอร์

### `/app` - Next.js App Router
```
app/
├── layout.tsx              # Root layout with providers
├── globals.css             # Global styles
├── page.tsx                # Home page
├── auth/
│   ├── page.tsx           # Login page
│   └── callback/
│       └── page.tsx       # OAuth callback
├── map/
│   └── page.tsx           # Fishing map with pins
├── profile/
│   └── page.tsx           # User profile
├── diary/
│   └── page.tsx           # Fishing diary entries
└── pin/
    ├── new/
    │   └── page.tsx       # Create new pin
    └── [id]/
        └── page.tsx       # Pin detail view
```

### `/components` - Reusable Components
```
components/
├── navigation/
│   └── BottomNavigation.tsx    # Bottom tab bar
├── ui/
│   ├── ImageCarousel.tsx       # Ad carousel
│   ├── RankingList.tsx         # Ranking display
│   ├── PinCard.tsx             # Fish catch card
│   └── Button.tsx              # Reusable button
├── auth/
│   └── LoginForm.tsx           # Login/signup form
├── providers/
│   └── SupabaseProvider.tsx    # Auth provider
└── utils/
    └── ResponsiveCheck.tsx     # Device check
```

### `/lib` - Logic & Configuration
```
lib/
├── types.ts        # TypeScript interfaces
├── supabase.ts     # Supabase client setup
├── api.ts          # API functions (CRUD operations)
├── store.ts        # Zustand auth store
└── utils.ts        # Helper functions
```

### `/public` - Static Assets
```
public/
└── (Images and static files)
```

### `/supabase` - Database Schema
```
supabase/
└── schema.sql      # PostgreSQL schema
```

## 🔌 API Functions (`lib/api.ts`)

### User Service
```typescript
userService.getProfile(userId)           // Get user profile
userService.updateProfile(userId, data)  // Update profile
userService.uploadAvatar(userId, file)   // Upload avatar
userService.createProfile(userId, name)  // Create new profile
```

### Pin Service
```typescript
pinService.createPin(pinData)              // Create new fishing pin
pinService.getNearbyPins(lat, lng, km)     // Get pins within distance
pinService.getPinsByFishSpecies(species)   // Filter by fish type
pinService.getPopularPins(limit)           // Get most liked pins
pinService.getPinById(id)                  // Get single pin
pinService.likePin(pinId, userId)          // Toggle like
pinService.getUserPins(userId)             // Get user's pins
```

### Stats Service
```typescript
statsService.getTopFishermen(limit)        // Leaderboard
statsService.getUserRank(userId)           // User's rank
```

### Diary Service
```typescript
diaryService.createDiary(diaryData)        // Create diary entry
diaryService.getUserDiaries(userId)        // Get user's diary
diaryService.saveDiaryAsTemplate(id, data) // Save as template
```

## 📊 Database Schema

### Tables

#### `fisherman_profiles`
```sql
id, user_id (FK), nickname, avatar_url, bio, 
total_catches, created_at, updated_at, phone, email
```

#### `fishing_pins`
```sql
id, user_id (FK), latitude, longitude, fish_species,
fish_weight, description, image_url_1, image_url_2,
likes_count, created_at, updated_at
```

#### `pin_likes`
```sql
id, pin_id (FK), user_id (FK), created_at
```

#### `fishing_diaries`
```sql
id, user_id (FK), pin_id (FK), title, description,
images (JSON), template_data (JSON), created_at, updated_at
```

### Views

#### `user_stats_view`
Aggregates rankings and likes for leaderboard

## 🎨 Components Detail

### BottomNavigation
- Fixed bottom navigation
- Home, Map, Diary, Profile tabs
- Active state highlighting
- Safe area support

### ImageCarousel
- Auto-rotating carousel (5s intervals)
- Dot indicators
- Previous/Next buttons
- Facebook ad link
- Lazy loading

### RankingList
- Trophy icon
- User avatar + nickname
- Pin count + likes
- "View More" button option
- Responsive grid

### PinCard
- Fish image
- User info (avatar, name, date)
- Fish species + weight
- Description (truncated)
- Like counter
- Link to details

### LoginForm
- Google OAuth button
- LINE OAuth button
- Email/password form
- Sign up toggle
- Error messages
- Loading states

## 🔐 Authentication Flow

1. User clicks auth provider button
2. Redirected to Supabase auth page
3. OAuth provider confirms identity
4. Redirected to `/auth/callback`
5. Callback creates profile if needed
6. Redirected to home page

## 🗺️ Map Implementation

- Leaflet.js library
- OpenStreetMap tiles
- User's current location marker
- Fish catch pins
- Popup on marker click
- Zoom controls

## 📱 Responsive Design

### Breakpoints
- Mobile: < 768px ✅ Supported
- Tablet: 768px - 1024px ✅ Supported
- Desktop: > 1024px ⚠️ Not supported (shows message)

## 🎯 Features Implementation

### Home Page
1. Carousel with 5 ad images
2. Ad banner (6th slide)
3. Vertical popup on first visit
4. Top 10 fishermen ranking
5. Top 10 popular pins

### Map Page
1. Leaflet map
2. User location marker
3. Fish catch pins
4. Filter by species dropdown
5. Filter by distance dropdown
6. Add new pin button
7. Locate button

### New Pin Page
1. Display current location
2. Fish species selector
3. Weight input
4. Description textarea
5. Camera capture
6. Image upload
7. Image preview
8. Remove image option

### Profile Page
1. Avatar with upload button
2. Edit mode toggle
3. Nickname edit
4. Bio edit
5. Stats display
6. Logout button

### Diary Page
1. List all diary entries
2. Thumbnail images
3. Entry date
4. Share button
5. Save as template button
6. Delete button
7. Empty state

## 🔧 Customization

### Colors
Edit in `tailwind.config.ts`:
```typescript
colors: {
  primary: '#FF4444',     // Red
  secondary: '#1E1E1E',   // Dark Gray
  accent: '#0066FF',      // Blue
  dark: '#0D0D0D',        // Black
  light: '#FFFFFF',       // White
}
```

### Fonts
Edit in Google Fonts link:
- `Noto Sans Thai` - Headers
- `IBM Plex Sans Thai` - Body text

### Fish Species
Edit in `lib/utils.ts`:
```typescript
export const FISH_SPECIES = [
  'ปลาช่อน', 'ปลาตัวเบ็ญ', ...
]
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Self-hosted
```bash
npm run build
npm start
```

## 📈 Performance

- Image optimization with Next.js Image
- Lazy loading
- Code splitting
- Client-side state management
- Indexed database queries

## 🔒 Security

- Row-level security (RLS) on all tables
- JWT-based authentication
- HTTPS required for geolocation
- Secure image storage
- Input validation

## 🐛 Common Issues & Solutions

### Map not showing
- Check Leaflet CSS import
- Verify leaflet npm package

### Geolocation denied
- Use localhost or HTTPS
- Allow location in browser

### Supabase error
- Check `.env.local`
- Verify Project URL and Key
- Check RLS policies

### Images not uploading
- Check bucket names
- Verify permissions
- Check file size limits

## 📚 Additional Resources

- [Next.js Docs](https://nextjs.org)
- [Supabase Docs](https://supabase.com/docs)
- [Leaflet Docs](https://leafletjs.com)
- [Tailwind Docs](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
