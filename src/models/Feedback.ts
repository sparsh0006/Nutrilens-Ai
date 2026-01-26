import mongoose, {
  Schema,
  Model,
  HydratedDocument,
} from 'mongoose';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type FeedbackType =
  | 'correction'
  | 'rating'
  | 'comment'
  | 'general';

export interface FeedbackMetadata {
  deviceType?: string;
  browserInfo?: string;
  responseTime?: number;
  opikTraceId?: string;
}

export interface FeedbackProps {
  userId?: string;
  analysisId: string;
  satisfactionScore?: number;
  correctedFoods?: string[];
  correctedPortions?: string[];
  comments?: string;
  feedbackType: FeedbackType;
  helpfulnessScore?: number;
  accuracyScore?: number;
  metadata?: FeedbackMetadata;
  timestamp: Date;
  processed: boolean;
  processedAt?: Date;
}

/* -------------------------------------------------------------------------- */
/*                            Instance Methods Types                          */
/* -------------------------------------------------------------------------- */

interface FeedbackMethods {
  markAsProcessed(): Promise<HydratedDocument<FeedbackProps, FeedbackMethods>>;
  getSummary(): {
    feedbackId: mongoose.Types.ObjectId;
    analysisId: string;
    type: FeedbackType;
    score: number | undefined;
    hasCorrections: boolean;
    timestamp: Date;
  };
}

/* -------------------------------------------------------------------------- */
/*                               Static Methods                               */
/* -------------------------------------------------------------------------- */

interface FeedbackModel extends Model<FeedbackProps, object, FeedbackMethods> {
  findByAnalysisId(
    analysisId: string
  ): Promise<HydratedDocument<FeedbackProps, FeedbackMethods>[]>;
}

/* -------------------------------------------------------------------------- */
/*                                   Schema                                   */
/* -------------------------------------------------------------------------- */

const FeedbackSchema = new Schema<FeedbackProps, FeedbackModel, FeedbackMethods>(
  {
    userId: { type: String, index: true },

    analysisId: {
      type: String,
      required: true,
      index: true,
      ref: 'Meal',
    },

    satisfactionScore: { type: Number, min: 1, max: 5 },

    correctedFoods: [{ type: String, trim: true }],
    correctedPortions: [{ type: String, trim: true }],

    comments: {
      type: String,
      maxlength: 2000,
      trim: true,
    },

    feedbackType: {
      type: String,
      enum: ['correction', 'rating', 'comment', 'general'],
      default: 'general',
      required: true,
    },

    helpfulnessScore: { type: Number, min: 1, max: 5 },
    accuracyScore: { type: Number, min: 1, max: 5 },

    metadata: {
      deviceType: String,
      browserInfo: String,
      responseTime: Number,
      opikTraceId: String,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    processed: {
      type: Boolean,
      default: false,
      index: true,
    },

    processedAt: Date,
  },
  {
    timestamps: true,
    collection: 'feedbacks',
  }
);

/* -------------------------------------------------------------------------- */
/*                                  Indexes                                   */
/* -------------------------------------------------------------------------- */

FeedbackSchema.index({ analysisId: 1, timestamp: -1 });
FeedbackSchema.index({ userId: 1, timestamp: -1 });
FeedbackSchema.index({ processed: 1, timestamp: -1 });
FeedbackSchema.index({ feedbackType: 1 });
FeedbackSchema.index({ satisfactionScore: 1 });

/* -------------------------------------------------------------------------- */
/*                                 Middleware                                 */
/* -------------------------------------------------------------------------- */
/**
 * IMPORTANT:
 * Mongoose v9 → use async middleware for `save`
 * No `next`, no options object
 */
FeedbackSchema.pre('save', async function () {
  if (!this.feedbackType || this.feedbackType === 'general') {
    if (
      (this.correctedFoods?.length ?? 0) > 0 ||
      (this.correctedPortions?.length ?? 0) > 0
    ) {
      this.feedbackType = 'correction';
    } else if (this.satisfactionScore) {
      this.feedbackType = 'rating';
    } else if (this.comments) {
      this.feedbackType = 'comment';
    }
  }
});

/* -------------------------------------------------------------------------- */
/*                                  Virtuals                                  */
/* -------------------------------------------------------------------------- */

FeedbackSchema.virtual('hasCorrections').get(function () {
  return (
    (this.correctedFoods?.length ?? 0) > 0 ||
    (this.correctedPortions?.length ?? 0) > 0
  );
});

FeedbackSchema.virtual('sentiment').get(function () {
  if (!this.satisfactionScore) return 'neutral';
  if (this.satisfactionScore >= 4) return 'positive';
  if (this.satisfactionScore <= 2) return 'negative';
  return 'neutral';
});

/* -------------------------------------------------------------------------- */
/*                              Instance Methods                              */
/* -------------------------------------------------------------------------- */

FeedbackSchema.methods.markAsProcessed = async function () {
  this.processed = true;
  this.processedAt = new Date();
  return this.save();
};

FeedbackSchema.methods.getSummary = function () {
  return {
    feedbackId: this._id,
    analysisId: this.analysisId,
    type: this.feedbackType,
    score: this.satisfactionScore,
    hasCorrections: this.get('hasCorrections') as boolean,
    timestamp: this.timestamp,
  };
};

/* -------------------------------------------------------------------------- */
/*                               Static Methods                               */
/* -------------------------------------------------------------------------- */

FeedbackSchema.statics.findByAnalysisId = function (analysisId: string) {
  return this.find({ analysisId }).sort({ timestamp: -1 });
};

/* -------------------------------------------------------------------------- */
/*                                   Model                                    */
/* -------------------------------------------------------------------------- */

const Feedback =
  (mongoose.models.Feedback as FeedbackModel) ??
  mongoose.model<FeedbackProps, FeedbackModel>('Feedback', FeedbackSchema);

export default Feedback;