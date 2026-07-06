const mongoose = require('mongoose');
const Counter = require('./counterschema');

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    total: { type: Number, required: true },
    status: { type: String, default: 'Processing' },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    paymentMethod: { type: String, required: true, default: 'COD' },
    items: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, default: 1 }
        }
    ]
}, { timestamps: true }); // This automatically adds the createdAt timestamp your UI needs

OrderSchema.pre('save', async function () {
    if (!this.orderId) {
        const counter = await Counter.findOneAndUpdate(
            { id: 'orderId' },
            { $inc: { seq: 1 } },
            { returnDocument: 'after', upsert: true }
        );
        const paddedSeq = String(counter.seq).padStart(3, '0');
        this.orderId = `ECOM-O-${paddedSeq}`;
    }
});

module.exports = mongoose.model('Order', OrderSchema);