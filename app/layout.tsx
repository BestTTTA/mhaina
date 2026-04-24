import type { Metadata } from 'next';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { ResponsiveCheck } from '@/components/utils/ResponsiveCheck';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { TopBar } from '@/components/navigation/TopBar';
import { Toaster } from '@/components/ui/Toaster';
import './globals.css';

export const metadata: Metadata = {
  // 1. ปรับ Title ให้มี Keyword สำคัญอยู่ด้านหน้า
  title: 'หมายน้า - ค้นหาหมายตกปลา ปักหมุด แชร์ประสบการณ์นักตกปลาอันดับ 1',
  
  // 2. ปรับ Description ให้ดึงดูดและบอก Value Proposition ชัดเจน
  description: 'แพลตฟอร์มรวมหมายตกปลาทั่วไทย ค้นหาหมายเด็ด ปักหมุดแบ่งปันพิกัด แชร์ผลงานการตกปลา และติดตามตารางอันดับนักตกปลา พร้อมฟีเจอร์สำหรับชุมชนนักตกปลาโดยเฉพาะ',
  
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '192x192', type: 'image/png' },
    ],
  },

  // 3. ปรับ OpenGraph ให้ตรงกับ Branding ของ "หมายน้า" (แก้จาก Tarot เดิม)
  openGraph: {
    title: "หมายน้า - แพลตฟอร์มสำหรับนักตกปลาในประเทศไทย",
    description: "ค้นหาพิกัดหมายตกปลา แชร์จุดตกปลาเด็ดๆ และเช็ค Ranking นักตกปลาทั่วประเทศได้ที่นี่",
    url: "https://หมายน้า.com", // เปลี่ยนเป็นโดเมนจริงของคุ  ณ
    siteName: "หมายน้า.com",
    images: [
      {
        url: "https://หมายน้า.com/og-image.jpg", // รูปภาพพรีวิวควรเป็นรูปคนตกปลาหรือแผนที่
        width: 1200,
        height: 630,
        alt: "หมายน้า - แพลตฟอร์มสำหรับคนรักการตกปลา",
      },
    ],
    locale: "th_TH",
    type: "website",
  },

  // 4. Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "หมายน้า - สังคมออนไลน์ของนักตกปลา",
    description: "ปักหมุดหมายตกปลา แชร์ผลงาน และติดตามอันดับนักตกปลาได้ทุกวัน",
    images: ["https://หมายน้า.com/og-image.jpg"],
  },

  alternates: {
    canonical: "https://หมายน้า.com",
  },

  // 5. Keywords (เน้นคำที่คนใช้ค้นหาจริงใน Google)
  keywords: [
    "หมายตกปลา",
    "ตกปลา",
    "พิกัดตกปลา",
    "หมายตกปลาใกล้ฉัน",
    "อุปกรณ์ตกปลา",
    "แชร์หมายตกปลา",
    "นักตกปลา",
    "หมายน้า",
    "หมายน้า",
    "ตกปลาช่อน",
    "ตกปลาทะเล",
  ],

  authors: [{ name: "หมายน้า Team" }],
  creator: "หมายน้า",
  publisher: "หมายน้า",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-secondary text-light font-thai-sans h-full">
        <SupabaseProvider>
          <ResponsiveCheck>
            <TopBar />
            <div className="pt-14 pb-24">
              {children}
            </div>
            <BottomNavigation />
            <Toaster />
          </ResponsiveCheck>
        </SupabaseProvider>
      </body>
    </html>
  );
}