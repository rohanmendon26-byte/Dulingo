import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const xpLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    reason: { type: String, default: '' },
  },
  { timestamps: true }
);

export const XpLog = model('XpLog', xpLogSchema);
export default XpLog;
