import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    displayName: string;
    password?: string; // Optional for external auth, but used here for simple auth
    roleId: string;
    facilityId?: string;
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    password: { type: String }, // In production, this should be HASHED
    roleId: { type: String, required: true },
    facilityId: { type: String }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
