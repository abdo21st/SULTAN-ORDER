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
        transform: function (_doc, { _id, __v, ...fields }) {
            return { ...fields, id: _id };
        }
    },
    toObject: { virtuals: true }
});

export default mongoose.models.Facility || mongoose.model('Facility', FacilitySchema);
