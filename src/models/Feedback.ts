// src/models/Feedback.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for Feedback document
export interface IFeedback extends Document {
  userId?: string;
  analysisId: string;
  satisfactionScore?: number;
  correctedFoods?: string[];
  correctedPortions?: string[];
  comments?: string;
  feedbackType: 'correction' | 'rating' | 'comment' | 'general';
  helpfulnessScore?: number;
  accuracyScore?: number;
  metadata?: {
    deviceType?: string;
    browserInfo?: string;
    responseTime?: number;
    opikTraceId?: string;
  };
  timestamp: Date;
  processed: boolean;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Feedback schema
const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: {
      type: String,
      index: true,
    },
    analysisId: {
      type: String,
      required: true,
      index: true,
      ref: 'Meal',
    },
    satisfactionScore: {
      type: Number,
      min: 1,
      max: 5,
    },
    correctedFoods: [
      {
        type: String,
        trim: true,
      },
    ],
    correctedPortions: [
      {
        type: String,
        trim: true,
      },
    ],
    comments: {
      type: String,
      maxlength: 2000,
      trim: true,
    },
    feedbackType: {
      type: String,
      required: true,
      enum: ['correction', 'rating', 'comment', 'general'],
      default: 'general',
    },
    helpfulnessScore: {
      type: Number,
      min: 1,
      max: 5,
    },
    accuracyScore: {
      type: Number,
      min: 1,
      max: 5,
    },
    metadata: {
      deviceType: { type: String },
      browserInfo: { type: String },
      responseTime: { type: Number },
      opikTraceId: { type: String },
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'feedbacks',
  }
);

// Indexes for efficient querying
FeedbackSchema.index({ analysisId: 1, timestamp: -1 });
FeedbackSchema.index({ userId: 1, timestamp: -1 });
FeedbackSchema.index({ processed: 1, timestamp: -1 });
FeedbackSchema.index({ feedbackType: 1 });
FeedbackSchema.index({ satisfactionScore: 1 });

// Middleware to determine feedback type automatically
FeedbackSchema.pre('save', function (next) {
  if (!this.feedbackType || this.feedbackType === 'general') {
    if (this.correctedFoods || this.correctedPortions) {
      this.feedbackType = 'correction';
    } else if (this.satisfactionScore) {
      this.feedbackType = 'rating';
    } else if (this.comments) {
      this.feedbackType = 'comment';
    }
  }
  next();
});

// Virtual for whether feedback has corrections
FeedbackSchema.virtual('hasCorrections').get(function (this: IFeedback) {
  return (
    (this.correctedFoods && this.correctedFoods.length > 0) ||
    (this.correctedPortions && this.correctedPortions.length > 0)
  );
});

// Virtual for overall sentiment
FeedbackSchema.virtual('sentiment').get(function (this: IFeedback) {
  if (!this.satisfactionScore) return 'neutral';
  if (this.satisfactionScore >= 4) return 'positive';
  if (this.satisfactionScore <= 2) return 'negative';
  return 'neutral';
});

// Instance methods
FeedbackSchema.methods.markAsProcessed = async function (this: IFeedback) {
  this.processed = true;
  this.processedAt = new Date();
  return this.save();
};

FeedbackSchema.methods.getSummary = function (this: IFeedback) {
  return {
    feedbackId: this._id,
    analysisId: this.analysisId,
    type: this.feedbackType,
    score: this.satisfactionScore,
    hasCorrections: this.hasCorrections,
    timestamp: this.timestamp,
  };
};

// Static methods
FeedbackSchema.statics.findByAnalysisId = function (analysisId: string) {
  return this.find({ analysisId }).sort({ timestamp: -1 });
};

FeedbackSchema.statics.findByUserId = function (
  userId: string,
  limit: number = 10
) {
  return this.find({ userId }).sort({ timestamp: -1 }).limit(limit);
};

FeedbackSchema.statics.findUnprocessed = function (limit: number = 100) {
  return this.find({ processed: false })
    .sort({ timestamp: 1 })
    .limit(limit);
};

FeedbackSchema.statics.getAverageSatisfaction = async function (
  fromDate?: Date
) {
  const match: any = { satisfactionScore: { $exists: true } };
  if (fromDate) {
    match.timestamp = { $gte: fromDate };
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        avgSatisfaction: { $avg: '$satisfactionScore' },
        count: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0
    ? {
        average: result[0].avgSatisfaction,
        count: result[0].count,
      }
    : { average: 0, count: 0 };
};

FeedbackSchema.statics.getCorrectionStats = async function (fromDate?: Date) {
  const match: any = { feedbackType: 'correction' };
  if (fromDate) {
    match.timestamp = { $gte: fromDate };
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $project: {
        hasFoodCorrections: {
          $gt: [{ $size: { $ifNull: ['$correctedFoods', []] } }, 0],
        },
        hasPortionCorrections: {
          $gt: [{ $size: { $ifNull: ['$correctedPortions', []] } }, 0],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalCorrections: { $sum: 1 },
        foodCorrections: {
          $sum: { $cond: ['$hasFoodCorrections', 1, 0] },
        },
        portionCorrections: {
          $sum: { $cond: ['$hasPortionCorrections', 1, 0] },
        },
      },
    },
  ]);

  return result.length > 0
    ? result[0]
    : {
        totalCorrections: 0,
        foodCorrections: 0,
        portionCorrections: 0,
      };
};

FeedbackSchema.statics.getFeedbackTrends = async function (days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
        },
        count: { $sum: 1 },
        avgSatisfaction: { $avg: '$satisfactionScore' },
        corrections: {
          $sum: { $cond: [{ $eq: ['$feedbackType', 'correction'] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Model type
interface FeedbackModel extends Model<IFeedback> {
  findByAnalysisId(analysisId: string): Promise<IFeedback[]>;
  findByUserId(userId: string, limit?: number): Promise<IFeedback[]>;
  findUnprocessed(limit?: number): Promise<IFeedback[]>;
  getAverageSatisfaction(fromDate?: Date): Promise<{
    average: number;
    count: number;
  }>;
  getCorrectionStats(fromDate?: Date): Promise<{
    totalCorrections: number;
    foodCorrections: number;
    portionCorrections: number;
  }>;
  getFeedbackTrends(days?: number): Promise<
    Array<{
      _id: string;
      count: number;
      avgSatisfaction: number;
      corrections: number;
    }>
  >;
}

// Create and export model
const Feedback =
  (mongoose.models.Feedback as FeedbackModel) ||
  mongoose.model<IFeedback, FeedbackModel>('Feedback', FeedbackSchema);

export default Feedback;