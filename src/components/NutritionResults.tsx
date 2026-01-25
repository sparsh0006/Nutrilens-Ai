// src/components/NutritionResults.tsx
'use client';

import { AnalysisResult, NutritionEstimate } from '@/lib/types';
import { AlertCircle, Beef, Wheat, Droplet, TrendingUp } from 'lucide-react';

interface NutritionResultsProps {
  result: AnalysisResult;
}

export default function NutritionResults({ result }: NutritionResultsProps) {
  const totalCalories = result.nutritionEstimates.reduce(
    (acc, est) => ({
      min: acc.min + est.calories.min,
      max: acc.max + est.calories.max,
    }),
    { min: 0, max: 0 }
  );

  const totalProtein = result.nutritionEstimates.reduce(
    (acc, est) => ({
      min: acc.min + est.protein.min,
      max: acc.max + est.protein.max,
    }),
    { min: 0, max: 0 }
  );

  const totalCarbs = result.nutritionEstimates.reduce(
    (acc, est) => ({
      min: acc.min + est.carbs.min,
      max: acc.max + est.carbs.max,
    }),
    { min: 0, max: 0 }
  );

  const totalFat = result.nutritionEstimates.reduce(
    (acc, est) => ({
      min: acc.min + est.fat.min,
      max: acc.max + est.fat.max,
    }),
    { min: 0, max: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Important Notes
              </p>
              <ul className="space-y-1">
                {result.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm text-yellow-700">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Meal Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Meal Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NutrientCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Calories"
            min={totalCalories.min}
            max={totalCalories.max}
            unit="kcal"
            color="blue"
          />
          <NutrientCard
            icon={<Beef className="w-5 h-5" />}
            label="Protein"
            min={totalProtein.min}
            max={totalProtein.max}
            unit="g"
            color="red"
          />
          <NutrientCard
            icon={<Wheat className="w-5 h-5" />}
            label="Carbs"
            min={totalCarbs.min}
            max={totalCarbs.max}
            unit="g"
            color="yellow"
          />
          <NutrientCard
            icon={<Droplet className="w-5 h-5" />}
            label="Fat"
            min={totalFat.min}
            max={totalFat.max}
            unit="g"
            color="green"
          />
        </div>
      </div>

      {/* Individual Food Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Identified Foods
        </h3>
        <div className="space-y-4">
          {result.nutritionEstimates.map((estimate, idx) => (
            <FoodItemCard key={idx} estimate={estimate} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface NutrientCardProps {
  icon: React.ReactNode;
  label: string;
  min: number;
  max: number;
  unit: string;
  color: 'blue' | 'red' | 'yellow' | 'green';
}

function NutrientCard({ icon, label, min, max, unit, color }: NutrientCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">
        {Math.round(min)}-{Math.round(max)}
      </p>
      <p className="text-xs opacity-75">{unit}</p>
    </div>
  );
}

interface FoodItemCardProps {
  estimate: NutritionEstimate;
}

function FoodItemCard({ estimate }: FoodItemCardProps) {
  const avgConfidence = estimate.calories.confidence;
  const confidenceColor =
    avgConfidence >= 0.7
      ? 'text-green-600'
      : avgConfidence >= 0.4
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{estimate.foodItem}</h4>
          <p className={`text-xs ${confidenceColor} mt-1`}>
            Confidence: {(avgConfidence * 100).toFixed(0)}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">
            {estimate.calories.min}-{estimate.calories.max} kcal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Protein</p>
          <p className="text-sm font-medium text-gray-900">
            {estimate.protein.min}-{estimate.protein.max}g
          </p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Carbs</p>
          <p className="text-sm font-medium text-gray-900">
            {estimate.carbs.min}-{estimate.carbs.max}g
          </p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Fat</p>
          <p className="text-sm font-medium text-gray-900">
            {estimate.fat.min}-{estimate.fat.max}g
          </p>
        </div>
      </div>

      {estimate.variabilityFactors && estimate.variabilityFactors.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Factors affecting estimates:
          </p>
          <ul className="space-y-1">
            {estimate.variabilityFactors.map((factor, idx) => (
              <li key={idx} className="text-xs text-gray-500">
                • {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}