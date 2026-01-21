import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Please provide a customer name'],
    },
    customerPhone: {
        type: String,
        required: [true, 'Please provide a customer phone number'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    dueDate: {
        type: String,
        required: [true, 'Please provide a due date'],
    },
    status: {
        type: String,
        default: 'REGISTERED',
        // Enum validation can be added here matching types.ts
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    paidAmount: {
        type: Number,
        required: true,
    },
    remainingAmount: {
        type: Number,
    },
    imageUrl: {
        type: String,
    },
    factoryId: {
        type: String,
        required: true,
    },
    shopId: {
        type: String,
        required: true,
    },
    history: [
        {
            status: String,
            timestamp: String,
            note: String,
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
}, {
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    },
    toObject: { virtuals: true }
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
