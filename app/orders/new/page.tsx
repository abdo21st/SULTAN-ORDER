'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orderService } from '@/app/lib/store';
import { ArrowRight, Upload, Building, Store } from 'lucide-react';
import { Facility } from '@/app/types';
import Link from 'next/link';

export default function NewOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [factories, setFactories] = useState<Facility[]>([]);
    const [currentShop, setCurrentShop] = useState<Facility | undefined>(undefined);

    const [imagePreview, setImagePreview] = useState<string>('');
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        description: '',
        dueDate: '',
        totalAmount: 0,
        paidAmount: 0,
        factoryId: '', // مطلوب (المصنع المستلم)
        shopId: '',    // المحل (المرسل)
    });

    useEffect(() => {
        const initData = async () => {
            // Ensure we have data
            if (orderService.getFactories().length === 0) {
                await orderService.fetchAllData();
            }

            // 1. Get List of FACTORIES
            const allFactories = orderService.getFactories();
            setFactories(allFactories);

            // 2. Identify Current User's Facility (SHOP)
            const currentUser = orderService.getCurrentUser();
            let myShopId = '';

            if (currentUser && currentUser.facilityId) {
                const facilities = orderService.getFacilities();
                const userFacility = facilities.find(f => f.id === currentUser.facilityId);
                if (userFacility) {
                    setCurrentShop(userFacility);
                    myShopId = userFacility.id;
                }
            }

            // Fallback: If no shop assigned to user (e.g. admin), try to pick the first SHOP available
            if (!myShopId) {
                const allShops = orderService.getShops();
                if (allShops.length > 0) {
                    myShopId = allShops[0].id;
                    // Optional: Set visual indication that we auto-picked a shop
                }
            }

            setFormData(prev => ({
                ...prev,
                shopId: myShopId || 'unknown_shop', // Fallback to avoid validation error
                factoryId: allFactories.length === 1 ? allFactories[0].id : prev.factoryId
            }));
        };

        initData();
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (!formData.factoryId) {
            alert('يرجى اختيار المصنع الموجه له الطلب');
            setLoading(false);
            return;
        }

        try {
            await orderService.create({
                customerName: formData.customerName,
                customerPhone: formData.customerPhone,
                description: formData.description,
                dueDate: formData.dueDate,
                totalAmount: formData.totalAmount,
                paidAmount: formData.paidAmount,
                imageUrl: imagePreview || undefined,
                factoryId: formData.factoryId,
                shopId: formData.shopId || 'unknown_shop'
            });

            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Failed to create order:', error);
            alert('حدث خطأ أثناء حفظ الطلب. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex items-center gap-2 text-gray-500">
                <Link href="/" className="hover:text-gray-900 transition-colors">
                    <ArrowRight size={20} />
                </Link>
                <span>تسجيل طلب جديد</span>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-8">
                <div className="flex justify-between items-start mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">بيانات الطلب الجديد</h1>
                    {currentShop && (
                        <div className="flex items-center gap-2 bg-orange-50 text-orange-800 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">
                            <Store size={14} />
                            فرع: {currentShop.name}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Factory Selection (Top for visibility) */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <label htmlFor="factoryId" className="block text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                            <Building size={16} />
                            توجيه الطلب للمصنع (إلزامي)
                        </label>
                        <select
                            id="factoryId"
                            required
                            className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white outline-none"
                            value={formData.factoryId}
                            onChange={(e) => setFormData({ ...formData, factoryId: e.target.value })}
                        >
                            <option value="">-- اختر المصنع --</option>
                            {factories.map(f => (
                                <option key={f.id} value={f.id}>{f.name} {f.location ? `(${f.location})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">اسم الزبون</label>
                            <input
                                id="customerName"
                                required
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                value={formData.customerName}
                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                placeholder="مثال: محمد أحمد"
                            />
                        </div>

                        <div>
                            <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">رقم الجوال</label>
                            <input
                                id="customerPhone"
                                required
                                type="tel"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                value={formData.customerPhone}
                                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                placeholder="05xxxxxxxx"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">تاريخ وموعد الاستلام</label>
                        <input
                            id="dueDate"
                            required
                            type="datetime-local"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-2">المبلغ الإجمالي</label>
                            <input
                                id="totalAmount"
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                value={formData.totalAmount}
                                onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label htmlFor="paidAmount" className="block text-sm font-medium text-gray-700 mb-2">المبلغ المدفوع (العربون)</label>
                            <input
                                id="paidAmount"
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                value={formData.paidAmount}
                                onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label htmlFor="remainingAmount" className="block text-sm font-medium text-gray-700 mb-2">المبلغ المتبقي</label>
                            <input
                                id="remainingAmount"
                                type="number"
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-bold"
                                value={(formData.totalAmount - formData.paidAmount).toFixed(2)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">تفاصيل الطلب</label>
                        <textarea
                            id="description"
                            required
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="اكتب وصفاً دقيقاً للطلب (النوع، الحشوة، الكتابة المطلوبة...)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">صورة الطلب (اختياري)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors relative">
                            {imagePreview ? (
                                <div className="relative w-full">
                                    <img src={imagePreview} alt="معاينة" className="max-h-64 mx-auto rounded-lg" />
                                    <button
                                        type="button"
                                        onClick={() => setImagePreview('')}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload size={32} className="mb-2 text-gray-400" />
                                    <span className="text-sm mb-2">اضغط لرفع صورة</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        title="رفع صورة الطلب"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 active:scale-95 transition-all shadow-lg shadow-orange-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'جاري الحفظ...' : 'حفظ كمسودة (قيد الإدخال)'}
                    </button>
                </form>
            </div>
        </div>
    );
}
