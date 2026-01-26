// src/app/api/feedback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { logFeedback } from '@/lib/opik/client';
import { UserFeedback } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      analysisId,
      correctedFoods,
      correctedPortions,
      satisfactionScore,
      comments,
    } = body;

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    const _feedback: UserFeedback = {
      analysisId,
      correctedFoods,
      correctedPortions,
      satisfactionScore,
      comments,
      timestamp: new Date().toISOString(),
    };

    // Log feedback to Opik
    await logFeedback(analysisId, {
      score: satisfactionScore,
      corrections: {
        foods: correctedFoods,
        portions: correctedPortions,
      },
      comments,
    });

    // Note: In production, you would also save to MongoDB here
    // await saveFeedbackToDatabase(_feedback);

    return NextResponse.json({
      success: true,
      message: 'Feedback received successfully',
      feedbackId: `feedback_${Date.now()}`,
    });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    // In production, retrieve from MongoDB
    // const feedback = await getFeedbackFromDatabase(analysisId);

    return NextResponse.json({
      success: true,
      feedback: null, // Replace with actual data
    });
  } catch (error) {
    console.error('Feedback retrieval error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve feedback',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}