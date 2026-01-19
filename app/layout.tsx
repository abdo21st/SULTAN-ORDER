import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import AuthProvider from '@/app/components/AuthProvider';
import UserMenu from '@/app/components/UserMenu';
import NotificationBell from '@/app/components/NotificationBell';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "حلويات السلطان | نظام الطلبات",
  description: "نظام إدارة طلبات الزبائن الداخلي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 min-h-screen`} suppressHydrationWarning={true}>
        <AuthProvider>
          <nav className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
              <Link href="/" className="font-bold text-2xl text-orange-600 tracking-tight">
                حلويات السلطان 👑
              </Link>
              <div className="flex gap-4 items-center">
                <NotificationBell />
                <UserMenu />
              </div>
            </div>
          </nav>
          <main className="max-w-5xl mx-auto px-4 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
