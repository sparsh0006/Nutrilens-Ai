// src/app/api/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { recognizeFoodWithValidation } from '@/lib/agents/foodRecognitionAgent';
import { estimateNutrition, calculateTotalNutrition } from '@/lib/agents/nutritionEstimationAgent';
import { generateReflectionPrompts } from '@/lib/agents/reflectionAgent';
import { generateHabitNudges, generatePositiveReinforcement } from '@/lib/agents/habitNudgeAgent';
import { evaluateAnalysis } from '@/lib/opik/evaluators';
import { batchTrace } from '@/lib/opik/client';
import { AnalysisResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    // Step 1: Food Recognition
    const { recognizedItems, lowConfidenceItems, warnings } =
      await recognizeFoodWithValidation(base64Image, 0.3);

    if (recognizedItems.length === 0) {
      return NextResponse.json(
        {
          error: 'No food items could be recognized with sufficient confidence',
          warnings,
        },
        { status: 422 }
      );
    }

    // Step 2: Nutrition Estimation
    const nutritionEstimates = await estimateNutrition(recognizedItems);

    // Step 3: Reflection Prompts
    const reflectionPrompts = await generateReflectionPrompts(
      recognizedItems,
      nutritionEstimates
    );

    // Step 4: Habit Nudges
    const habitNudges = await generateHabitNudges(
      recognizedItems,
      nutritionEstimates
    );

    // Add positive reinforcement if applicable
    const positiveNudge = generatePositiveReinforcement(recognizedItems);
    if (positiveNudge) {
      habitNudges.unshift(positiveNudge);
    }

    // Calculate overall confidence
    const overallConfidence =
      recognizedItems.reduce((sum, item) => sum + item.confidence, 0) /
      recognizedItems.length;

    // Calculate totals
    const totals = calculateTotalNutrition(nutritionEstimates);

    // Create analysis result
    const analysisResult: AnalysisResult = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      foodItems: recognizedItems,
      nutritionEstimates,
      reflectionPrompts,
      habitNudges,
      overallConfidence,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    // Step 5: Evaluation (async, non-blocking)
    evaluateAndLog(analysisResult).catch((err) =>
      console.error('Evaluation error:', err)
    );

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      totals,
      lowConfidenceItems:
        lowConfidenceItems.length > 0 ? lowConfidenceItems : undefined,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Async evaluation function
async function evaluateAndLog(analysis: AnalysisResult) {
  try {
    // Prepare evaluation input
    const input = `Analyze nutrition for: ${analysis.foodItems
      .map((f) => f.name)
      .join(', ')}`;

    const output = JSON.stringify({
      nutrition: analysis.nutritionEstimates,
      reflections: analysis.reflectionPrompts,
      nudges: analysis.habitNudges,
    });

    // Run evaluation
    const metrics = await evaluateAnalysis(input, output);

    // Log to Opik
    await batchTrace([
      {
        name: 'analysis-evaluation',
        input: { analysisId: analysis.id },
        output: { metrics },
        metadata: {
          overallConfidence: analysis.overallConfidence,
          foodCount: analysis.foodItems.length,
          hasWarnings: !!analysis.warnings,
        },
      },
    ]);

    console.log('Evaluation metrics:', metrics);
  } catch (error) {
    console.error('Evaluation logging error:', error);
  }
}