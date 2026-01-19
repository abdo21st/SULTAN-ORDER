import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Facility from '@/app/models/Facility';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const { id } = params;
        const deleted = await Facility.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json({ success: false, error: 'Facility not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to delete facility' }, { status: 400 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const { id } = params;
        const updates = await request.json();

        const updated = await Facility.findByIdAndUpdate(id, updates, { new: true });

        if (!updated) {
            return NextResponse.json({ success: false, error: 'Facility not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update facility' }, { status: 400 });
    }
}
