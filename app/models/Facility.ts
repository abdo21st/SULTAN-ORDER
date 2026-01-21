import mongoose from 'mongoose';

const FacilitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for the facility'],
    },
    type: {
        type: String,
        enum: ['SHOP', 'FACTORY'],
        required: true,
    },
    location: {
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

export default mongoose.models.Facility || mongoose.model('Facility', FacilitySchema);
