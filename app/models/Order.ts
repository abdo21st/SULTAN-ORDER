import mongoose, { Schema, Document } from 'mongoose';
import { OrderStatus } from '@/app/types';

// Define the interface for Type safety
export interface IOrder extends Document {
    customerName: string;
    customerPhone: string;
    description: string;
    imageUrl?: string;
    status: OrderStatus;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: string; // ISO Date string
    createdAt: string;
    updatedAt: string;
    createdBy: string; // User ID
    facilityId?: string; // Shop ID
    factoryId?: string; // Factory ID
    history: {
        status: OrderStatus;
        timestamp: string;
        note?: string;
        userId?: string;
    }[];
}

const OrderSchema: Schema = new Schema({
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    status: { type: String, required: true, default: 'DRAFT' },
    totalAmount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    remainingAmount: { type: Number, required: true, default: 0 },
    dueDate: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    createdBy: { type: String, required: true },
    facilityId: { type: String },
    factoryId: { type: String },
    history: [{
        status: { type: String, required: true },
        timestamp: { type: String, required: true },
        note: { type: String },
        userId: { type: String }
    }]
});

// Prevent model overwrite upon HMR (Hot Module Replacement)
export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
