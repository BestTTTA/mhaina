import type { Metadata } from 'next';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { ResponsiveCheck } from '@/components/utils/ResponsiveCheck';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { Toaster } from '@/components/ui/Toaster';
import './globals.css';

export const metadata: Metadata = {
  title: 'มหัศจรรย์ปลา - แอปจดบันทึกตกปลา',
  description: 'แอปพลิเคชันสำหรับนักตกปลา ปักหมุดตำแหน่ง แชร์ผลงาน และติดตามอันดับ',
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
            <div className="pb-24">
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
