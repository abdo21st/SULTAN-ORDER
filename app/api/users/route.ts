import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import User from '@/app/models/User';

export async function GET() {
    try {
        await dbConnect();
        const users = await User.find({});
        return NextResponse.json({ success: true, data: users });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Simple check for duplicates
        const existing = await User.findOne({ username: body.username });
        if (existing) {
            return NextResponse.json({ success: false, error: 'Username already exists' }, { status: 400 });
        }

        const user = await User.create(body);
        return NextResponse.json({ success: true, data: user }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 400 });
    }
}
