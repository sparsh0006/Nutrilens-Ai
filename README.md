# 🍎 NutriLens AI

**Visual Nutrition Awareness Agent — Honest, Uncertainty-Aware, Evaluation-Driven**

> Upload a meal photo. Get nutrition ranges, not false precision. Build awareness, not obsession.

NutriLens AI helps users develop healthier eating awareness through computer vision and a multi-agent AI pipeline. It provides **range-based nutrition estimates**, **confidence scores**, and **reflective prompts** — never exact calorie counts or prescriptive dietary advice.

Every AI decision is traced, evaluated, and improvable through **Opik by Comet**.

🔗 **[Live Demo](https://nutrilens-ai-brown.vercel.app/)** · 📊 **[Opik Workspace: among-gaming](https://www.comet.com/opik)** · 🏥 **Health, Fitness & Wellness Track** · 🏆 **Best Use of Opik**

---

## 🎯 Why NutriLens AI?

Most nutrition apps give you a single number — "this meal is 487 calories" — creating **false precision**. A grilled chicken breast could be 165–220 kcal depending on portion size, cooking method, and whether the skin is on.

NutriLens AI takes a different approach:

| Traditional Apps | NutriLens AI |
|---|---|
| Exact calorie counts | Range estimates (165–220 kcal) |
| Black-box results | Confidence scores + variability factors |
| "Eat this, not that" | Reflective questions for self-discovery |
| No transparency | Every AI decision traced in Opik |

**The goal isn't calorie counting — it's building awareness.**

---

## 🏥 Health, Fitness & Wellness

NutriLens AI is designed for the **Health, Fitness & Wellness** track with responsible AI at its core:

- **Range Estimates, Not Exact Values** — Reflects real-world uncertainty in nutrition (portion size, preparation method, ingredient variations)
- **Non-Prescriptive Tone** — Never tells users what to eat or avoid; focuses on awareness and self-discovery
- **Reflective Prompts** — Encourages mindful eating through open-ended questions across awareness, goals, habits, and alternatives
- **Supportive Habit Nudges** — Celebrates positive choices and gently suggests variety without judgment
- **Safety Disclaimers** — Clearly states this is for educational purposes only, not medical or dietary advice
- **Tone Safety Monitoring** — An LLM-as-judge evaluator actively checks every response for prescriptive language

---

## 🏗️ Multi-Agent Architecture

```
┌─────────────────┐
│  User Uploads   │
│  Meal Image     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  🔍 Food Recognition Agent (GPT-4o Vision) │
│  Identifies foods + confidence scores       │
│  → Opik Trace: food-recognition-llm-call    │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  📊 Nutrition Estimation Agent (GPT-4o-mini)│
│  Range-based estimates + variability factors│
│  → Opik Trace: nutrition-estimation-llm-call│
└────────┬────────────────────────────────────┘
         │
         ├────────────────────────┐
         ▼                        ▼
┌────────────────────┐  ┌────────────────────┐
│ 🤔 Reflection Agent│  │ 💡 Habit Nudge Agent│
│ Awareness questions│  │ Supportive nudges  │
│ → Opik Traced      │  │ → Opik Traced      │
└────────┬───────────┘  └─────────┬──────────┘
         │                        │
         └───────────┬────────────┘
                     ▼
      ┌──────────────────────────────┐
      │  ⚖️ LLM-as-Judge Evaluation  │
      │  Hallucination · Clarity ·   │
      │  Tone Safety                 │
      │  → 3 Opik Evaluation Traces  │
      └──────────┬───────────────────┘
                 ▼
      ┌──────────────────────────────┐
      │  📝 User Feedback Loop       │
      │  Corrections → Opik Logging  │
      └──────────────────────────────┘
```

### Agent Details

| Agent | Model | Purpose | Key Output |
|---|---|---|---|
| Food Recognition | GPT-4o Vision | Identify foods from images | Food items + confidence (0–1) + category |
| Nutrition Estimation | GPT-4o-mini | Estimate nutrition ranges | Calorie/protein/carb/fat ranges + variability factors |
| Reflection | GPT-4o-mini | Generate awareness prompts | 3–5 questions across awareness, goals, habits, alternatives |
| Habit Nudge | GPT-4o-mini | Supportive suggestions | 2–3 positive/neutral/suggestion nudges |

---

## 🔍 Best Use of Opik — Evaluation & Observability

Opik is not an add-on — it's central to how NutriLens AI is built, tested, and improved.

### Full Agent Tracing with `opik-openai`

Every agent creates a parent trace with `opikClient.trace()`, then uses `trackOpenAI()` from `opik-openai` with `parent: trace` to automatically capture:

- **Model name, prompts, and completions** as child spans
- **Token usage and cost** per LLM call
- **Latency** for each agent
- **Errors** with full stack context

```typescript
// Each agent creates a traced OpenAI client
const trace = opikClient.trace({ name: 'food-recognition-agent', ... });
const openai = trackOpenAI(new OpenAI({ apiKey }), {
  client: opikClient,
  parent: trace,  // LLM call appears as child span
  generationName: 'food-recognition-llm-call',
});
```

### 3 LLM-as-Judge Evaluations

Every analysis is automatically evaluated (async, non-blocking) on three dimensions:

| Metric | What It Measures | Why It Matters |
|---|---|---|
| **Hallucination Score** | Are nutrition claims factually grounded? | Prevents false health information |
| **Clarity Score** | Is the output well-structured and understandable? | Users need clear, actionable information |
| **Tone Safety Score** | Does it avoid prescriptive dietary advice? | Critical for the Health track — safety first |

```
Evaluation metrics: {
  hallucinationScore: 1,
  clarityScore: 1,
  toneScore: 1,
  confidenceCalibration: 0.5,
  overallQuality: 1
}
```

### User Feedback Loop

User corrections (food identification, portion sizes, satisfaction ratings) are logged as separate Opik traces linked to the original analysis via `analysisId`, creating a closed loop for continuous improvement.

### Opik Dashboard Visibility

All traces are visible at:
- **Workspace:** `among-gaming`
- **Project:** `nutrilens-ai`
- **Traces include:** food-recognition-agent, nutrition-estimation-agent, reflection-agent, habit-nudge-agent, evaluation-llm-call (×3), user-feedback

---

## ✨ Key Features

- 📸 **Image-Based Analysis** — Upload meal photos for instant multi-agent analysis
- 📊 **Range Estimates** — Nutrition ranges (not exact values) reflecting real uncertainty
- 🤔 **Reflection Prompts** — Open-ended questions encouraging healthy self-awareness
- 💡 **Habit Nudges** — Supportive, non-prescriptive suggestions celebrating positive choices
- 🔍 **Full Opik Tracing** — Every agent call traced with spans via `opik-openai` integration
- ⚖️ **LLM-as-Judge** — 3 automated evaluation metrics on every analysis
- 📝 **Feedback Loop** — User corrections logged to Opik for continuous improvement
- 🎨 **Modern UI** — Clean, responsive Next.js interface with Tailwind CSS

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API Key
- Opik API Key ([comet.com/opik](https://www.comet.com/opik))
- MongoDB (optional)

### Installation

```bash
git clone https://github.com/sparsh0006/Nutrilens-Ai.git
cd nutrilens-ai
npm install
cp .env.example .env.local
```

### Environment Variables

```env
# Opik
OPIK_API_KEY=your_opik_api_key
OPIK_URL_OVERRIDE=https://www.comet.com/opik/api
OPIK_PROJECT_NAME=nutrilens-ai
OPIK_WORKSPACE_NAME=your_workspace

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# MongoDB (optional)
MONGODB_URI=mongodb://localhost:27017/nutrilens

# App
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Project Structure

```
nutrilens-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts          # Multi-agent pipeline endpoint
│   │   │   ├── feedback/route.ts         # Feedback collection → Opik
│   │   │   └── health/route.ts           # Health check
│   │   ├── page.tsx                      # Main UI
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ImageUpload.tsx               # Drag-and-drop image upload
│   │   ├── NutritionResults.tsx          # Range-based results display
│   │   ├── ReflectionPrompts.tsx         # Reflection questions UI
│   │   └── FeedbackForm.tsx              # User feedback form
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── foodRecognitionAgent.ts   # GPT-4o Vision + Opik trace
│   │   │   ├── nutritionEstimationAgent.ts # Range estimates + Opik trace
│   │   │   ├── reflectionAgent.ts        # Awareness prompts + Opik trace
│   │   │   └── habitNudgeAgent.ts        # Supportive nudges + Opik trace
│   │   ├── opik/
│   │   │   ├── client.ts                # Opik client + traceAgent wrapper
│   │   │   ├── evaluators.ts            # 3 LLM-as-judge metrics
│   │   │   └── tracers.ts              # Tracing utilities
│   │   ├── types.ts
│   │   └── utils.ts
│   └── models/
│       ├── Meal.ts                       # MongoDB meal schema
│       └── Feedback.ts                   # MongoDB feedback schema
└── package.json
```

---

## 🔐 Safety & Responsible AI

| Principle | Implementation |
|---|---|
| No Medical Claims | Disclaimers in UI header and footer; agents instructed to avoid medical advice |
| Range Estimates | All nutrition values shown as min–max ranges, never single numbers |
| Confidence Scores | Every food item shows identification confidence (0–100%) |
| Non-Prescriptive | Reflection agent uses open-ended questions; nudge agent never commands |
| Tone Monitoring | LLM-as-judge tone safety evaluator runs on every analysis |
| User Autonomy | Feedback system empowers users to correct and improve results |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 + TypeScript
- **AI Models:** OpenAI GPT-4o (vision), GPT-4o-mini (text)
- **Observability:** Opik SDK + opik-openai integration
- **Database:** MongoDB + Mongoose (optional)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

---

## 📧 Links

- **Live Demo:** [nutrilens-ai-brown.vercel.app](https://nutrilens-ai-brown.vercel.app/)
- **GitHub:** [github.com/sparsh0006/Nutrilens-Ai](https://github.com/sparsh0006/Nutrilens-Ai)
- **Opik Docs:** [comet.com/docs/opik](https://www.comet.com/docs/opik/)

---

Built with ❤️ for the **Health, Fitness & Wellness** track + **Best Use of Opik**