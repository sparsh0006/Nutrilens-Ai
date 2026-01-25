# 🍎 NutriLens AI

**Visual Nutrition Awareness Agent with AI-Powered Multi-Agent Pipeline**

NutriLens AI is an evaluation-first, uncertainty-aware nutrition analysis platform that helps users develop healthier eating awareness through computer vision and multi-agent AI processing. Built with Opik for comprehensive tracing, evaluation, and continuous improvement.

## 🎯 Overview

NutriLens AI analyzes meal images using a sophisticated multi-agent pipeline:

1. **Food Recognition Agent** - Identifies food items with confidence scores
2. **Nutrition Estimation Agent** - Provides range-based nutrition estimates
3. **Reflection Agent** - Generates thoughtful prompts for self-awareness
4. **Habit Nudge Agent** - Offers supportive, non-prescriptive suggestions

All agents are traced, evaluated, and continuously improved using **Opik by Comet**.

## ✨ Key Features

- 📸 **Image-Based Analysis** - Upload meal photos for instant recognition
- 📊 **Range Estimates** - Nutrition ranges (not exact values) to reflect uncertainty
- 🤔 **Reflection Prompts** - Questions that encourage healthy awareness
- 💡 **Habit Nudges** - Supportive suggestions without prescriptive advice
- 🔍 **Opik Integration** - Full tracing and LLM-as-judge evaluations
- 📈 **Continuous Improvement** - User feedback improves future predictions
- 🎨 **Modern UI** - Clean, responsive interface with Tailwind CSS

## 🏗️ Architecture

```
┌─────────────────┐
│  User Uploads   │
│  Meal Image     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│        Food Recognition Agent           │
│  (GPT-4 Vision) → Opik Tracing         │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     Nutrition Estimation Agent          │
│  (GPT-4o-mini) → Opik Tracing          │
└────────┬────────────────────────────────┘
         │
         ├─────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌──────────────────┐            ┌──────────────────┐
│ Reflection Agent │            │ Habit Nudge Agent│
│  → Opik Tracing  │            │  → Opik Tracing  │
└────────┬─────────┘            └─────────┬────────┘
         │                                  │
         └──────────────┬───────────────────┘
                        │
                        ▼
         ┌──────────────────────────┐
         │  LLM-as-Judge Evaluation │
         │  (Hallucination, Clarity,│
         │   Tone Safety)           │
         └──────────┬───────────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │  Results + Feedback Loop │
         │  → Opik Logging          │
         └──────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenAI API Key
- Opik API Key (sign up at [comet.com/opik](https://www.comet.com/opik))
- MongoDB (optional, for data persistence)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd nutrilens-ai

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your API keys
```

### Environment Setup

Create `.env.local` with the following:

```env
# Opik Configuration
OPIK_API_KEY=your_opik_api_key_here
OPIK_URL_OVERRIDE=https://www.comet.com/opik/api
OPIK_PROJECT_NAME=nutrilens-ai
OPIK_WORKSPACE_NAME=your_workspace_name

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB (Optional)
MONGODB_URI=mongodb://localhost:27017/nutrilens
MONGODB_DB_NAME=nutrilens

# App Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

### Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the application.

## 📦 Project Structure

```
nutrilens-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts      # Main analysis endpoint
│   │   │   ├── feedback/route.ts     # Feedback collection
│   │   │   └── health/route.ts       # Health check
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Main page
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   ├── ImageUpload.tsx           # Image upload component
│   │   ├── NutritionResults.tsx      # Results display
│   │   ├── ReflectionPrompts.tsx     # Reflection UI
│   │   └── FeedbackForm.tsx          # Feedback form
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── foodRecognitionAgent.ts
│   │   │   ├── nutritionEstimationAgent.ts
│   │   │   ├── reflectionAgent.ts
│   │   │   └── habitNudgeAgent.ts
│   │   ├── opik/
│   │   │   ├── client.ts             # Opik client setup
│   │   │   ├── evaluators.ts         # LLM-as-judge metrics
│   │   │   └── tracers.ts            # Tracing utilities
│   │   ├── types.ts                  # TypeScript types
│   │   └── utils.ts                  # Utility functions
│   └── models/                       # MongoDB models (optional)
├── public/                           # Static assets
├── .env.local                        # Environment variables
├── next.config.js                    # Next.js config
├── tailwind.config.js                # Tailwind config
├── tsconfig.json                     # TypeScript config
└── package.json                      # Dependencies
```

## 🧪 Evaluation & Testing

### LLM-as-Judge Metrics

NutriLens AI uses Opik's evaluation framework with custom metrics:

1. **Hallucination Detection** - Ensures factual accuracy
2. **Clarity Score** - Measures explanation quality
3. **Tone Safety** - Prevents prescriptive dietary advice
4. **Confidence Calibration** - Validates prediction confidence

### Running Evaluations

```typescript
import { evaluateAnalysis } from '@/lib/opik/evaluators';

const metrics = await evaluateAnalysis(input, output, context);
console.log(metrics);
// {
//   hallucinationScore: 0.92,
//   clarityScore: 0.88,
//   toneScore: 0.95,
//   overallQuality: 0.92
// }
```

### Regression Testing

```bash
npm run test:regression
```

## 🔐 Safety & Ethics

NutriLens AI is built with responsible AI principles:

- ✅ **No Medical Claims** - Explicitly avoids medical/dietary advice
- ✅ **Range Estimates** - Provides ranges instead of exact values
- ✅ **Confidence Scores** - Transparent about uncertainty
- ✅ **Non-Prescriptive** - Focuses on awareness, not prescription
- ✅ **User Empowerment** - Supports autonomy and choice
- ✅ **Feedback Loop** - Learns from user corrections

## 📊 Opik Dashboard

View your traces and evaluations in the Opik dashboard:

1. Visit [comet.com/opik](https://www.comet.com/opik)
2. Navigate to your workspace
3. Select the `nutrilens-ai` project
4. View traces, spans, and evaluation metrics

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Opik by Comet** - LLM observability and evaluation platform
- **OpenAI** - GPT-4 Vision and language models
- **Next.js** - React framework
- **Tailwind CSS** - Styling framework

## 📧 Support

For questions or issues:
- Open an issue on GitHub
- Visit [Opik Documentation](https://www.comet.com/docs/opik/)
- Join the [Opik Slack Community](https://www.comet.com/slack)

---

Built with ❤️ for the Health, Fitness & Wellness track