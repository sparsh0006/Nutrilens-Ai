// src/lib/agents/foodRecognitionAgent.ts

import OpenAI from 'openai';
import { FoodItem } from '../types';
import { traceAgent } from '../opik/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert food recognition AI. Analyze meal images and identify all food items visible.

For each food item, provide:
1. Name of the food
2. Confidence level (0-1) in your identification
3. Food category (protein, carbohydrate, vegetable, fruit, dairy, etc.)
4. Estimated portion size if visible (small, medium, large, or specific measurements)
5. Preparation method if identifiable (fried, baked, grilled, raw, etc.)

IMPORTANT GUIDELINES:
- Be honest about uncertainty. If you're not sure, lower the confidence score.
- Consider that similar-looking foods can have very different nutritional profiles.
- Note any ambiguity in portion sizes or preparation methods.
- Do not make assumptions beyond what is visible in the image.

Respond ONLY with a valid JSON array of food items. No additional text.

Example format:
[
  {
    "name": "Grilled chicken breast",
    "confidence": 0.85,
    "category": "protein",
    "portionSize": "medium (approximately 150g)",
    "preparationMethod": "grilled"
  }
]`;

export async function recognizeFood(
  imageBase64: string
): Promise<FoodItem[]> {
  return traceAgent(
    'food-recognition-agent',
    { imageProvided: true },
    async () => {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Please analyze this meal image and identify all food items.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        });

        const content = response.choices[0].message.content || '[]';

        // Extract JSON from response (handles markdown code blocks)
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '');
        }

        const foodItems: FoodItem[] = JSON.parse(jsonStr);

        // Validate and sanitize
        return foodItems.map((item) => ({
          name: item.name || 'Unknown food',
          confidence: Math.max(0, Math.min(1, item.confidence || 0)),
          category: item.category || 'unknown',
          portionSize: item.portionSize,
          preparationMethod: item.preparationMethod,
        }));
      } catch (error) {
        console.error('Food recognition error:', error);
        throw new Error(
          `Failed to recognize food: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    },
    {
      model: 'gpt-4o',
      agentType: 'vision',
    }
  ).then((res) => res.result);
}

// Enhanced recognition with confidence thresholds
export async function recognizeFoodWithValidation(
  imageBase64: string,
  minConfidence: number = 0.3
): Promise<{
  recognizedItems: FoodItem[];
  lowConfidenceItems: FoodItem[];
  warnings: string[];
}> {
  const allItems = await recognizeFood(imageBase64);

  const recognizedItems = allItems.filter(
    (item) => item.confidence >= minConfidence
  );

  const lowConfidenceItems = allItems.filter(
    (item) => item.confidence < minConfidence
  );

  const warnings: string[] = [];

  if (lowConfidenceItems.length > 0) {
    warnings.push(
      `${lowConfidenceItems.length} food item(s) detected with low confidence. Results may be less accurate.`
    );
  }

  if (recognizedItems.length === 0 && allItems.length > 0) {
    warnings.push(
      'All detected items have low confidence. Consider uploading a clearer image.'
    );
  }

  if (allItems.length === 0) {
    warnings.push('No food items detected in the image.');
  }

  return {
    recognizedItems,
    lowConfidenceItems,
    warnings,
  };
}