'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Clock, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { orderService } from '@/app/lib/store';
import { AppNotification, AlertRule, Order } from '@/app/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [lastCheck, setLastCheck] = useState<number>(Date.now());

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const refreshNotifications = () => {
        setNotifications(orderService.getMyNotifications());
    };

    // 1. Alert Engine (Runs every 10 seconds)
    useEffect(() => {
        refreshNotifications();

        const checkAlerts = () => {
            const rules = orderService.getAlertRules();
            const orders = orderService.getOrders();
            const now = new Date();

            rules.forEach(rule => {
                if (!rule.isActive) return;

                // A. Time Based Alerts
                if (rule.triggerType === 'TIME_BEFORE_DUE' && rule.minutesBefore) {
                    orders.forEach(order => {
                        // Skip delivered orders
                        if (order.status === 'DELIVERED') return;

                        const dueDate = new Date(order.dueDate);
                        const diffMs = dueDate.getTime() - now.getTime();
                        const diffMinutes = Math.floor(diffMs / 60000);

                        // Trigger if within range (e.g., between X and X-2 minutes to avoid duplicates)
                        if (diffMinutes <= (rule.minutesBefore || 0) && diffMinutes > (rule.minutesBefore || 0) - 2) {
                            const alertKey = `${rule.id}-${order.id}`;
                            if (sessionStorage.getItem(alertKey)) return;

                            const message = rule.messageTemplate.replace('{id}', order.id).replace('{customer}', order.customerName);

                            rule.targetRoles.forEach(roleId => {
                                orderService.createNotification({
                                    title: rule.name,
                                    message: message,
                                    type: diffMinutes < 0 ? 'CRITICAL' : 'WARNING',
                                    roleId: roleId,
                                    targetUrl: `/orders/${order.id}`
                                });
                            });
                            sessionStorage.setItem(alertKey, 'sent');
                            refreshNotifications();
                        }
                    });
                }

                // B. Status Change Alerts
                if (rule.triggerType === 'STATUS_CHANGE' && rule.targetStatus) {
                    orders.forEach(order => {
                        if (order.status === rule.targetStatus) {
                            const alertKey = `status-alert-${rule.id}-${order.id}-${order.status}`;

                            if (sessionStorage.getItem(alertKey)) return;

                            const message = rule.messageTemplate
                                .replace('{id}', order.id)
                                .replace('{customer}', order.customerName)
                                .replace('{status}', rule.targetStatus || '');

                            rule.targetRoles.forEach(roleId => {
                                orderService.createNotification({
                                    title: rule.name,
                                    message: message,
                                    type: 'INFO',
                                    roleId: roleId,
                                    targetUrl: `/orders/${order.id}`
                                });
                            });

                            sessionStorage.setItem(alertKey, 'sent');
                            refreshNotifications();
                        }
                    });
                }
            });
        };

        const interval = setInterval(() => {
            checkAlerts();
            refreshNotifications();
        }, 10000); // Check every 10s for faster feedback

        return () => clearInterval(interval);
    }, []);

    const handleMarkRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        orderService.markAsRead(id);
        refreshNotifications();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'CRITICAL': return <AlertTriangle size={16} className="text-red-500" />;
            case 'WARNING': return <Clock size={16} className="text-orange-500" />;
            case 'SUCCESS': return <CheckCircle size={16} className="text-green-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                title="التنبيهات"
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 -translate-x-1/2 md:translate-x-0 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-sm text-gray-700">التنبيهات</h3>
                            {unreadCount > 0 && (
                                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                    {unreadCount} جديد
                                </span>
                            )}
                        </div>

                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    لا توجد تنبيهات حالياً
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => {
                                                if (notif.targetUrl) {
                                                    router.push(notif.targetUrl);
                                                    setIsOpen(false);
                                                }
                                                // Auto mark as read on click
                                                orderService.markAsRead(notif.id);
                                                refreshNotifications();
                                            }}
                                            className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors relative ${!notif.isRead ? 'bg-orange-50/30' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-1 flex-shrink-0">
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-2">
                                                        {new Date(notif.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                {!notif.isRead && (
                                                    <button
                                                        onClick={(e) => handleMarkRead(notif.id, e)}
                                                        className="text-gray-300 hover:text-orange-500 self-start"
                                                        title="تعليم كمقروء"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                            <Link href="/settings" onClick={() => setIsOpen(false)} className="text-xs text-orange-600 hover:underline">
                                إدارة قواعد التنبيهات
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
