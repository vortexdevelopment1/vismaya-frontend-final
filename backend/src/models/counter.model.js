const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: true
        },
        seq: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const Counter = mongoose.model("Counter", counterSchema);

const getNextInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const counterId = `invoice_${year}`;
    const counter = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" }
    );
    return `INV-${year}-${String(counter.seq).padStart(5, "0")}`;
};

module.exports = {
    Counter,
    getNextInvoiceNumber
};
