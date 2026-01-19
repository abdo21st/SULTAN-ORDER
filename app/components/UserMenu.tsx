'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { orderService } from '@/app/lib/store';
import { LogOut, User as UserIcon, Settings, PlusCircle, Home } from 'lucide-react';
import Link from 'next/link';

export default function UserMenu() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<{ displayName: string; username: string } | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Hydration fix & Update on navigation
        const checkUser = () => {
            const currentUser = orderService.getCurrentUser();
            setUser(currentUser);
        };

        checkUser();

        // Listen to storage events (in case login happens in another tab/window)
        window.addEventListener('storage', checkUser);

        return () => {
            window.removeEventListener('storage', checkUser);
        };
    }, [pathname]); // Re-run when pathname changes (e.g. after login redirect)

    const handleLogout = () => {
        // Direct logout without confirmation for better reliability
        orderService.logout();
        window.location.href = '/login';
    };

    // If loading or no user, show a placeholder skeleton/login state
    if (!user) return (
        <div className="flex items-center gap-4 animate-pulse">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
    );

    return (
        <div className="flex items-center gap-4">
            {/* Quick Actions (Desktop) */}
            <div className="hidden md:flex items-center gap-1 text-sm text-gray-600">
                <Link href="/" className="hover:text-orange-600 p-2 rounded-md hover:bg-orange-50 flex items-center gap-1" title="الرئيسية">
                    <Home size={18} />
                </Link>
                <Link href="/orders/new" className="hover:text-orange-600 p-2 rounded-md hover:bg-orange-50 flex items-center gap-1" title="طلب جديد">
                    <PlusCircle size={18} />
                </Link>
                <Link href="/settings" className="hover:text-orange-600 p-2 rounded-md hover:bg-orange-50 flex items-center gap-1" title="الإعدادات">
                    <Settings size={18} />
                </Link>
            </div>

            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

            {/* User Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 hover:bg-gray-50 p-1 pr-3 rounded-full border border-gray-100 transition-colors"
                >
                    <div className="bg-orange-100 text-orange-700 p-2 rounded-full">
                        <UserIcon size={18} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-gray-700 leading-none">{user.displayName}</span>
                        <span className="text-[10px] text-gray-400">@{user.username}</span>
                    </div>
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {/* Mobile Links inside dropdown */}
                        <div className="md:hidden border-b border-gray-100 mb-1 pb-1">
                            <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">
                                <Home size={16} /> الرئيسية
                            </Link>
                            <Link href="/orders/new" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">
                                <PlusCircle size={16} /> طلب جديد
                            </Link>
                            <Link href="/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">
                                <Settings size={16} /> الإعدادات
                            </Link>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full text-right flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                            <LogOut size={16} />
                            تسجيل الخروج
                        </button>
                    </div>
                )}
            </div>

            {/* Overlay to close dropdown */}
            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            )}
        </div>
    );
}
