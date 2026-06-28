import mongoose from 'mongoose';

const chatReportSchema = new mongoose.Schema(
  {
    ReporterName: {
      type: String,
      required: [true, 'Reporter name is required'],
      trim: true,
    },
    ReportedName: {
      type: String,
      required: [true, 'Reported user name is required'],
      trim: true,
    },
    Reason: {
      type: String,
      required: [true, 'Reason for report is required'],
      trim: true,
    },
    Status: {
      type: String,
      enum: ['Pending', 'Resolved'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for fast lookups
chatReportSchema.index({ Status: 1 });
chatReportSchema.index({ ReporterName: 1, ReportedName: 1 });

const ChatReport = mongoose.model('ChatReport', chatReportSchema);

export default ChatReport;
