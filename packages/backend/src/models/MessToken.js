import mongoose from 'mongoose';

const messTokenSchema = new mongoose.Schema(
  {
    StudentName: {
      type: String,
      required: [true, 'Student Name is required'],
      trim: true,
    },
    PassType: {
      type: String,
      enum: {
        values: ['Guest', 'Student'],
        message: '{VALUE} is not a valid pass type',
      },
      default: 'Student',
      required: [true, 'Pass Type is required'],
    },
    IssuedAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Issued At timestamp is required'],
    },
    ExpiryTime: {
      type: Date,
      required: [true, 'Expiry Time is required'],
    },
    Quantity: {
      type: Number,
      default: 1,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const MessToken = mongoose.model('MessToken', messTokenSchema);

export default MessToken;
