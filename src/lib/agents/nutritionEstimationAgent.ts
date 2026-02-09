import OpenAI from 'openai';
import { trackOpenAI } from 'opik-openai';
import { FoodItem, NutritionEstimate } from '../types';
import { opikClient } from '../opik/client';

const SYSTEM_PROMPT = `You are an expert nutritionist providing nutrition range estimates for food items.

CRITICAL GUIDELINES:
- Provide RANGES, not exact values, to reflect uncertainty
- Explain variability factors (portion size, preparation method, ingredients)
- Never claim medical accuracy or prescribe dietary advice
- Be transparent about limitations and assumptions
- Consider typical preparation variations for each food

For each food item, provide:
1. Calorie range (min-max) with confidence level
2. Protein range (g)
3. Carbohydrate range (g)
4. Fat range (g)
5. Fiber range (g) if applicable
6. List of variability factors affecting the estimates

Respond ONLY with a valid JSON array. No additional text.

Example format:
[
  {
    "foodItem": "Grilled chicken breast",
    "calories": {
      "min": 140,
      "max": 180,
      "confidence": 0.8
    },
    "protein": {
      "min": 26,
      "max": 31,
      "unit": "g"
    },
    "carbs": {
      "min": 0,
      "max": 0,
      "unit": "g"
    },
    "fat": {
      "min": 3,
      "max": 5,
      "unit": "g"
    },
    "fiber": {
      "min": 0,
      "max": 0,
      "unit": "g"
    },
    "variabilityFactors": [
      "Portion size estimated as medium (150g)",
      "Cooking method affects fat content",
      "Skin-on vs skinless changes calories significantly"
    ]
  }
]`;

export async function estimateNutrition(
  foodItems: FoodItem[]
): Promise<NutritionEstimate[]> {
  // Create a parent trace for this agent
  const trace = opikClient.trace({
    name: 'nutrition-estimation-agent',
    input: { data: { foodItems: foodItems.map((f) => f.name) } },
    metadata: {
      model: 'gpt-4o-mini',
      agentType: 'analysis',
      timestamp: new Date().toISOString(),
      agent: 'nutrition-estimation-agent',
    },
  });

  const startTime = Date.now();

  try {
    // Create a tracked OpenAI client with this trace as parent
    const openai = trackOpenAI(
      new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      {
        client: opikClient,
        parent: trace,
        generationName: 'nutrition-estimation-llm-call',
      }
    );

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Provide nutrition estimates for these food items:\n\n${JSON.stringify(
            foodItems,
            null,
            2
          )}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content || '[]';

    // Extract JSON
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }

    const estimates: NutritionEstimate[] = JSON.parse(jsonStr);

    // Validate ranges
    const result = estimates.map((est) => ({
      ...est,
      calories: {
        min: Math.max(0, est.calories.min),
        max: Math.max(est.calories.min, est.calories.max),
        confidence: Math.max(0, Math.min(1, est.calories.confidence)),
      },
      protein: {
        min: Math.max(0, est.protein.min),
        max: Math.max(est.protein.min, est.protein.max),
        unit: est.protein.unit || 'g',
      },
      carbs: {
        min: Math.max(0, est.carbs.min),
        max: Math.max(est.carbs.min, est.carbs.max),
        unit: est.carbs.unit || 'g',
      },
      fat: {
        min: Math.max(0, est.fat.min),
        max: Math.max(est.fat.min, est.fat.max),
        unit: est.fat.unit || 'g',
      },
      variabilityFactors: est.variabilityFactors || [],
    }));

    const duration = Date.now() - startTime;

    trace.update({
      output: { data: result },
      metadata: {
        model: 'gpt-4o-mini',
        agentType: 'analysis',
        duration,
        status: 'success',
        estimateCount: result.length,
      },
    });
    trace.end();
    await opikClient.flush();

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    trace.update({
      output: { error: error instanceof Error ? error.message : 'Unknown error' },
      metadata: {
        model: 'gpt-4o-mini',
        agentType: 'analysis',
        duration,
        status: 'error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      },
    });
    trace.end();
    await opikClient.flush();

    console.error('Nutrition estimation error:', error);
    throw new Error(
      `Failed to estimate nutrition: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

// Calculate total nutrition with uncertainty
export function calculateTotalNutrition(
  estimates: NutritionEstimate[]
): {
  totalCalories: { min: number; max: number };
  totalProtein: { min: number; max: number };
  totalCarbs: { min: number; max: number };
  totalFat: { min: number; max: number };
  averageConfidence: number;
} {
  const totals = estimates.reduce(
    (acc, est) => ({
      caloriesMin: acc.caloriesMin + est.calories.min,
      caloriesMax: acc.caloriesMax + est.calories.max,
      proteinMin: acc.proteinMin + est.protein.min,
      proteinMax: acc.proteinMax + est.protein.max,
      carbsMin: acc.carbsMin + est.carbs.min,
      carbsMax: acc.carbsMax + est.carbs.max,
      fatMin: acc.fatMin + est.fat.min,
      fatMax: acc.fatMax + est.fat.max,
      confidenceSum: acc.confidenceSum + est.calories.confidence,
    }),
    {
      caloriesMin: 0,
      caloriesMax: 0,
      proteinMin: 0,
      proteinMax: 0,
      carbsMin: 0,
      carbsMax: 0,
      fatMin: 0,
      fatMax: 0,
      confidenceSum: 0,
    }
  );

  return {
    totalCalories: { min: totals.caloriesMin, max: totals.caloriesMax },
    totalProtein: { min: totals.proteinMin, max: totals.proteinMax },
    totalCarbs: { min: totals.carbsMin, max: totals.carbsMax },
    totalFat: { min: totals.fatMin, max: totals.fatMax },
    averageConfidence:
      estimates.length > 0 ? totals.confidenceSum / estimates.length : 0,
  };
}