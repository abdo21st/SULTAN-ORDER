import { Order, OrderStatus, User, Role, Facility, Permission, AppNotification, AlertRule } from '@/app/types';

const DEFAULT_ROLES: Role[] = [
    {
        id: 'admin_role',
        name: 'مدير النظام (Master)',
        permissions: ['MANAGE_SETTINGS', 'MANAGE_USERS', 'CREATE_ORDER', 'EDIT_ORDER', 'VIEW_ALL_ORDERS',
            'MOVE_TO_REGISTERED', 'MOVE_TO_IN_CREATION', 'MOVE_TO_PREPARED', 'MOVE_TO_TRANSFERRED', 'MOVE_TO_DELIVERED']
    },
    {
        id: 'reception_role',
        name: 'موظف استقبال (محل)',
        permissions: ['CREATE_ORDER', 'EDIT_ORDER', 'VIEW_ALL_ORDERS', 'MOVE_TO_REGISTERED', 'MOVE_TO_DELIVERED']
    },
    {
        id: 'factory_role',
        name: 'موظف مصنع',
        permissions: ['VIEW_ALL_ORDERS', 'MOVE_TO_IN_CREATION', 'MOVE_TO_PREPARED', 'MOVE_TO_TRANSFERRED']
    }
];

class OrderService {
    // In-memory state (cache)
    private orders: Order[] = [];
    private users: User[] = [];
    private facilities: Facility[] = [];
    private roles: Role[] = DEFAULT_ROLES;

    // Auth state
    private CURRENT_USER_KEY = 'sultan_current_user_v2';

    constructor() {
        // Initial fetch logic can be placed here or called manually
    }

    // --- API Calls (Central Data Fetcher) ---
    async fetchAllData() {
        try {
            // Parallel fetching for speed
            const [resOrders, resUsers, resFacilities] = await Promise.all([
                fetch('/api/orders'),
                fetch('/api/users'),
                fetch('/api/facilities')
            ]);

            const dataOrders = await resOrders.json();
            const dataUsers = await resUsers.json();
            const dataFacilities = await resFacilities.json();

            if (dataOrders.success) this.orders = dataOrders.data;
            if (dataUsers.success) this.users = dataUsers.data;
            if (dataFacilities.success) this.facilities = dataFacilities.data;

            // Should seed defaults if DB is empty? Maybe later.

        } catch (e) {
            console.error("Failed to fetch data", e);
        }
    }

