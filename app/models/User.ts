import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
    },
    password: {
        type: String,
        // required: [true, 'Please provide a password'], // Optional for now
    },
    displayName: {
        type: String,
        required: [true, 'Please provide a display name'],
    },
    roleId: {
        type: String,
        required: [true, 'Please provide a role ID'],
    },
    facilityId: {
        type: String,
    },
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

export default mongoose.models.User || mongoose.model('User', UserSchema);
