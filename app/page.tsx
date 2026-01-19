'use client';

import { useEffect, useState } from 'react';
import { orderService } from '@/app/lib/store';
import { Order } from '@/app/types';
import OrderCard from '@/app/components/OrderCard';
import { RefreshCcw } from 'lucide-react';

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAlerts, setShowAlerts] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch latest from API via store
      const data = await orderService.refreshOrders();
      // Sort is handled by API usually but good to keep safe on client too
      const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // البحث في الطلبات
  const filteredOrders = searchQuery
    ? orderService.search(searchQuery)
    : orders;

  // الحصول على التنبيهات
  const upcomingOrders = orderService.getUpcomingOrders();
  const overdueOrders = orderService.getOverdueOrders();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الطلبات الحالية</h1>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          تحديث
        </button>
      </div>

      {/* شريط البحث */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 ابحث بالاسم أو رقم الهاتف أو رقم الطلب..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
        />
      </div>

      {/* التنبيهات */}
      {(upcomingOrders.length > 0 || overdueOrders.length > 0) && (
        <div className="mb-6 space-y-3">
          {overdueOrders.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 font-bold mb-2">
                <span className="text-xl">⚠️</span>
                <span>طلبات متأخرة ({overdueOrders.length})</span>
              </div>
              <div className="text-sm text-red-700">
                {overdueOrders.map(o => o.customerName).join(', ')}
              </div>
            </div>
          )}
          {upcomingOrders.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 font-bold mb-2">
                <span className="text-xl">🔔</span>
                <span>طلبات قريبة (خلال 24 ساعة) ({upcomingOrders.length})</span>
              </div>
              <div className="text-sm text-yellow-700">
                {upcomingOrders.map(o => o.customerName).join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg mb-4">
            {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد طلبات مسجلة حالياً'}
          </p>
          {!searchQuery && (
            <a href="/orders/new" className="text-orange-600 font-medium hover:underline">
              بدء طلب جديد
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
