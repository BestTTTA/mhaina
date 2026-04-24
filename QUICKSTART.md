## 🚀 Quick Start Guide

### 1️⃣ Prerequisites
- Node.js 18+
- npm/yarn
- Supabase account
- Google/LINE OAuth apps (optional)

### 2️⃣ Clone & Setup
```bash
git clone <repo-url>
cd fe-mhaina
npm install
```

### 3️⃣ Environment Setup
```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### 4️⃣ Supabase Setup
1. Create project on supabase.com
2. Run `supabase/schema.sql` in SQL editor
3. Create 2 storage buckets:
   - `avatars` (public)
   - `fishing-images` (public)

### 5️⃣ OAuth Setup (Optional)
- **Google**: Add redirect URI in Google Console
- **LINE**: Add redirect URI in LINE Developers

### 6️⃣ Run Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📱 Key URLs

| Page | URL | Description |
|------|-----|------------|
| Home | / | Main dashboard |
| Map | /map | Fishing map with pins |
| Profile | /profile | User profile |
| Diary | /diary | Fishing diary |
| New Pin | /pin/new | Add fishing pin |
| Pin Details | /pin/[id] | View pin details |
| Login | /auth | Authentication |

---

## 🎮 Testing

### Browser Compatibility
- ✅ Chrome Mobile
- ✅ Safari iOS
- ✅ Firefox Mobile
- ⚠️ Desktop (shows message)

### Test User Flow
1. Go to `/auth`
2. Email signup or OAuth
3. Check `/profile` 
4. Go to `/map`
5. Click add pin button
6. Upload image and submit
7. View in `/diary`

---

## 💡 Tips

- Use mobile device or DevTools mobile view
- Geolocation needs HTTPS or localhost
- Images auto-optimize with Next.js
- Dark theme is default

---

## ❌ Troubleshooting

| Problem | Solution |
|---------|----------|
| Module not found | Run `npm install` |
| Env variables error | Check `.env.local` |
| Map won't load | Check Leaflet CSS |
| Geolocation denied | Use HTTPS or localhost |
| Database error | Verify Supabase config |
| Image upload fails | Check bucket names |

---

## 📞 Support

Contact: Facebook Page (configured in `.env.local`)

Happy fishing! 🎣
