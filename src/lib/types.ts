export interface FoodItem {
  name: string;
  confidence: number;
  category: string;
  portionSize?: string;
  preparationMethod?: string;
}

export interface NutritionEstimate {
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

export interface ReflectionPrompt {
  question: string;
  category: 'awareness' | 'goals' | 'habits' | 'alternatives';
  relevance: number;
}

export interface HabitNudge {
  message: string;
  type: 'positive' | 'neutral' | 'suggestion';
  actionable: boolean;
  relatedGoal?: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  foodItems: FoodItem[];
  nutritionEstimates: NutritionEstimate[];
  reflectionPrompts: ReflectionPrompt[];
  habitNudges: HabitNudge[];
  overallConfidence: number;
  warnings?: string[];
  imageUrl?: string;
}

export interface UserFeedback {
  analysisId: string;
  correctedFoods?: string[];
  correctedPortions?: string[];
  satisfactionScore?: number;
  comments?: string;
  timestamp: string;
}

export interface OpikTraceData {
  traceId: string;
  spanId: string;
  agentName: string;
  input: Record<string, unknown>;
  output: unknown;
  metadata: Record<string, unknown>;
  duration: number;
}

export interface EvaluationMetrics {
  hallucinationScore: number;
  clarityScore: number;
  toneScore: number;
  confidenceCalibration: number;
  overallQuality: number;
}

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface PipelineConfig {
  enableTracing: boolean;
  enableEvaluation: boolean;
  enableFeedbackLoop: boolean;
  confidenceThreshold: number;
}