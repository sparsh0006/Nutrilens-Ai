// src/components/FeedbackForm.tsx
'use client';

import { useState } from 'react';
import { FoodItem } from '@/lib/types';
import { Star } from 'lucide-react';

interface FeedbackFormProps {
  analysisId: string;
  foodItems: FoodItem[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function FeedbackForm({
  analysisId,
  foodItems,
  onSubmit,
  onCancel,
}: FeedbackFormProps) {
  const [satisfactionScore, setSatisfactionScore] = useState<number>(0);
  const [correctedFoods, setCorrectedFoods] = useState<string>('');
  const [correctedPortions, setCorrectedPortions] = useState<string>('');
  const [comments, setComments] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      satisfactionScore: satisfactionScore > 0 ? satisfactionScore : undefined,
      correctedFoods: correctedFoods.trim()
        ? correctedFoods.split(',').map((f) => f.trim())
        : undefined,
      correctedPortions: correctedPortions.trim()
        ? correctedPortions.split(',').map((p) => p.trim())
        : undefined,
      comments: comments.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Satisfaction Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How accurate was the analysis?
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setSatisfactionScore(rating)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Star
                className={`w-8 h-8 ${
                  rating <= satisfactionScore
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        {satisfactionScore > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {satisfactionScore === 1 && 'Not accurate at all'}
            {satisfactionScore === 2 && 'Somewhat inaccurate'}
            {satisfactionScore === 3 && 'Moderately accurate'}
            {satisfactionScore === 4 && 'Very accurate'}
            {satisfactionScore === 5 && 'Extremely accurate'}
          </p>
        )}
      </div>

      {/* Food Corrections */}
      <div>
        <label
          htmlFor="correctedFoods"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Were any foods incorrectly identified?
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Current foods: {foodItems.map((f) => f.name).join(', ')}
        </p>
        <input
          type="text"
          id="correctedFoods"
          value={correctedFoods}
          onChange={(e) => setCorrectedFoods(e.target.value)}
          placeholder="e.g., grilled salmon, brown rice, broccoli"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter the correct food names separated by commas
        </p>
      </div>

      {/* Portion Corrections */}
      <div>
        <label
          htmlFor="correctedPortions"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Were the portion sizes incorrect?
        </label>
        <input
          type="text"
          id="correctedPortions"
          value={correctedPortions}
          onChange={(e) => setCorrectedPortions(e.target.value)}
          placeholder="e.g., large portion, 200g, 1 cup"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Describe the correct portion sizes separated by commas
        </p>
      </div>

      {/* Additional Comments */}
      <div>
        <label
          htmlFor="comments"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Additional comments (optional)
        </label>
        <textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
          placeholder="Any other feedback about the analysis or suggestions for improvement..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          Submit Feedback
        </button>
      </div>
    </form>
  );
}