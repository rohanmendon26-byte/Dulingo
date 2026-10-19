import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const storySchema = new Schema(
  {
    title: { type: String, required: true },
    topic: { type: String, default: 'General' },
    text: { type: String, required: true }, // paragraphs separated by blank lines
    audioUrl: { type: String, default: '' }, // optional pre-recorded audio file or URL
    xp: { type: Number, default: 10 },
    translations: { type: Schema.Types.Mixed, default: {} }, // { hi: {title,text}, kn: {...} }
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Story = model('Story', storySchema);
export default Story;
