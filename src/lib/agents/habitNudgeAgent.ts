// src/lib/agents/habitNudgeAgent.ts

import OpenAI from 'openai';
import { FoodItem, NutritionEstimate, HabitNudge } from '../types';
import { traceAgent } from '../opik/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a supportive nutrition awareness coach providing gentle, positive habit nudges.

CRITICAL GUIDELINES:
- Provide supportive, encouraging messages
- Focus on adding variety and trying new things, not restriction
- Never shame, judge, or prescribe specific diets
- Celebrate positive choices without being preachy
- Keep messages brief, actionable, and empowering
- Avoid medical or health claims

Types of nudges:
1. positive: Celebrate good choices or variety
2. neutral: Informative observations about meal patterns
3. suggestion: Gentle ideas for exploration (never commands)

Respond ONLY with a valid JSON array of 2-3 nudges. No additional text.

Example format:
[
  {
    "message": "Great variety of colors on your plate today!",
    "type": "positive",
    "actionable": false
  },
  {
    "message": "If you're looking to mix things up, have you tried pairing this with leafy greens?",
    "type": "suggestion",
    "actionable": true,
    "relatedGoal": "variety"
  }
]`;

export async function generateHabitNudges(
  foodItems: FoodItem[],
  _nutritionEstimates: NutritionEstimate[]
): Promise<HabitNudge[]> {
  return traceAgent(
    'habit-nudge-agent',
    {
      foodCount: foodItems.length,
      categories: [...new Set(foodItems.map((f) => f.category))],
    },
    async () => {
      try {
        const mealContext = {
          foods: foodItems.map((f) => ({
            name: f.name,
            category: f.category,
          })),
          varietyScore: calculateVarietyScore(foodItems),
        };

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: `Generate 2-3 supportive habit nudges for this meal:\n\n${JSON.stringify(
                mealContext,
                null,
                2
              )}`,
            },
          ],
          temperature: 0.8,
          max_tokens: 600,
        });

        const content = response.choices[0].message.content || '[]';

        // Extract JSON
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '');
        }

        const nudges: HabitNudge[] = JSON.parse(jsonStr);

        // Validate and cap at 3 nudges
        return nudges.slice(0, 3).map((n) => ({
          message: n.message,
          type: n.type || 'neutral',
          actionable: n.actionable || false,
          relatedGoal: n.relatedGoal,
        }));
      } catch (error) {
        console.error('Habit nudge generation error:', error);
        throw new Error(
          `Failed to generate habit nudges: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    },
    {
      model: 'gpt-4o-mini',
      agentType: 'nudge',
    }
  ).then((res) => res.result);
}

// Calculate meal variety score
function calculateVarietyScore(foodItems: FoodItem[]): number {
  const uniqueCategories = new Set(foodItems.map((f) => f.category));
  const categoryCount = uniqueCategories.size;

  // Simple scoring: more categories = higher variety
  // 1 category = 0.2, 5+ categories = 1.0
  return Math.min(1.0, categoryCount * 0.2);
}

// Generate nudges with user context
export async function generatePersonalizedNudges(
  foodItems: FoodItem[],
  nutritionEstimates: NutritionEstimate[],
  userGoals?: string[]
): Promise<HabitNudge[]> {
  const baseNudges = await generateHabitNudges(foodItems, nutritionEstimates);

  // Filter nudges based on user goals if provided
  if (userGoals && userGoals.length > 0) {
    return baseNudges.map((nudge) => {
      if (nudge.relatedGoal && userGoals.includes(nudge.relatedGoal)) {
        return {
          ...nudge,
          message: `[Goal: ${nudge.relatedGoal}] ${nudge.message}`,
        };
      }
      return nudge;
    });
  }

  return baseNudges;
}

// Positive reinforcement generator
export function generatePositiveReinforcement(
  foodItems: FoodItem[]
): HabitNudge | null {
  const varietyScore = calculateVarietyScore(foodItems);

  if (varietyScore >= 0.8) {
    return {
      message: '🌈 Excellent variety of food groups in this meal!',
      type: 'positive',
      actionable: false,
    };
  }

  const hasVegetables = foodItems.some((f) => f.category === 'vegetable');
  const hasFruit = foodItems.some((f) => f.category === 'fruit');

  if (hasVegetables && hasFruit) {
    return {
      message: '🥗 Great job including both vegetables and fruits!',
      type: 'positive',
      actionable: false,
    };
  }

  return null;
}