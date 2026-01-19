import Link from 'next/link';
import { Order } from '@/app/types';
import StatusBadge from './StatusBadge';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

export default function OrderCard({ order }: { order: Order }) {
    return (
        <Link href={`/orders/${order.id}`} className="block">
            <div className="bg-white rounded-lg shadow-sm border border-orange-100 hover:shadow-md transition-shadow p-4 cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{order.customerName}</h3>
                        <div className="flex items-center text-gray-500 text-sm mt-1">
                            <User size={14} className="mr-1" />
                            <span>{order.customerPhone}</span>
                        </div>
                    </div>
                    <StatusBadge status={order.status} />
                </div>

                <p className="text-gray-600 text-sm line-clamp-2 mb-3 bg-gray-50 p-2 rounded">
                    {order.description}
                </p>

                {/* عرض المبالغ المالية */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                    <div className="bg-blue-50 p-2 rounded">
                        <div className="text-gray-500">الإجمالي</div>
                        <div className="font-bold text-blue-700">{order.totalAmount.toFixed(2)}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                        <div className="text-gray-500">المدفوع</div>
                        <div className="font-bold text-green-700">{order.paidAmount.toFixed(2)}</div>
                    </div>
                    <div className="bg-orange-50 p-2 rounded">
                        <div className="text-gray-500">المتبقي</div>
                        <div className="font-bold text-orange-700">{order.remainingAmount.toFixed(2)}</div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <div className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        <span>تسليم: {format(new Date(order.dueDate), 'yyyy/MM/dd')}</span>
                    </div>
                    <span>#{order.id}</span>
                </div>
            </div>
        </Link>
    );
}
