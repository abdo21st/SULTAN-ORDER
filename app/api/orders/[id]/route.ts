import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Order from '@/app/models/Order';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const { id } = params;
        const updates = await request.json();

        // Always update the 'updatedAt' field
        const finalUpdates = {
            ...updates,
            updatedAt: new Date().toISOString()
        };

        const order = await Order.findByIdAndUpdate(id, finalUpdates, {
            new: true, // Return the updated document
            runValidators: true,
        });

        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: order });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 400 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const { id } = params;
        const deletedOrder = await Order.findByIdAndDelete(id);

        if (!deletedOrder) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to delete order' }, { status: 400 });
    }
}
