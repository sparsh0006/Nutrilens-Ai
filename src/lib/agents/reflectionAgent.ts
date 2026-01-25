// src/lib/agents/reflectionAgent.ts

import OpenAI from 'openai';
import { FoodItem, NutritionEstimate, ReflectionPrompt } from '../types';
import { traceAgent } from '../opik/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a thoughtful nutrition awareness coach. Generate reflective prompts that help users develop healthier awareness without being prescriptive or judgmental.

CRITICAL GUIDELINES:
- Focus on AWARENESS and REFLECTION, not prescription
- Ask open-ended questions that encourage self-discovery
- Never tell users what to eat or avoid
- Support autonomy and personal choice
- Be kind, non-judgmental, and empowering
- Avoid triggering language around dieting or restriction

Categories of prompts:
1. awareness: Questions about current eating patterns and feelings
2. goals: Questions about personal health and wellness intentions
3. habits: Questions about eating contexts and routines
4. alternatives: Exploratory questions about variety and options

Respond ONLY with a valid JSON array of 3-5 prompts. No additional text.

Example format:
[
  {
    "question": "What drew you to this meal today?",
    "category": "awareness",
    "relevance": 0.9
  },
  {
    "question": "How do you typically feel after eating meals like this?",
    "category": "awareness",
    "relevance": 0.85
  }
]`;

export async function generateReflectionPrompts(
  foodItems: FoodItem[],
  nutritionEstimates: NutritionEstimate[]
): Promise<ReflectionPrompt[]> {
  return traceAgent(
    'reflection-agent',
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
          nutritionSummary: nutritionEstimates.map((n) => ({
            food: n.foodItem,
            calorieRange: `${n.calories.min}-${n.calories.max}`,
          })),
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
              content: `Generate 3-5 reflective prompts for someone who just ate:\n\n${JSON.stringify(
                mealContext,
                null,
                2
              )}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        });

        const content = response.choices[0].message.content || '[]';

        // Extract JSON
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '');
        }

        const prompts: ReflectionPrompt[] = JSON.parse(jsonStr);

        // Validate and cap at 5 prompts
        return prompts.slice(0, 5).map((p) => ({
          question: p.question,
          category: p.category || 'awareness',
          relevance: Math.max(0, Math.min(1, p.relevance || 0.5)),
        }));
      } catch (error) {
        console.error('Reflection generation error:', error);
        throw new Error(
          `Failed to generate reflection prompts: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    },
    {
      model: 'gpt-4o-mini',
      agentType: 'reflection',
    }
  ).then((res) => res.result);
}

// Generate contextual prompts based on meal characteristics
export async function generateContextualPrompts(
  foodItems: FoodItem[],
  nutritionEstimates: NutritionEstimate[],
  timeOfDay?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<ReflectionPrompt[]> {
  const basePrompts = await generateReflectionPrompts(
    foodItems,
    nutritionEstimates
  );

  // Add time-specific prompts if provided
  const timeSpecificPrompts: ReflectionPrompt[] = [];

  if (timeOfDay === 'breakfast') {
    timeSpecificPrompts.push({
      question: 'How does this breakfast make you feel ready for your day?',
      category: 'awareness',
      relevance: 0.8,
    });
  } else if (timeOfDay === 'dinner') {
    timeSpecificPrompts.push({
      question:
        'What role does this evening meal play in your daily routine?',
      category: 'habits',
      relevance: 0.8,
    });
  }

  return [...basePrompts, ...timeSpecificPrompts].slice(0, 5);
}