'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { orderService } from '@/app/lib/store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Initialize store defaults purely on client side
        // This ensures localStorage is ready
        orderService.getOrders();

        const isLoginPage = pathname?.startsWith('/login');
        const user = orderService.getCurrentUser();

        if (isLoginPage) {
            setAuthorized(true);
            return;
        }

        if (!user) {
            setAuthorized(false);
            router.push('/login');
        } else {
            setAuthorized(true);
        }
    }, [pathname, router]);

    // If on login page, always render children (the login form)
    if (pathname?.startsWith('/login')) {
        return <>{children}</>;
    }

    // Show loading only if strictly necessary
    if (!authorized) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-orange-600 font-bold">جاري التحقق...</div>;
    }

    return <>{children}</>;
}
