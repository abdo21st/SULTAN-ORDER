'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { orderService } from '@/app/lib/store';
import { Order, OrderStatus, Permission } from '@/app/types';
import StatusBadge from '@/app/components/StatusBadge';
import { ArrowLeft, ArrowRight, Calendar, Check, CheckCircle2, Factory, Truck, User, Edit } from 'lucide-react';
import { format } from 'date-fns';

const NEXT_STEPS: Record<OrderStatus, { next: OrderStatus; label: string; icon: any; color: string } | null> = {
    'DRAFT': { next: 'REGISTERED', label: 'اعتماد الطلب (تسجيل)', icon: CheckCircle2, color: 'bg-blue-600 hover:bg-blue-700' },
    'REGISTERED': { next: 'IN_CREATION', label: 'بدء الإنشاء (المصنع)', icon: Factory, color: 'bg-purple-600 hover:bg-purple-700' },
    'IN_CREATION': { next: 'PREPARED', label: 'إتمام التجهيز', icon: Check, color: 'bg-yellow-600 hover:bg-yellow-700' },
    'PREPARED': { next: 'TRANSFERRED', label: 'نقل للفرع', icon: Truck, color: 'bg-orange-600 hover:bg-orange-700' },
    'TRANSFERRED': { next: 'DELIVERED', label: 'تسليم للزبون', icon: User, color: 'bg-green-600 hover:bg-green-700' },
    'DELIVERED': null
};

