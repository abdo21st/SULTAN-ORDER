import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Order from '@/app/models/Order';
import Transaction from '@/app/models/Transaction';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(req: Request) {
    try {
        await dbConnect();

        // --- 1. Calculate Revenue from Orders (All time & This Month) ---
        // We consider 'paidAmount' as the realized revenue

        const orderStats = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$paidAmount" },
                    pendingRevenue: { $sum: "$remainingAmount" },
                    totalOrders: { $count: {} }
                }
            }
        ]);

        // --- 2. Calculate Expenses from Transactions ---
        const expenseStats = await Transaction.aggregate([
            { $match: { type: 'EXPENSE' } },
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: "$amount" }
                }
            }
        ]);

        const totalRevenue = orderStats[0]?.totalRevenue || 0;
        const pendingRevenue = orderStats[0]?.pendingRevenue || 0;
        const totalExpenses = expenseStats[0]?.totalExpenses || 0;
        const netProfit = totalRevenue - totalExpenses;

        // --- Optional: Current Month Stats for quick view ---
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);

        const currentMonthRevenueAgg = await Order.aggregate([
            { $match: { createdAt: { $gte: startOfCurrentMonth } } },
            { $group: { _id: null, total: { $sum: "$paidAmount" } } }
        ]);

        const currentMonthExpensesAgg = await Transaction.aggregate([
            {
                $match: {
                    type: 'EXPENSE',
                    date: { $gte: startOfCurrentMonth }
                }
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const stats = {
            totalRevenue,
            pendingRevenue,
            totalExpenses,
            netProfit,
            currentMonth: {
                revenue: currentMonthRevenueAgg[0]?.total || 0,
                expenses: currentMonthExpensesAgg[0]?.total || 0
            }
        };

        return NextResponse.json({ success: true, data: stats });
    } catch (error: any) {
        console.error("Finance Stats Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to calculate stats' }, { status: 500 });
    }
}
