const Order = require('../models/orderschema');
const Counter = require('../models/counterschema');

async function migrateOrders() {
    // Find orders without orderId sorted chronologically by creation time
    const ordersWithoutId = await Order.find({ orderId: { $exists: false } }).sort({ createdAt: 1 });
    if (ordersWithoutId.length === 0) {
        return;
    }
    console.log(`Found ${ordersWithoutId.length} orders without orderId. Migrating...`);

    for (const order of ordersWithoutId) {
        const counter = await Counter.findOneAndUpdate(
            { id: 'orderId' },
            { $inc: { seq: 1 } },
            { returnDocument: 'after', upsert: true }
        );
        const paddedSeq = String(counter.seq).padStart(3, '0');
        order.orderId = `ECOM-O-${paddedSeq}`;
        await order.save();
        console.log(`Migrated order ${order._id} to orderId: ${order.orderId}`);
    }
    console.log('Order migration complete.');
}

module.exports = migrateOrders;
