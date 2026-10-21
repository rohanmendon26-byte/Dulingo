import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const taskSchema = new Schema(
  {
    title: { type: String, required: true },
    topic: { type: String, default: 'General' }, // Pensions, Taxes, Certificates...
    type: { type: String, enum: ['audio_mcq', 'fill_blank', 'essay', 'mock_form'], required: true },
    prompt: { type: String, required: true }, // what the student reads
    audioText: { type: String, default: '' }, // what is read aloud (falls back to prompt)
    audioUrl: { type: String, default: '' }, // optional pre-recorded audio file or URL
    options: { type: [String], default: [] }, // for audio_mcq
    answer: { type: String, default: '' }, // correct option / blank answer (| separated alternatives)
    explanation: { type: String, default: '' },
    // mock_form only: the boxes of the sample form. answer = accepted values separated by |
    fields: { type: [new Schema({ label: String, answer: String, hint: String, placeholder: String }, { _id: false })], default: [] },
    xp: { type: Number, default: 10 },
    assignedDate: { type: String, required: true }, // YYYY-MM-DD
    dueDate: { type: String, default: null }, // YYYY-MM-DD deadline
    dueTime: { type: String, default: '23:59' }, // HH:mm deadline time
    expiresAt: { type: Date, default: null }, // exact timestamp deadline
    translations: { type: Schema.Types.Mixed, default: {} }, // { hi: {title,prompt,audioText,options,explanation}, kn: {...} }
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    classroom: { type: Schema.Types.ObjectId, ref: 'Classroom', default: null },
  },
  { timestamps: true }
);

export const Task = model('Task', taskSchema);
export default Task;
