// src/models/Meal.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for FoodItem subdocument
export interface IFoodItem {
  name: string;
  confidence: number;
  category: string;
  portionSize?: string;
  preparationMethod?: string;
}

// Interface for NutritionEstimate subdocument
export interface INutritionEstimate {
  foodItem: string;
  calories: {
    min: number;
    max: number;
    confidence: number;
  };
  protein: {
    min: number;
    max: number;
    unit: string;
  };
  carbs: {
    min: number;
    max: number;
    unit: string;
  };
  fat: {
    min: number;
    max: number;
    unit: string;
  };
  fiber?: {
    min: number;
    max: number;
    unit: string;
  };
  variabilityFactors: string[];
}

// Interface for ReflectionPrompt subdocument
export interface IReflectionPrompt {
  question: string;
  category: 'awareness' | 'goals' | 'habits' | 'alternatives';
  relevance: number;
}

// Interface for HabitNudge subdocument
export interface IHabitNudge {
  message: string;
  type: 'positive' | 'neutral' | 'suggestion';
  actionable: boolean;
  relatedGoal?: string;
}

// Interface for Meal document
export interface IMeal extends Document {
  userId?: string;
  analysisId: string;
  timestamp: Date;
  imageUrl?: string;
  imageData?: string;
  foodItems: IFoodItem[];
  nutritionEstimates: INutritionEstimate[];
  reflectionPrompts: IReflectionPrompt[];
  habitNudges: IHabitNudge[];
  overallConfidence: number;
  warnings?: string[];
  metadata?: {
    processingTime?: number;
    modelVersion?: string;
    opikTraceId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Subdocument schemas
const FoodItemSchema = new Schema<IFoodItem>({
  name: { type: String, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  category: { type: String, required: true },
  portionSize: { type: String },
  preparationMethod: { type: String },
});

const NutritionEstimateSchema = new Schema<INutritionEstimate>({
  foodItem: { type: String, required: true },
  calories: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
  },
  protein: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    unit: { type: String, required: true, default: 'g' },
  },
  carbs: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    unit: { type: String, required: true, default: 'g' },
  },
  fat: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    unit: { type: String, required: true, default: 'g' },
  },
  fiber: {
    min: { type: Number },
    max: { type: Number },
    unit: { type: String, default: 'g' },
  },
  variabilityFactors: [{ type: String }],
});

const ReflectionPromptSchema = new Schema<IReflectionPrompt>({
  question: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['awareness', 'goals', 'habits', 'alternatives'],
  },
  relevance: { type: Number, required: true, min: 0, max: 1 },
});

const HabitNudgeSchema = new Schema<IHabitNudge>({
  message: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['positive', 'neutral', 'suggestion'],
  },
  actionable: { type: Boolean, required: true, default: false },
  relatedGoal: { type: String },
});

// Main Meal schema
const MealSchema = new Schema<IMeal>(
  {
    userId: {
      type: String,
      index: true,
    },
    analysisId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    imageUrl: {
      type: String,
    },
    imageData: {
      type: String,
      select: false, // Don't include by default in queries
    },
    foodItems: {
      type: [FoodItemSchema],
      required: true,
      validate: {
        validator: (items: IFoodItem[]) => items.length > 0,
        message: 'At least one food item is required',
      },
    },
    nutritionEstimates: {
      type: [NutritionEstimateSchema],
      required: true,
    },
    reflectionPrompts: {
      type: [ReflectionPromptSchema],
      default: [],
    },
    habitNudges: {
      type: [HabitNudgeSchema],
      default: [],
    },
    overallConfidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    warnings: [{ type: String }],
    metadata: {
      processingTime: { type: Number },
      modelVersion: { type: String },
      opikTraceId: { type: String },
    },
  },
  {
    timestamps: true,
    collection: 'meals',
  }
);

// Indexes for efficient querying
MealSchema.index({ userId: 1, timestamp: -1 });
MealSchema.index({ analysisId: 1 });
MealSchema.index({ createdAt: -1 });

// Virtual for total calories
MealSchema.virtual('totalCalories').get(function (this: IMeal) {
  return this.nutritionEstimates.reduce(
    (acc, est) => ({
      min: acc.min + est.calories.min,
      max: acc.max + est.calories.max,
    }),
    { min: 0, max: 0 }
  );
});

// Instance methods
MealSchema.methods.getSummary = function (this: IMeal) {
  return {
    analysisId: this.analysisId,
    foodCount: this.foodItems.length,
    confidence: this.overallConfidence,
    timestamp: this.timestamp,
  };
};

// Static methods
MealSchema.statics.findByUserId = function (
  userId: string,
  limit: number = 10
) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('-imageData');
};

MealSchema.statics.findByAnalysisId = function (analysisId: string) {
  return this.findOne({ analysisId }).select('-imageData');
};

MealSchema.statics.getRecentMeals = function (days: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.find({ timestamp: { $gte: cutoffDate } })
    .sort({ timestamp: -1 })
    .select('-imageData');
};

// Model type
interface MealModel extends Model<IMeal> {
  findByUserId(userId: string, limit?: number): Promise<IMeal[]>;
  findByAnalysisId(analysisId: string): Promise<IMeal | null>;
  getRecentMeals(days?: number): Promise<IMeal[]>;
}

// Create and export model
const Meal =
  (mongoose.models.Meal as MealModel) ||
  mongoose.model<IMeal, MealModel>('Meal', MealSchema);

export default Meal;