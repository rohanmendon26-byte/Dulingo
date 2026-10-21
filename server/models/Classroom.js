import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const classroomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    subject: {
      type: String,
      default: 'Civic Learning',
      trim: true,
      maxlength: 60,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teacherName: {
      type: String,
      default: 'Teacher',
      trim: true,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

classroomSchema.index({ active: 1, teacher: 1 });
classroomSchema.index({ students: 1 });

export const Classroom = model('Classroom', classroomSchema);
export default Classroom;
