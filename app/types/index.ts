// Permissions List
export type Permission =
    | 'MANAGE_SETTINGS' // الدخول للإعدادات الكاملة
    | 'MANAGE_USERS'    // إدارة المستخدمين
    | 'CREATE_ORDER'    // إنشاء طلب (دخول المسودة)
    | 'EDIT_ORDER'      // تعديل مسودة
    | 'VIEW_ALL_ORDERS' // رؤية كل الطلبات
    // --- صلاحيات الحالات التفصيلية الجديدة ---
    | 'MOVE_TO_REGISTERED'  // اعتماد وتسجيل
    | 'MOVE_TO_IN_CREATION' // بدء التصنيع
    | 'MOVE_TO_PREPARED'    // إتمام التجهيز
    | 'MOVE_TO_TRANSFERRED' // نقل للمحل
    | 'MOVE_TO_DELIVERED';  // تسليم للزبون

export type FacilityType = 'SHOP' | 'FACTORY';

export interface Facility {
    id: string;
    name: string;
    location?: string;
    type: FacilityType;
}

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export interface User {
    id: string;
    username: string;
    displayName: string;
    password?: string;
    roleId: string;
    facilityId?: string; // Links to Facility (Shop or Factory)
}

export type OrderStatus =
    | 'DRAFT'
    | 'REGISTERED' // تسجيل الطلب (في المحل)
    | 'IN_CREATION' // قيد الانشاء (بدأ المصنع)
    | 'PREPARED' // تم التجهيز (انتهى المصنع)
    | 'TRANSFERRED' // تم النقل (خرج من المصنع للمحل)
    | 'DELIVERED'; // تم التسليم (وصل الزبون من المحل)

export const STATUS_LABELS: Record<OrderStatus, string> = {
    'DRAFT': 'مسودة (قيد الإدخال)',
    'REGISTERED': 'تسجيل الطلب',
    'IN_CREATION': 'قيد الإنشاء',
    'PREPARED': 'تم التجهيز',
    'TRANSFERRED': 'تم النقل للمحل',
    'DELIVERED': 'تم التسليم',
};

export interface Order {
    id: string;
    customerName: string;
    customerPhone: string;
    description: string;
    imageUrl?: string;
    dueDate: string;
    status: OrderStatus;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    factoryId?: string; // المصنع الذي سينفذ الطلب
    shopId?: string;    // المحل الذي استقبل الطلب
    createdAt: string;
    updatedAt: string;
    history: {
        status: OrderStatus;
        timestamp: string;
        note?: string;
    }[];
}
// --- Notifications & Alerts ---
export type NotificationType = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: string;
    targetUrl?: string; // رابط عند النقر (مثلاً للطلب)
    roleId?: string;    // موجه لأي دور (اختياري)
    userId?: string;    // موجه لمستخدم محدد (اختياري)
}

export interface AlertRule {
    id: string;
    name: string;
    isActive: boolean;
    triggerType: 'TIME_BEFORE_DUE' | 'STATUS_CHANGE';
    minutesBefore?: number; // للتنبيه الزمني
    targetStatus?: OrderStatus; // لتنبيه تغيير الحالة
    targetRoles: string[]; // الأدوار التي ستستلم التنبيه
    messageTemplate: string; // نص التنبيه
}
