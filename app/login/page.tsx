'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderService } from '@/app/lib/store';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const user = orderService.login(username, password);
        if (user) {
            router.push('/');
            router.refresh();
        } else {
            setError('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col px-4">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-orange-600 mb-2">حلويات السلطان</h1>
                <p className="text-gray-600">نظام إدارة الطلبات المتكامل</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-orange-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">تسجيل الدخول</h2>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="اسم المستخدم"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition-colors shadow-md mt-4"
                    >
                        دخول
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-400">
                    <div>للتجربة: admin / 123</div>
                </div>
            </div>
        </div>
    );
}
