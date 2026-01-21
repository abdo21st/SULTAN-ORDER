'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Calendar, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    category: string;
    description: string;
    date: string;
}

interface FinancialStats {
    totalRevenue: number;
    pendingRevenue: number;
    totalExpenses: number;
    netProfit: number;
    currentMonth: {
        revenue: number;
        expenses: number;
    };
}

export default function FinancePage() {
    const [stats, setStats] = useState<FinancialStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses'>('dashboard');

    // New Expense Form State
    const [newExpense, setNewExpense] = useState({
        amount: '',
        category: '',
        description: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchFinancialData = async () => {
        try {
            setLoading(true);
            const [statsRes, txRes] = await Promise.all([
                fetch('/api/finance/stats'),
                fetch('/api/finance/transactions')
            ]);

            const statsData = await statsRes.json();
            const txData = await txRes.json();

            if (statsData.success) setStats(statsData.data);
            if (txData.success) setTransactions(txData.data);
        } catch (error) {
            console.error('Failed to fetch financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinancialData();
    }, []);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/finance/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newExpense,
                    type: 'EXPENSE',
                })
            });
            const data = await res.json();
            if (data.success) {
                // Reset form and reload data
                setNewExpense({ amount: '', category: '', description: '' });
                fetchFinancialData();
                setActiveTab('dashboard'); // Switch back to view result
            }
        } catch (error) {
            console.error('Failed to add expense:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && !stats) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-pulse text-orange-600 font-medium">جاري تحديث البيانات المالية...</div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign className="text-orange-500" />
                        الإدارة المالية
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">متابعة الإيرادات والمصروفات والأرباح</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        لوحة التحكم
                    </button>
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'expenses'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Plus size={16} />
                        تسجيل مصروف
                    </button>
                </div>
            </div>

            {/* Main Content */}
            {activeTab === 'dashboard' ? (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Revenue */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <TrendingUp size={64} />
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium mb-2">إجمالي الإيرادات</h3>
                            <div className="text-3xl font-bold text-emerald-600 font-mono">
                                {stats?.totalRevenue?.toLocaleString()} <span className="text-sm font-sans text-gray-400">د.ل</span>
                            </div>
                            <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-full">
                                +{stats?.currentMonth.revenue.toLocaleString()} هذا الشهر
                            </div>
                        </div>

                        {/* Expenses */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <TrendingDown size={64} />
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium mb-2">إجمالي المصروفات</h3>
                            <div className="text-3xl font-bold text-red-600 font-mono">
                                {stats?.totalExpenses?.toLocaleString()} <span className="text-sm font-sans text-gray-400">د.ل</span>
                            </div>
                            <div className="mt-2 text-xs text-red-600 bg-red-50 inline-block px-2 py-1 rounded-full">
                                +{stats?.currentMonth.expenses.toLocaleString()} هذا الشهر
                            </div>
                        </div>

                        {/* Net Profit */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Wallet size={64} />
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium mb-2">صافي الأرباح</h3>
                            <div className={`text-3xl font-bold font-mono ${(stats?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {stats?.netProfit?.toLocaleString()} <span className="text-sm font-sans text-gray-400">د.ل</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">الإيرادات - المصروفات</p>
                        </div>

                        {/* Pending */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <AlertCircle size={64} />
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium mb-2">مبالغ متبقية (ديون)</h3>
                            <div className="text-3xl font-bold text-orange-500 font-mono">
                                {stats?.pendingRevenue?.toLocaleString()} <span className="text-sm font-sans text-gray-400">د.ل</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">لم يتم تحصيلها بعد</p>
                        </div>
                    </div>

                    {/* Recent Transactions Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-700">أحدث العمليات المالية</h3>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200">آخر 50 عملية</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">التاريخ</th>
                                        <th className="px-6 py-3">البيان</th>
                                        <th className="px-6 py-3">التصنيف</th>
                                        <th className="px-6 py-3">المبلغ</th>
                                        <th className="px-6 py-3">النوع</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {transactions.length > 0 ? (
                                        transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 text-gray-600 font-mono">
                                                    {format(new Date(tx.date), 'yyyy/MM/dd')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-gray-800">{tx.description || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{tx.category}</span>
                                                </td>
                                                <td className="px-6 py-4 font-bold font-mono">
                                                    {tx.amount.toLocaleString()} <span className="text-gray-400 text-xs font-normal">د.ل</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${tx.type === 'INCOME'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {tx.type === 'INCOME' ? 'إيراد' : 'مصروف'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                                لا توجد عمليات مالية مسجلة مؤخراً
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="bg-red-50 p-3 rounded-xl">
                                <TrendingDown className="text-red-500" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">تسجيل مصروف جديد</h2>
                                <p className="text-gray-500 text-sm">إضافة مصروفات تشغيلية (رواتب، إيجار، مواد، إلخ)</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddExpense} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">قيمة المصروف (د.ل)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-mono text-lg"
                                    placeholder="0.00"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all appearance-none bg-white"
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                >
                                    <option value="">اختر التصنيف...</option>
                                    <option value="Raw Materials">مواد خام</option>
                                    <option value="Salaries">رواتب وأجور</option>
                                    <option value="Rent">إيجار</option>
                                    <option value="Utilities">كهرباء ومياه</option>
                                    <option value="Maintenance">صيانة</option>
                                    <option value="Marketing">تسويق</option>
                                    <option value="Other">نثريات أخرى</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">بيان المصروف (الوصف)</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all min-h-[100px]"
                                    placeholder="مثال: شراء دقيق وسكر، فاتورة الكهرباء لشهر 5..."
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('dashboard')}
                                    className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] px-6 py-3 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-bold shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ المصروف'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
