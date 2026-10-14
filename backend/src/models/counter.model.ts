import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICounter extends Document<string> {
    _id: string;
    seq: number;
    createdAt: Date;
    updatedAt: Date;
}

const counterSchema = new Schema<ICounter>(
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

export const Counter: Model<ICounter> = mongoose.model<ICounter>("Counter", counterSchema);

export const getNextInvoiceNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const counterId = `invoice_${year}`;
    const counter = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" }
    );
    const seqNum = counter ? counter.seq : 1;
    return `INV-${year}-${String(seqNum).padStart(5, "0")}`;
};

export default {
    Counter,
    getNextInvoiceNumber
};
