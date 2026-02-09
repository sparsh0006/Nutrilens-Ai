'use client';

import { ReflectionPrompt, HabitNudge } from '@/lib/types';
import { MessageCircle, Heart, Target, Lightbulb, Sparkles } from 'lucide-react';

interface ReflectionPromptsProps {
  prompts: ReflectionPrompt[];
  nudges: HabitNudge[];
}

export default function ReflectionPrompts({ prompts, nudges }: ReflectionPromptsProps) {
  const categoryIcons = {
    awareness: <MessageCircle className="w-5 h-5" />,
    goals: <Target className="w-5 h-5" />,
    habits: <Heart className="w-5 h-5" />,
    alternatives: <Lightbulb className="w-5 h-5" />,
  };

  return (
    <div className="space-y-6">
      {/* Habit Nudges */}
      {nudges.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-sm border border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Gentle Nudges
            </h3>
          </div>
          <div className="space-y-3">
            {nudges.map((nudge, idx) => (
              <NudgeCard key={idx} nudge={nudge} />
            ))}
          </div>
        </div>
      )}

      {/* Reflection Prompts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Reflection Questions
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Take a moment to think about these questions. There are no right or wrong answers.
        </p>
        <div className="space-y-4">
          {prompts.map((prompt, idx) => (
            <PromptCard
              key={idx}
              prompt={prompt}
              icon={categoryIcons[prompt.category]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface NudgeCardProps {
  nudge: HabitNudge;
}

function NudgeCard({ nudge }: NudgeCardProps) {
  const typeStyles = {
    positive: 'bg-green-50 border-green-200 text-green-800',
    neutral: 'bg-blue-50 border-blue-200 text-blue-800',
    suggestion: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  const typeEmojis = {
    positive: '✨',
    neutral: '💡',
    suggestion: '🌱',
  };

  return (
    <div className={`rounded-lg border p-4 ${typeStyles[nudge.type]}`}>
      <p className="text-sm font-medium flex items-start gap-2">
        <span className="text-lg">{typeEmojis[nudge.type]}</span>
        <span>{nudge.message}</span>
      </p>
      {nudge.relatedGoal && (
        <p className="text-xs opacity-75 mt-2 ml-7">
          Related to: {nudge.relatedGoal}
        </p>
      )}
    </div>
  );
}

interface PromptCardProps {
  prompt: ReflectionPrompt;
  icon: React.ReactNode;
}

function PromptCard({ prompt, icon }: PromptCardProps) {
  const categoryColors = {
    awareness: 'text-blue-600 bg-blue-50',
    goals: 'text-purple-600 bg-purple-50',
    habits: 'text-pink-600 bg-pink-50',
    alternatives: 'text-yellow-600 bg-yellow-50',
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${categoryColors[prompt.category]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {prompt.question}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 capitalize">
              {prompt.category}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">
              Relevance: {(prompt.relevance * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}