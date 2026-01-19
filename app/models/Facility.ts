import mongoose, { Schema, Document } from 'mongoose';
import { FacilityType } from '@/app/types';

export interface IFacility extends Document {
    name: string;
    type: FacilityType;
    location?: string;
}

const FacilitySchema: Schema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['SHOP', 'FACTORY'] },
    location: { type: String }
});

export default mongoose.models.Facility || mongoose.model<IFacility>('Facility', FacilitySchema);
