# หมายน้า - Fishing Tracker App

แอปพลิเคชันสำหรับนักตกปลาที่ช่วยให้คุณสามารถ:
- 🗺️ ปักหมุดตำแหน่งการตกปลา
- 📸 อัพโหลดรูปภาพผลงาน
- 🏆 ติดตามอันดับนักตกปลา
- 📱 บันทึกประวัติการตกปลา
- ❤️ ถูกใจและแชร์ผลงาน

## ⚡ เทคโนโลยี

- **Framework**: Next.js 16.2 with React 19
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth (Google, LINE, Email)
- **Map**: Leaflet + React-Leaflet
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Typography**: Noto Sans Thai, IBM Plex Sans Thai

## 🚀 การติดตั้ง

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd fe-mhaina
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables

สร้างไฟล์ `.env.local` (ใช้ `.env.local.example` เป็นแม่แบบ):

```bash
cp .env.local.example .env.local
```

จากนั้นแก้ไขค่าต่อไปนี้:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OAuth Providers
NEXT_PUBLIC_LINE_CHANNEL_ID=your_line_channel_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Facebook Page
NEXT_PUBLIC_FACEBOOK_PAGE_URL=https://www.facebook.com/your_page

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup Supabase Database

1. สร้าง Project ใน [Supabase](https://supabase.com)
2. ไปที่ SQL Editor และรัน script จาก `supabase/schema.sql`
3. สร้าง 2 Storage buckets:
   - `avatars` (Public)
   - `fishing-images` (Public)

### 5. Setup Authentication

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. สร้าง OAuth 2.0 Credentials
3. เพิ่ม Redirect URI: `https://your-supabase-url/auth/v1/callback?provider=google`
4. Copy Client ID ไปใน `.env.local`

#### LINE Login
1. Go to [LINE Developers](https://developers.line.biz)
2. สร้าง Login Channel
3. ตั้งค่า Redirect URI ใน Supabase
4. Copy Channel ID ไปใน `.env.local`

## 🏃 รัน Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์

## 📱 Features

### หน้าแรก (Home)
- Carousel โฆษณา 5 รูป
- Popup โฆษณาแนวตั้งเมื่อเข้าครั้งแรก
- Ranking Top 10 นักตกปลา
- หมุดยอดฮิต 10 อันดับ

### แผนที่ปักหมุด (Map)
- แสดงแผนที่กับ Leaflet
- ปักหมุดได้เฉพาะตำแหน่งปัจจุบัน
- Filter โดยชนิดปลา
- Filter โดยระยะทาง (5, 10, 20, 50, 100 กม.)
- Ranking 20 อันดับ
- หาหมุดที่ใกล้ที่สุด

### ปักหมุดใหม่ (New Pin)
- ถ่ายรูปจากกล้อง
- อัพโหลดรูปจากแกลเลอรี
- อัพโหลดได้สูงสุด 2 รูป
- เลือกชนิดปลา
- บันทึกน้ำหนัก
- เพิ่มคำบรรยาย

### โปรไฟล์ (Profile)
- เปลี่ยนรูปโปรไฟล์
- แก้ไขชื่อและชื่อเล่น
- แก้ไข Bio
- ดูสถิติการตกปลา
- ออกจากระบบ

### สมุดบันทึก (Diary)
- ดูประวัติการปักหมุด
- แชร์บันทึก
- บันทึกเป็น Template
- Template รวม: รูปโปรไฟล์, ชื่อเล่น, รูปผลงาน, ตำแหน่ง

## 🎨 Design System

### Colors
- **Primary**: #FF4444 (Red)
- **Secondary**: #1E1E1E (Dark Gray)
- **Accent**: #0066FF (Blue)
- **Dark**: #0D0D0D (Black)
- **Light**: #FFFFFF (White)

### Typography
- **Headers**: Noto Sans Thai (700)
- **Body**: IBM Plex Sans Thai (400)

### Dark Theme
- โปรเจคใช้ Dark Theme เป็นหลัก
- สีแดง, ดำ, น้ำเงิน, ขาว

## 📱 Responsive Design

- ✅ Mobile First (โฟกัสที่ขนาดหน้าจอมือถือ)
- ✅ Tablet Support
- ⚠️ Desktop: แสดงข้อความ "ใช้ได้เฉพาะอุปกรณ์เคลื่อนที่"

## 🔐 Authentication

- **Email/Password**: สมัครสมาชิกและเข้าสู่ระบบ
- **Google OAuth**: เข้าด้วย Google
- **LINE OAuth**: เข้าด้วย LINE

## 📦 Build & Deploy

### Build
```bash
npm run build
```

### Start Production
```bash
npm start
```

## 📋 Project Structure

```
fe-mhaina/
├── app/                      # Next.js App Directory
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   ├── auth/                # Authentication pages
│   ├── map/                 # Map/Pins page
│   ├── pin/                 # Pin details & new pin
│   ├── profile/             # User profile
│   └── diary/               # Fishing diary
├── components/
│   ├── ui/                  # UI components
│   ├── navigation/          # Navigation
│   ├── auth/                # Auth components
│   ├── providers/           # Providers
│   └── utils/               # Utility components
├── lib/
│   ├── types.ts            # TypeScript types
│   ├── supabase.ts         # Supabase client
│   ├── api.ts              # API functions
│   ├── store.ts            # Zustand store
│   └── utils.ts            # Utility functions
├── public/                  # Static files
├── supabase/
│   └── schema.sql          # Database schema
└── package.json
```

## 🐛 Troubleshooting

### Leaflet Map ไม่แสดง
- เช็ค CSS import ใน layout.tsx
- ดูให้แน่ใจว่า leaflet package ติดตั้งแล้ว

### Geolocation ไม่ทำงาน
- ใช้ HTTPS หรือ localhost
- ต้องอนุญาตตำแหน่งจากบราว์เซอร์

### Supabase Connection Error
- เช็ค `.env.local` ว่ากรอกถูก
- ทดสอบ URL และ Key ใน Supabase dashboard

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Leaflet Docs](https://leafletjs.com)
- [Tailwind CSS](https://tailwindcss.com)

## 📝 License

MIT License - See LICENSE file for details

## 👨‍💻 Contributing

สนับสนุน Bug reports และ Pull requests!

## 📞 Support

สำหรับปัญหา หรือคำถาม โปรดติดต่อ Facebook Page หรือสร้าง Issue ใน Repository

---

**Version**: 0.1.0  
**Last Updated**: 2026-04-23