    // Helper to refresh UI
    private notifyListeners() {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
        }
    }

    // --- Authentication ---
    login(username: string, password: string): User | null {
        // 1. Master Login (Always available regardless of DB)
        const now = new Date();
        const calculatedPassword = String((now.getFullYear() * (now.getMonth() + 1)) + now.getDate());

        if (username === 'admin' && password === calculatedPassword) {
            const masterUser: User = {
                id: 'SU_MASTER_DEV',
                username: 'admin',
                displayName: 'مدير النظام (Master)',
                roleId: 'admin_role',
                facilityId: 'main_shop'
            };
            this.setCurrentUser(masterUser);
            return masterUser;
        }

        // 2. DB Users Login
        // Note: Password should be hashed in production. Here simple check.
        const user = this.users.find(u => u.username === username && (u.password === password || u.password === undefined));

        if (user) {
            this.setCurrentUser(user);
            return user;
        }

        return null;
    }

    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.CURRENT_USER_KEY);
        }
    }

    getCurrentUser(): User | null {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem(this.CURRENT_USER_KEY);
        return stored ? JSON.parse(stored) : null;
    }

    private setCurrentUser(user: User) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
        }
    }

    getUserRole(roleId: string): Role | undefined {
        return this.roles.find(r => r.id === roleId);
    }

    hasPermission(permission: Permission): boolean {
        const user = this.getCurrentUser();
        if (!user) return false;
        const role = this.getUserRole(user.roleId);
        return role ? role.permissions.includes(permission) : false;
    }

    // --- Order Operations ---
    getOrders(): Order[] { return this.orders; }

    async refreshOrders(): Promise<Order[]> {
        await this.fetchAllData();
        this.notifyListeners();
        return this.orders;
    }

    getById(id: string): Order | undefined {
        // Supports both MongoDB _id and legacy id
        return this.orders.find(o => (o as any)._id === id || o.id === id);
    }

    async create(orderData: Partial<Order>): Promise<Order | null> {
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            const json = await res.json();
            if (json.success) {
                await this.fetchAllData();
                this.notifyListeners();
                return json.data;
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    async updateStatus(id: string, newStatus: OrderStatus): Promise<Order | null> {
        const current = this.getById(id);
        if (!current) return null;

        const historyEntry = {
            status: newStatus,
            timestamp: new Date().toISOString(),
            note: 'تحديث الحالة'
        };

        const updates = {
            status: newStatus,
            history: [...current.history, historyEntry]
        };

        return this.updateDetails(id, updates as any);
    }

    async updateDetails(id: string, updates: Partial<Order>): Promise<Order | null> {
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const json = await res.json();
            if (json.success) {
                await this.fetchAllData();
                this.notifyListeners();
                return json.data;
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    // --- Search & Filters ---
    search(query: string): Order[] {
        const lowerQuery = query.toLowerCase().trim();
        if (!lowerQuery) return this.orders;
        return this.orders.filter(order =>
            order.customerName.toLowerCase().includes(lowerQuery) ||
            order.customerPhone.includes(lowerQuery)
        );
    }

    getUpcomingOrders(): Order[] {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return this.orders.filter(order => {
            const dueDate = new Date(order.dueDate);
            return dueDate >= now && dueDate <= tomorrow && order.status !== 'DELIVERED';
        });
    }

    getOverdueOrders(): Order[] {
        const now = new Date();
        return this.orders.filter(order => {
            const dueDate = new Date(order.dueDate);
            return dueDate < now && order.status !== 'DELIVERED';
        });
    }

    // --- Facility Management (Integrated with API) ---
    getFacilities(): Facility[] { return this.facilities; }
    getShops(): Facility[] { return this.facilities.filter(f => f.type === 'SHOP'); }
    getFactories(): Facility[] { return this.facilities.filter(f => f.type === 'FACTORY'); }

    async saveFacility(facility: Facility) {
        try {
            const method = facility.id || (facility as any)._id ? 'PUT' : 'POST';
            const url = facility.id || (facility as any)._id
                ? `/api/facilities/${facility.id || (facility as any)._id}`
                : '/api/facilities';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(facility)
            });

            if (res.ok) {
                await this.fetchAllData();
                this.notifyListeners();
            }
        } catch (e) { console.error(e); }
    }

    async deleteFacility(id: string) {
        try {
            await fetch(`/api/facilities/${id}`, { method: 'DELETE' });
            await this.fetchAllData();
            this.notifyListeners();
        } catch (e) { console.error(e); }
    }

    // --- User Management (Integrated with API) ---
    getUsers(): User[] { return this.users; }
    getRoles(): Role[] { return this.roles; }

    async saveUser(user: User) {
        try {
            // Basic password handling for this phase
            const method = user.id || (user as any)._id ? 'PUT' : 'POST';
            const url = user.id || (user as any)._id
                ? `/api/users/${user.id || (user as any)._id}`
                : '/api/users';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });

            if (res.ok) {
                await this.fetchAllData();
                this.notifyListeners();
            }
        } catch (e) { console.error(e); }
    }

    async deleteUser(id: string) {
        try {
            await fetch(`/api/users/${id}`, { method: 'DELETE' });
            await this.fetchAllData();
            this.notifyListeners();
        } catch (e) { console.error(e); }
    }

    // --- Alerts ---
    getAlertRules(): AlertRule[] { return []; }
    getMyNotifications(): AppNotification[] { return []; }
}

export const orderService = new OrderService();
