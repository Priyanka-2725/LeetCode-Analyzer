import mongoose, { Document, Schema } from 'mongoose';

export type SubmissionDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Unknown';

export interface ISubmissionEvent extends Document {
  username: string;
  submissionId: string;
  title: string;
  titleSlug: string;
  difficulty: SubmissionDifficulty;
  topics: string[];
  timestamp: number;
  submittedAt: Date;
  ingestedAt: Date;
}

const SubmissionEventSchema = new Schema<ISubmissionEvent>({
  username: { type: String, required: true, index: true },
  submissionId: { type: String, required: true },
  title: { type: String, required: true },
  titleSlug: { type: String, required: true, index: true },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Unknown'],
    default: 'Unknown',
    required: true,
  },
  topics: [{ type: String }],
  timestamp: { type: Number, required: true, index: true },
  submittedAt: { type: Date, required: true, index: true },
  ingestedAt: { type: Date, default: Date.now, index: true },
});

SubmissionEventSchema.index({ username: 1, submissionId: 1 }, { unique: true });

export default mongoose.model<ISubmissionEvent>('SubmissionEvent', SubmissionEventSchema);
