import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Order from '@/app/models/Order';
import Transaction from '@/app/models/Transaction';
import { startOfMonth } from 'date-fns';

export async function GET(req: Request) {
    try {
        await dbConnect();

        const startOfCurrentMonth = startOfMonth(new Date());

        // These read-only aggregations are independent; await them together.
        const [orderStats, expenseStats, currentMonthRevenueAgg, currentMonthExpensesAgg] = await Promise.all([
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$paidAmount" },
                        pendingRevenue: { $sum: "$remainingAmount" },
                        totalOrders: { $count: {} }
                    }
                }
            ]),
            Transaction.aggregate([
                { $match: { type: 'EXPENSE' } },
                { $group: { _id: null, totalExpenses: { $sum: "$amount" } } }
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: startOfCurrentMonth } } },
                { $group: { _id: null, total: { $sum: "$paidAmount" } } }
            ]),
            Transaction.aggregate([
                { $match: { type: 'EXPENSE', date: { $gte: startOfCurrentMonth } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ])
        ]);

        const totalRevenue = orderStats[0]?.totalRevenue || 0;
        const pendingRevenue = orderStats[0]?.pendingRevenue || 0;
        const totalExpenses = expenseStats[0]?.totalExpenses || 0;
        const netProfit = totalRevenue - totalExpenses;

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
