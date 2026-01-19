'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orderService } from '@/app/lib/store';
import { User, Facility, Role, FacilityType, Permission, AlertRule, STATUS_LABELS } from '@/app/types';
import { Trash2, Plus, Shield, Building, Users, Store, Bell, Clock, AlertTriangle, Download, UploadCloud, FileJson } from 'lucide-react';

// --- Constants ---
const ALL_PERMISSIONS: { key: Permission, label: string }[] = [
    { key: 'MANAGE_SETTINGS', label: 'إدارة النظام والإعدادات (كاملة)' },
    { key: 'MANAGE_USERS', label: 'إدارة المستخدمين والأدوار' },
    { key: 'CREATE_ORDER', label: 'إنشاء طلبات جديدة (للمسودة)' },
    { key: 'EDIT_ORDER', label: 'تعديل مسودات الطلبات' },
    { key: 'VIEW_ALL_ORDERS', label: 'عرض جميع الطلبات' },
    // Detailed Status Permissions
    { key: 'MOVE_TO_REGISTERED', label: 'اعتماد الطلب وتسجيله' },
    { key: 'MOVE_TO_IN_CREATION', label: 'بدء التصنيع (للمعمل)' },
    { key: 'MOVE_TO_PREPARED', label: 'إتمام التجهيز (للمعمل)' },
    { key: 'MOVE_TO_TRANSFERRED', label: 'نقل الطلب للمحل (للمعمل)' },
    { key: 'MOVE_TO_DELIVERED', label: 'تسليم الطلب للزبون (للمحل)' },
];

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'users' | 'facilities' | 'roles' | 'alerts' | 'backup'>('users');

    // Data State
    const [users, setUsers] = useState<User[]>([]);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Form States
    const [newUser, setNewUser] = useState<Partial<User>>({});
    const [newFacility, setNewFacility] = useState<Partial<Facility>>({ type: 'SHOP' });
    const [newAlertRule, setNewAlertRule] = useState<Partial<AlertRule>>({
        isActive: true,
        triggerType: 'TIME_BEFORE_DUE',
        targetRoles: []
    });

    // Role Editing State
    const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);

    useEffect(() => {
        const user = orderService.getCurrentUser();
        // الحماية: فقط من لديه صلاحية MANAGE_SETTINGS
        if (!user || (user.id !== 'SU_MASTER_DEV' && !orderService.hasPermission('MANAGE_SETTINGS'))) {
            if (user) router.push('/');
        }
        setCurrentUser(user);
        refreshData();
    }, []);

    const refreshData = () => {
        // Filter out the secret Master Admin from the list
        const allUsers = orderService.getUsers();
        setUsers(allUsers.filter(u => u.username !== 'admin'));

        setFacilities(orderService.getFacilities());
        setRoles(orderService.getRoles());
        setAlertRules(orderService.getAlertRules());
    };

    // --- Users Handlers ---
    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.username || !newUser.password || !newUser.displayName || !newUser.roleId) return;

        orderService.saveUser({
            ...newUser as User,
            id: newUser.id || Math.random().toString(36).substr(2, 9)
        });
        setNewUser({});
        refreshData();
    };

    const handleDeleteUser = (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            orderService.deleteUser(id);
            refreshData();
        }
    };

    // --- Facility Handlers ---
    const handleAddFacility = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFacility.name) return;

        orderService.saveFacility({
            ...newFacility as Facility,
            id: newFacility.id || Math.random().toString(36).substr(2, 9)
        });
        setNewFacility({ type: 'SHOP' });
        refreshData();
    };

    const handleDeleteFacility = (id: string) => {
        if (confirm('هل أنت متأكد؟ قد توجد طلبات مرتبطة بهذا الفرع/المصنع!')) {
            orderService.deleteFacility(id);
            refreshData();
        }
    };

    // --- Role Handlers ---
    const handleSaveRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole || !editingRole.name) return;

        const roleToSave = {
            ...editingRole,
            permissions: editingRole.permissions || [],
            id: editingRole.id || Math.random().toString(36).substr(2, 9)
        } as Role;

        orderService.saveRole(roleToSave);
        setEditingRole(null);
        refreshData();
    };

    const togglePermission = (perm: Permission) => {
        if (!editingRole) return;
        const currentPerms = new Set(editingRole.permissions || []);
        if (currentPerms.has(perm)) {
            currentPerms.delete(perm);
        } else {
            currentPerms.add(perm);
        }
        setEditingRole({ ...editingRole, permissions: Array.from(currentPerms) });
    };

    const handleDeleteRole = (id: string) => {
        const usersWithRole = users.filter(u => u.roleId === id);
        if (usersWithRole.length > 0) {
            alert(`لا يمكن حذف هذا الدور لأنه مستخدم من قبل ${usersWithRole.length} مستخدمين!`);
            return;
        }
        if (confirm('هل أنت متأكد من حذف هذا الدور؟')) {
            const updatedRoles = roles.filter(r => r.id !== id);
            // Directly updating localStorage as specific deleteRole wasn't exposed yet, 
            // but effectively we should rely on store. In a real app we'd add deleteRole to store.
            // For consistency with previous logic:
            localStorage.setItem('sultan_roles_db', JSON.stringify(updatedRoles));
            refreshData();
        }
    };

    // --- Alert Handlers ---
    const handleAddAlertRule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAlertRule.name || !newAlertRule.messageTemplate) return;

        orderService.saveAlertRule({
            ...newAlertRule as AlertRule,
            id: Math.random().toString(36).substr(2, 9)
        });
        setNewAlertRule({ isActive: true, triggerType: 'TIME_BEFORE_DUE', targetRoles: [] });
        refreshData();
    };

    const handleDeleteAlertRule = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent triggering other clicks
        if (confirm('حذف قاعدة التنبيه هذه؟')) {
            orderService.deleteAlertRule(id);
            refreshData();
        }
    };

    const toggleAlertTargetRole = (roleId: string) => {
        const currentTargets = new Set(newAlertRule.targetRoles || []);
        if (currentTargets.has(roleId)) currentTargets.delete(roleId);
        else currentTargets.add(roleId);
        setNewAlertRule({ ...newAlertRule, targetRoles: Array.from(currentTargets) });
    };

    // --- Backup & Restore Handlers ---
    const handleDownloadBackup = () => {
        const data = orderService.createBackup();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `sultan-orders-backup-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('تحذير هام: استعادة النسخة الاحتياطية ستقوم بحذف جميع البيانات الحالية واستبدالها بالنسخة الجديدة. هل أنت متأكد تماماً؟')) {
            e.target.value = ''; // reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const success = orderService.restoreBackup(json);
                if (success) {
                    alert('تم استعادة البيانات بنجاح! سيتم إعادة تحميل الصفحة.');
                    window.location.reload();
                } else {
                    alert('فشل استعادة البيانات. الملف قد يكون تالفاً أو غير صالح.');
                }
            } catch (err) {
                console.error(err);
                alert('حدث خطأ أثناء قراءة الملف.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">إعدادات النظام</h1>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 pb-1 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'users' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Users size={20} />
                    المستخدمين
                </button>
                <button
                    onClick={() => setActiveTab('facilities')}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'facilities' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Building size={20} />
                    الفروع والمصانع
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'roles' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Shield size={20} />
                    الأدوار والصلاحيات
                </button>
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'alerts' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Bell size={20} />
                    التنبيهات
                </button>
                <button
                    onClick={() => setActiveTab('backup')}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'backup' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <FileJson size={20} />
                    نسخ احتياطي
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow border border-gray-100 p-6">

                {/* --- USERS TAB --- */}
                {activeTab === 'users' && (
                    <div className="space-y-8">
                        {/* List */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 text-gray-500 text-sm">
                                    <tr>
                                        <th className="p-3">الاسم</th>
                                        <th className="p-3">اسم الدخول</th>
                                        <th className="p-3">الدور</th>
                                        <th className="p-3">يتبع لـ</th>
                                        <th className="p-3">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50/50">
                                            <td className="p-3 font-medium">{u.displayName}</td>
                                            <td className="p-3 text-gray-500">{u.username}</td>
                                            <td className="p-3">
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                    {roles.find(r => r.id === u.roleId)?.name || u.roleId}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {facilities.find(f => f.id === u.facilityId)?.name || '-'}
                                            </td>
                                            <td className="p-3">
                                                {u.username !== 'admin' && (
                                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 p-1" title="حذف المستخدم">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Add User Form */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <Plus size={20} />
                                إضافة مستخدم جديد
                            </h3>
                            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="newUserDisplay" className="sr-only">الاسم الكامل</label>
                                    <input
                                        id="newUserDisplay"
                                        placeholder="الاسم الكامل (للعرض)"
                                        className="w-full p-2 border rounded"
                                        value={newUser.displayName || ''}
                                        onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newUserUsername" className="sr-only">اسم الدخول</label>
                                    <input
                                        id="newUserUsername"
                                        placeholder="اسم المستخدم (للدخول)"
                                        className="w-full p-2 border rounded"
                                        value={newUser.username || ''}
                                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newUserPass" className="sr-only">كلمة المرور</label>
                                    <input
                                        id="newUserPass"
                                        placeholder="كلمة المرور"
                                        type="password"
                                        className="w-full p-2 border rounded"
                                        value={newUser.password || ''}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newUserRole" className="sr-only">الدور</label>
                                    <select
                                        id="newUserRole"
                                        className="w-full p-2 border rounded"
                                        value={newUser.roleId || ''}
                                        onChange={e => setNewUser({ ...newUser, roleId: e.target.value })}
                                        required
                                        title="اختر الدور"
                                    >
                                        <option value="">اختر الدور...</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="newUserFacility" className="sr-only">المصنع/الفرع</label>
                                    <select
                                        id="newUserFacility"
                                        className="w-full p-2 border rounded"
                                        value={newUser.facilityId || ''}
                                        onChange={e => setNewUser({ ...newUser, facilityId: e.target.value })}
                                        title="اختر الفرع أو المصنع"
                                    >
                                        <option value="">تابع لفرع/مصنع محدد؟ (اختياري)</option>
                                        {facilities.map(f => (
                                            <option key={f.id} value={f.id}>
                                                {f.type === 'SHOP' ? '🏪' : '🏭'} {f.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button type="submit" className="bg-orange-600 text-white font-bold py-2 rounded hover:bg-orange-700 md:col-span-2 shadow">
                                    حفظ المستخدم
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- FACILITIES TAB --- */}
                {activeTab === 'facilities' && (
                    <div className="space-y-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 text-gray-500 text-sm">
                                    <tr>
                                        <th className="p-3">الاسم</th>
                                        <th className="p-3">النوع</th>
                                        <th className="p-3">الموقع</th>
                                        <th className="p-3">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {facilities.map(f => (
                                        <tr key={f.id}>
                                            <td className="p-3 font-medium flex items-center gap-2">
                                                {f.type === 'SHOP' ? <Store size={16} className="text-green-600" /> : <Building size={16} className="text-blue-600" />}
                                                {f.name}
                                            </td>
                                            <td className="p-3">
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${f.type === 'SHOP' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {f.type === 'SHOP' ? 'محل / معرض' : 'مصنع / معمل'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-500">{f.location || '-'}</td>
                                            <td className="p-3">
                                                <button onClick={() => handleDeleteFacility(f.id)} className="text-red-500 hover:text-red-700" title="حذف">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Add Facility Form */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <Plus size={20} />
                                إضافة فرع أو مصنع
                            </h3>
                            <form onSubmit={handleAddFacility} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-2">
                                    <label htmlFor="facName" className="block text-xs mb-1 text-gray-500">الاسم</label>
                                    <input
                                        id="facName"
                                        className="w-full p-2 border rounded"
                                        value={newFacility.name || ''}
                                        onChange={e => setNewFacility({ ...newFacility, name: e.target.value })}
                                        required
                                        placeholder="اسم الفرع أو المصنع"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="facType" className="block text-xs mb-1 text-gray-500">النوع</label>
                                    <select
                                        id="facType"
                                        className="w-full p-2 border rounded"
                                        value={newFacility.type}
                                        onChange={e => setNewFacility({ ...newFacility, type: e.target.value as FacilityType })}
                                        required
                                    >
                                        <option value="SHOP">🏪 محل / معرض</option>
                                        <option value="FACTORY">🏭 مصنع / معمل</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="facLoc" className="block text-xs mb-1 text-gray-500">الموقع (اختياري)</label>
                                    <input
                                        id="facLoc"
                                        className="w-full p-2 border rounded"
                                        value={newFacility.location || ''}
                                        onChange={e => setNewFacility({ ...newFacility, location: e.target.value })}
                                        placeholder="العنوان"
                                    />
                                </div>
                                <button type="submit" className="bg-orange-600 text-white font-bold py-2 px-6 rounded hover:bg-orange-700 md:col-start-4 shadow">
                                    إضافة
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- ROLES TAB --- */}
                {activeTab === 'roles' && (
                    <div className="space-y-6">
                        {/* List of Roles */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {roles.map(role => (
                                <div key={role.id} className="border p-4 rounded-xl bg-gray-50 relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-lg flex items-center gap-2">
                                            <Shield size={18} className="text-orange-600" />
                                            {role.name}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditingRole(role)}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                title="تعديل"
                                            >
                                                <span className="text-xs font-bold">تعديل</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRole(role.id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                title="حذف"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {role.permissions.map(p => (
                                            <span key={p} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">
                                                {ALL_PERMISSIONS.find(ap => ap.key === p)?.label || p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Add New Role Button */}
                            <button
                                onClick={() => setEditingRole({ name: '', permissions: [] })}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all min-h-[150px]"
                            >
                                <Plus size={32} />
                                <span className="font-bold mt-2">إضافة دور جديد</span>
                            </button>
                        </div>

                        {/* Edit/Create Role Modal Overlay */}
                        {editingRole && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                                    <div className="bg-orange-50 p-4 border-b border-orange-100 flex justify-between items-center">
                                        <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                                            <Shield className="text-orange-600" />
                                            {editingRole.id ? 'تعديل الدور والصلاحيات' : 'إنشاء دور جديد'}
                                        </h3>
                                        <button onClick={() => setEditingRole(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
                                    </div>

                                    <form onSubmit={handleSaveRole} className="p-6 space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">اسم الدور الوظيفي</label>
                                            <input
                                                autoFocus
                                                type="text"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                                placeholder="مثال: مشرف مبيعات، مدير إنتاج..."
                                                value={editingRole.name || ''}
                                                onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-3">الصلاحيات المتاحة</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                                                {ALL_PERMISSIONS.map(permission => (
                                                    <label
                                                        key={permission.key}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${(editingRole.permissions || []).includes(permission.key)
                                                            ? 'bg-orange-50 border-orange-500 shadow-sm'
                                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                                                            checked={(editingRole.permissions || []).includes(permission.key)}
                                                            onChange={() => togglePermission(permission.key)}
                                                        />
                                                        <span className="text-sm font-medium text-gray-700 select-none">
                                                            {permission.label}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => setEditingRole(null)}
                                                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                إلغاء
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-[2] py-3 px-4 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200"
                                            >
                                                حفظ التغييرات
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- ALERTS TAB --- */}
                {activeTab === 'alerts' && (
                    <div className="space-y-8">
                        <div className="grid gap-4 md:grid-cols-2">
                            {alertRules.map(rule => (
                                <div key={rule.id} className="border border-gray-200 p-4 rounded-xl flex justify-between items-start bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {rule.triggerType === 'TIME_BEFORE_DUE' ? <Clock size={18} className="text-blue-500" /> : <AlertTriangle size={18} className="text-orange-500" />}
                                            <span className="font-bold text-gray-800">{rule.name}</span>
                                            {rule.isActive ?
                                                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">نشط</span> :
                                                <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">معطل</span>
                                            }
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">
                                            {rule.triggerType === 'TIME_BEFORE_DUE' ? `تنبيه قبل ${rule.minutesBefore} دقيقة من الموعد` : 'عند تغيير الحالة'}
                                        </p>
                                        <div className="text-xs text-gray-400">
                                            يتم إبلاغ: {rule.targetRoles.map(rid => roles.find(r => r.id === rid)?.name || rid).join('، ')}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteAlertRule(rule.id, e)}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                        title="حذف قاعدة التنبيه"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Alert Form */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <Plus size={20} />
                                إضافة قاعدة تنبيه جديدة
                            </h3>
                            <form onSubmit={handleAddAlertRule} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">اسم التنبيه</label>
                                        <input
                                            className="w-full p-2 border rounded"
                                            value={newAlertRule.name || ''}
                                            onChange={e => setNewAlertRule({ ...newAlertRule, name: e.target.value })}
                                            placeholder="مثال: تنبيه التسليم العاجل"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">نوع التنبيه</label>
                                        <select
                                            className="w-full p-2 border rounded"
                                            value={newAlertRule.triggerType || 'TIME_BEFORE_DUE'}
                                            onChange={e => setNewAlertRule({ ...newAlertRule, triggerType: e.target.value as any })}
                                            title="نوع التنبيه"
                                        >
                                            <option value="TIME_BEFORE_DUE">⏰ زمني (قبل موعد التسليم)</option>
                                            <option value="STATUS_CHANGE">⚡ حدث (عند الوصول لحالة معينة)</option>
                                        </select>
                                    </div>
                                </div>

                                {newAlertRule.triggerType === 'TIME_BEFORE_DUE' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">تنبيه قبل كم دقيقة؟</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border rounded"
                                            value={newAlertRule.minutesBefore || ''}
                                            onChange={e => setNewAlertRule({ ...newAlertRule, minutesBefore: parseInt(e.target.value) })}
                                            placeholder="مثال: 60 (قبل ساعة)"
                                            required
                                        />
                                    </div>
                                )}

                                {newAlertRule.triggerType === 'STATUS_CHANGE' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">عند الوصول لأي حالة؟</label>
                                        <select
                                            className="w-full p-2 border rounded"
                                            value={newAlertRule.targetStatus || ''}
                                            onChange={e => setNewAlertRule({ ...newAlertRule, targetStatus: e.target.value as any })}
                                            required
                                            title="الحالة المستهدفة"
                                        >
                                            <option value="">اختر الحالة...</option>
                                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">نص الرسالة</label>
                                    <input
                                        className="w-full p-2 border rounded"
                                        value={newAlertRule.messageTemplate || ''}
                                        onChange={e => setNewAlertRule({ ...newAlertRule, messageTemplate: e.target.value })}
                                        placeholder="الطلبية {id} للزبون {customer} قاربت على التسليم!"
                                        required
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">يمكنك استخدام {`{id}`} و {`{customer}`} كمتغيرات.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-2">من سيستلم التنبيه؟</label>
                                    <div className="flex flex-wrap gap-2 bg-white p-3 border rounded">
                                        {roles.map(role => (
                                            <label key={role.id} className={`flex items-center gap-2 p-2 rounded border cursor-pointer select-none transition-colors ${(newAlertRule.targetRoles || []).includes(role.id) ? 'bg-orange-50 border-orange-500' : 'hover:bg-gray-50'
                                                }`}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-orange-600 focus:ring-orange-500"
                                                    checked={(newAlertRule.targetRoles || []).includes(role.id)}
                                                    onChange={() => toggleAlertTargetRole(role.id)}
                                                />
                                                <span className="text-xs font-bold">{role.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="bg-orange-600 text-white font-bold py-2 w-full rounded hover:bg-orange-700 shadow">
                                    حفظ القاعدة
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- BACKUP TAB --- */}
                {activeTab === 'backup' && (
                    <div className="max-w-xl mx-auto space-y-8 py-4">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">النسخ الاحتياطي والاستعادة</h2>
                            <p className="text-gray-500">
                                يمكنك حفظ نسخة كاملة من بيانات النظام (الطلبات، المستخدمين، الإعدادات) لاستعادتها لاحقاً أو نقلها لجهاز آخر.
                            </p>
                        </div>

                        {/* Export Section */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8 text-center transition-all hover:shadow-md">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                <Download size={32} />
                            </div>
                            <h3 className="font-bold text-lg text-blue-900 mb-2">تصدير البيانات</h3>
                            <p className="text-sm text-blue-700 mb-6">احفظ ملف JSON يحتوي على جميع بيانات النظام الحالية.</p>
                            <button
                                onClick={handleDownloadBackup}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto"
                            >
                                <Download size={20} />
                                تحميل النسخة الاحتياطية
                            </button>
                        </div>

                        {/* Import Section */}
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-8 text-center transition-all hover:shadow-md">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                                <UploadCloud size={32} />
                            </div>
                            <h3 className="font-bold text-lg text-orange-900 mb-2">استعادة البيانات</h3>
                            <p className="text-sm text-orange-700 mb-6">
                                رفع ملف نسخة احتياطية سابق لاستعادة البيانات.
                                <br />
                                <span className="font-bold text-red-600">تحذير: سيتم مسح البيانات الحالية!</span>
                            </p>
                            <label className="cursor-pointer bg-white border-2 border-dashed border-orange-300 hover:border-orange-500 hover:bg-orange-50 text-orange-600 font-bold py-4 px-8 rounded-xl transition-all flex flex-col items-center gap-2">
                                <UploadCloud size={24} />
                                <span>اضغط لاختيار ملف النسخة الاحتياطية</span>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleUploadBackup}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
