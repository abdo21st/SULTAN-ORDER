import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Facility from '@/app/models/Facility';

export async function GET() {
    try {
        await dbConnect();
        const facilities = await Facility.find({});
        return NextResponse.json({ success: true, data: facilities });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch facilities' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const facility = await Facility.create(body);
        return NextResponse.json({ success: true, data: facility }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to create facility' }, { status: 400 });
    }
}
