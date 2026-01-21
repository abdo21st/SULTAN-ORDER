import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Order from '@/app/models/Order';

export async function GET() {
    try {
        await dbConnect();
        const orders = await Order.find({}).sort({ createdAt: -1 }); // Newest first
        return NextResponse.json({ success: true, data: orders });
    } catch (error) {
        console.error("Orders GET Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Ensure critical dates exist
        const orderData = {
            ...body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const order = await Order.create(orderData);
        return NextResponse.json({ success: true, data: order }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 400 });
    }
}