export default function ClientOrderDetails({ id }: { id: string }) {
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFactoryUser, setIsFactoryUser] = useState(false);
    const [canPerformAction, setCanPerformAction] = useState(false);

    useEffect(() => {
        // Check current user role/facility
        const user = orderService.getCurrentUser();
        if (user && user.facilityId) {
            const facilities = orderService.getFacilities();
            const userFacility = facilities.find(f => f.id === user.facilityId);
            if (userFacility?.type === 'FACTORY') {
                setIsFactoryUser(true);
            }
        }

        if (id) {
            const data = orderService.getById(id);
            if (data) {
                setOrder(data);
            }
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        if (!order) return;
        const nextStep = NEXT_STEPS[order.status];
        if (!nextStep) {
            setCanPerformAction(false);
            return;
        }

        let requiredPermission: Permission = 'VIEW_ALL_ORDERS';

        switch (nextStep.next) {
            case 'REGISTERED': requiredPermission = 'MOVE_TO_REGISTERED'; break;
            case 'IN_CREATION': requiredPermission = 'MOVE_TO_IN_CREATION'; break;
            case 'PREPARED': requiredPermission = 'MOVE_TO_PREPARED'; break;
            case 'TRANSFERRED': requiredPermission = 'MOVE_TO_TRANSFERRED'; break;
            case 'DELIVERED': requiredPermission = 'MOVE_TO_DELIVERED'; break;
            default: requiredPermission = 'VIEW_ALL_ORDERS'; break;
        }

        if (requiredPermission) {
            setCanPerformAction(orderService.hasPermission(requiredPermission));
        } else {
            setCanPerformAction(true);
        }
    }, [order]);

    const handleStatusUpdate = (nextStatus: OrderStatus) => {
        if (!order) return;

        console.log('Attemping to update status to:', nextStatus);
        const updated = orderService.updateStatus(order.id, nextStatus);
        if (updated) {
            console.log('Status updated successfully:', updated);
            setOrder(updated);
            router.refresh();
        } else {
            console.error('Failed to update status');
            alert('فشل تحديث الحالة');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">جاري التحميل...</div>;
    if (!order) return <div className="p-8 text-center text-red-500 font-bold">الطلب غير موجود</div>;

    const nextAction = NEXT_STEPS[order.status];
    const Icon = nextAction?.icon;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center gap-2 text-gray-500">
                <Link href="/" className="hover:text-gray-900 transition-colors">
                    <ArrowRight size={20} />
                </Link>
                <span>تفاصيل الطلب #{order.id}</span>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden">
                {/* Header */}
                <div className="bg-orange-50/50 p-6 border-b border-orange-100 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{order.customerName}</h1>
                        <div className="flex items-center text-gray-600 gap-4">
                            <div className="flex items-center gap-1">
                                <User size={16} />
                                <span dir="ltr">{order.customerPhone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar size={16} />
                                <span>
                                    {(() => {
                                        try {
                                            return format(new Date(order.dueDate), 'yyyy/MM/dd hh:mm a');
                                        } catch {
                                            return <span className="text-red-500">تاريخ غير صالح</span>;
                                        }
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={order.status} />
                        <span className="text-xs text-gray-400">
                            تاريخ الإنشاء: {(() => {
                                try {
                                    return format(new Date(order.createdAt), 'yyyy/MM/dd');
                                } catch {
                                    return '-';
                                }
                            })()}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">تفاصيل الطلب</h3>
                        <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap bg-gray-50 p-6 rounded-lg border border-gray-100">
                            {order.description}
                        </p>
                    </div>

                    {/* Financial Details */}
                    {!isFactoryUser && (
                        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                                <div className="text-blue-600 text-sm font-medium mb-1">المبلغ الإجمالي</div>
                                <div className="text-3xl font-bold text-blue-900">{order.totalAmount.toFixed(2)}</div>
                                <div className="text-xs text-blue-600 mt-1">دينار</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                                <div className="text-green-600 text-sm font-medium mb-1">المبلغ المدفوع</div>
                                <div className="text-3xl font-bold text-green-900">{order.paidAmount.toFixed(2)}</div>
                                <div className="text-xs text-green-600 mt-1">دينار (عربون)</div>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                                <div className="text-orange-600 text-sm font-medium mb-1">المبلغ المتبقي</div>
                                <div className="text-3xl font-bold text-orange-900">{order.remainingAmount.toFixed(2)}</div>
                                <div className="text-xs text-orange-600 mt-1">دينار</div>
                            </div>
                        </div>
                    )}

                    {/* Order Image */}
                    {order.imageUrl && (
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">صورة الطلب</h3>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <img
                                    src={order.imageUrl}
                                    alt="صورة الطلب"
                                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Area */}
                    <div className="border-t border-gray-100 pt-8 mt-8">
                        {nextAction ? (
                            <div className="flex flex-col items-center justify-center gap-4 bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                                <p className="text-gray-600 font-medium">الخطوة التالية في العملية:</p>
                                <div className="flex gap-4">
                                    {order.status === 'DRAFT' && (
                                        <Link
                                            href={`/orders/${order.id}/edit`}
                                            className="flex items-center gap-3 px-6 py-4 rounded-lg bg-white text-gray-700 font-bold text-lg shadow-md border border-gray-200 hover:bg-gray-50 hover:shadow-lg hover:-translate-y-1 transition-all"
                                        >
                                            <Edit size={24} />
                                            شرح/تعديل
                                        </Link>
                                    )}

                                    {canPerformAction ? (
                                        <button
                                            onClick={() => handleStatusUpdate(nextAction.next)}
                                            className={`flex items-center gap-3 px-8 py-4 rounded-lg text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all ${nextAction.color}`}
                                        >
                                            {Icon && <Icon size={24} />}
                                            {nextAction.label}
                                        </button>
                                    ) : (
                                        <div className="text-gray-500 bg-gray-200 px-6 py-3 rounded-lg flex items-center gap-2 cursor-not-allowed">
                                            <span className="font-bold">ليس لديك صلاحية للإجراء التالي</span>
                                            <span className="text-xs">({nextAction.next})</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 text-green-600 p-6 bg-green-50 rounded-xl border border-green-100 font-bold text-lg">
                                <CheckCircle2 size={32} />
                                تم استكمال جميع مراحل الطلب بنجاح!
                            </div>
                        )}
                    </div>

                    {/* History Log */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-400 mb-4">سجل الحركات</h4>
                        <div className="space-y-3">
                            {order.history.slice().reverse().map((h, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-orange-300"></span>
                                    <span className="text-gray-900 font-medium">{h.status}</span>
                                    <span className="text-gray-400 text-xs">{format(new Date(h.timestamp), 'hh:mm a')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
