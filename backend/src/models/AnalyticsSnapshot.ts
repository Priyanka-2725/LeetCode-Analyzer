import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalyticsSnapshot extends Document {
  username: string;
  snapshotDate: string; // YYYY-MM-DD
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  streak: number;
  consistencyScore: number;
  growthRate: number;
  weakTopics: string[];
  strongTopics: string[];
  fetchedAt: Date;
}

const AnalyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>({
  username: { type: String, required: true, index: true },
  snapshotDate: { type: String, required: true, index: true },
  totalSolved: { type: Number, required: true },
  easy: { type: Number, required: true },
  medium: { type: Number, required: true },
  hard: { type: Number, required: true },
  streak: { type: Number, required: true },
  consistencyScore: { type: Number, required: true },
  growthRate: { type: Number, required: true },
  weakTopics: [{ type: String }],
  strongTopics: [{ type: String }],
  fetchedAt: { type: Date, default: Date.now, index: true },
});

AnalyticsSnapshotSchema.index({ username: 1, snapshotDate: 1 }, { unique: true });

export default mongoose.model<IAnalyticsSnapshot>('AnalyticsSnapshot', AnalyticsSnapshotSchema);
