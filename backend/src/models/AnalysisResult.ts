import mongoose, { Schema, Document } from 'mongoose';

export interface ITopicStat {
  topic: string;
  count: number;
  percentage: number;
}

export interface IActivityData {
  date: string;
  count: number;
}

export interface IAnalysisResult extends Document {
  username: string;
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  streak: number;
  topics: ITopicStat[];
  strongestTopic: string;
  weakestTopic: string;
  activityData: IActivityData[];
  suggestions: string[];
  fetchedAt: Date;
}

const TopicStatSchema = new Schema<ITopicStat>({
  topic: String,
  count: Number,
  percentage: Number,
});

const ActivityDataSchema = new Schema<IActivityData>({
  date: String,
  count: Number,
});

const AnalysisResultSchema = new Schema<IAnalysisResult>({
  username: { type: String, required: true, index: true },
  totalSolved: Number,
  easy: Number,
  medium: Number,
  hard: Number,
  streak: Number,
  topics: [TopicStatSchema],
  strongestTopic: String,
  weakestTopic: String,
  activityData: [ActivityDataSchema],
  suggestions: [String],
  fetchedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IAnalysisResult>('AnalysisResult', AnalysisResultSchema);
