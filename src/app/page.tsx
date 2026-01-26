// src/app/page.tsx
'use client';

import { useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import NutritionResults from '@/components/NutritionResults';
import ReflectionPrompts from '@/components/ReflectionPrompts';
import FeedbackForm from '@/components/FeedbackForm';
import { AnalysisResult } from '@/lib/types';
import { Loader2, Info } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface FeedbackData {
  satisfactionScore?: number;
  correctedFoods?: string[];
  correctedPortions?: string[];
  comments?: string;
}

export default function Home() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleImageUpload = async (imageData: string) => {
    setAnalyzing(true);
    setResult(null);
    setShowFeedback(false);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      if (data.warnings && data.warnings.length > 0) {
        data.warnings.forEach((warning: string) => {
          toast(warning, { icon: '⚠️', duration: 5000 });
        });
      }

      setResult(data.analysis);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to analyze image'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFeedbackSubmit = async (feedbackData: FeedbackData) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisId: result?.id,
          ...feedbackData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast.success('Thank you for your feedback!');
      setShowFeedback(false);
    } catch (_error) {
      toast.error('Failed to submit feedback');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Toaster position="top-right" />

      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🍎 NutriLens AI
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Visual Nutrition Awareness with AI
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Info className="w-4 h-4" />
              <span>Powered by Opik Evaluation</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">
                How NutriLens AI Works
              </p>
              <p>
                Upload a photo of your meal, and our AI will identify foods,
                provide nutrition range estimates (not exact values), and offer
                reflective prompts to help build awareness. This tool is for
                educational purposes and does not provide medical or dietary
                advice.
              </p>
            </div>
          </div>
        </div>

        {!result && (
          <div className="max-w-2xl mx-auto">
            <ImageUpload onUpload={handleImageUpload} disabled={analyzing} />

            {analyzing && (
              <div className="mt-8 flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
                <p className="text-lg font-medium text-gray-700">
                  Analyzing your meal...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Running multi-agent pipeline with evaluation
                </p>
              </div>
            )}
          </div>
        )}

        {result && !analyzing && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Analysis Results
              </h2>
              <button
                onClick={() => {
                  setResult(null);
                  setShowFeedback(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Analyze Another Meal
              </button>
            </div>

            <NutritionResults result={result} />

            <ReflectionPrompts
              prompts={result.reflectionPrompts}
              nudges={result.habitNudges}
            />

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Help Us Improve
                </h3>
                {!showFeedback && (
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Provide Feedback
                  </button>
                )}
              </div>

              {showFeedback && (
                <FeedbackForm
                  analysisId={result.id}
                  foodItems={result.foodItems}
                  onSubmit={handleFeedbackSubmit}
                  onCancel={() => setShowFeedback(false)}
                />
              )}

              {!showFeedback && (
                <p className="text-sm text-gray-600">
                  Your feedback helps us improve our AI models and provide
                  better nutrition awareness.
                </p>
              )}
            </div>

            <div className="text-center text-xs text-gray-500 mt-8">
              <p>
                Confidence Score: {(result.overallConfidence * 100).toFixed(0)}%
              </p>
              <p className="mt-1">
                Analysis ID: {result.id}
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-600">
            NutriLens AI is for educational purposes only and does not provide
            medical, dietary, or nutritional advice.
          </p>
          <p className="text-center text-xs text-gray-500 mt-2">
            Built with Next.js, OpenAI, and Opik by Comet
          </p>
        </div>
      </footer>
    </div>
  );
}