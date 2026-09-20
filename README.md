# • QC Evaluator

An enterprise-grade Call Quality Control & Automated Scoring Engine designed for high-stakes client onboarding and executive coaching operations. Built with **Next.js 14**, **Supabase**, **Tailwind CSS**, and powered by **Google Gemini LLM Architecture**.

![QC Evaluator Banner](https://img.shields.io/badge/Status-Production--Ready-emerald?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black?style=for-the-badge&logo=next.js) ![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase) ![Gemini](https://img.shields.io/badge/AI Engine-Google%20Gemini-8E75FF?style=for-the-badge&logo=google)

---

## ⚡ Overview

**QC Evaluator** transforms unstructured raw call transcripts into high-fidelity, evidence-backed quality reports in seconds. Built to solve the operational bottleneck of manual QA in high-velocity coaching and kickoff environments, the evaluator grades calls against complex multi-pillar scoring rubrics while eliminating AI hallucination through strict verbatim citation enforcement.

### 🌟 Core Value Delivered
* **Zero-Hallucination Scoring:** Every dimension score is strictly backed by verbatim transcript line quotes. If a behavior did not happen on the call, the engine explicitly reports its absence instead of inferring mood.
* **Asynchronous Resilience:** Operators can paste multi-thousand-line transcripts (up to 65,000+ characters), submit the job, and close their browser tab. The evaluation process runs independently in the background, updating state seamlessly upon return.
* **Actionable Executive Intelligence:** Automatically surfaces **Red Flags** (client churn risks hidden behind high scores), **"The One Thing"** (the highest-leverage single correction to boost the overall grade), and **The Brief** (a concise summary tailored for executive coaches).
* **Client-Ready PDF Export:** Instant rendering of branded, executive-grade PDF reports with zero clipping or broken pagination layout artifacts.

---

## 📸 Key Features & Capabilities

| Feature | Description |
| :--- | :--- |
| **Dual Rubric Engine** | Specialized grading systems for **Kick-Off Calls** (12 dimensions, automatic cap rules, calibration bands) and **Coaching Calls** (12 dimensions split across 3 core pillars). |
| **Automated Point Caps** | Algorithmic enforcement of automatic score ceilings when critical protocol breaches occur (e.g., missed safety disclaimers, poor technical onboarding). |
| **Dynamic Score Ring & Bands** | Visual radial progress rendering with automatic categorization into performance tiers (**Elite**, **Strong**, **Mid**, **At Risk**, **Fail**). |
| **Granular Dimension Accordions** | 12 expandable dimension cards detailing numerical scores, qualitative reasoning, direct quotes, and quick-fix recommendations. |
| **Permanent Unique URL Sharing** | Every run generates a deterministic UUID persisted in PostgreSQL. Shareable links allow team members to view identical, persistent evaluation reports anytime. |

---

## 🏗 System Architecture & Pipeline

```
  ┌───────────────────────┐
  │  Operator Input       │
  │  - Call Type          │
  │  - Coach & Client     │
  │  - Raw Transcript     │
  └──────────┬────────────┘
             │ (POST /api/evaluations)
             ▼
  ┌───────────────────────┐       ┌──────────────────────────────┐
  │ Next.js App Router    ├──────►│ Supabase Postgres            │
  │ - Generates UUID      │       │ - Creates Record (PROCESSING)│
  └──────────┬────────────┘       └──────────────────────────────┘
             │
             │ (Async Background Execution)
             ▼
  ┌──────────────────────────────────────────────────────────────┐
  │ Google Gemini AI Evaluation Engine                           │
  │ - Strict Systemic Prompting & Schema Enforcement             │
  │ - Parses 12 Rubric Dimensions                                │
  │ - Extracts Verbatim Quotations & Applies Score Caps          │
  │ - Calculates "The One Thing" & Scans for Churn Red Flags     │
  └──────────┬───────────────────────────────────────────────────┘
             │
             │ (Status Update: COMPLETED / FAILED)
             ▼
  ┌───────────────────────┐       ┌──────────────────────────────┐
  │ Supabase Postgres DB  │◄──────┤ Client Polling Interface     │
  │ - Stores Evaluation   │       │ - Real-time State Updates    │
  │ - Persists PDF Payload│       │ - Render Interactive Dash    │
  └───────────────────────┘       └──────────────────────────────┘
```

---

## 🛠 Tech Stack & Architecture Decisions

* **Frontend Framework:** Next.js 14 (App Router) with TypeScript.
* **Styling & UI Systems:** Tailwind CSS, Glassmorphism design tokens, Lucide Icons, and dynamic SVG radial meters.
* **Database & Persistence:** Supabase (PostgreSQL) with row-level security and JSONB document storage.
* **Artificial Intelligence:** Google Gemini API (`@google/genai` REST integration) configured with JSON Schema outputs and systemic anti-hallucination preambles.
* **Document Export:** `html2pdf.js` & `html2canvas` integrated via isolated print DOM trees for zero-glitch PDF generation.

---

## 💡 Key Engineering Challenges & Solutions

### 1. Asynchronous Evaluation State Engine
* **The Problem:** Evaluating a 65,000-character transcript against a complex 12-dimension rubric can take up to 20-30 seconds, exceeding standard server response thresholds and leading to lost evaluations if the user closes their browser.
* **The Solution:** Implemented an asynchronous creation pattern. On form submission, `/api/evaluations` instantly creates a database record with status `PROCESSING` and returns the generated UUID. The backend asynchronously triggers the Gemini pipeline, updating the status to `COMPLETED` or `FAILED` with explicit error stack traces upon completion. The client utilizes a resilient polling loop using `useRef` to safely track progress without React state race conditions.

### 2. Eliminating LLM Hallucination in QA Scoring
* **The Problem:** Generic LLM prompts tend to evaluate the "general vibe" of a transcript, making up quotes or penalizing coaches for non-existent issues.
* **The Solution:** Designed a strict system instructions layer enforcing **Verbatim Evidence Validation**. If a dimension score is less than full marks, the model *must* provide exact line citations from the transcript text. If no evidence exists for a behavior, the engine forces an explicit `"No direct transcript evidence found for this behavior"` flag, preserving audit integrity.

### 3. Pixel-Perfect PDF Export Execution
* **The Problem:** Converting complex web components with CSS backdrop blurs, flex layouts, and gradients into PDF documents via `html2canvas` often leads to severe text clipping, overlapping text boxes, and improper page breaks.
* **The Solution:** Engineered a custom CSS export pipeline (`.pdf-export-mode`). When the user clicks **Download PDF**, the application injects a specialized print-mode layout layer that flattens glassmorphic blurs, forces clean white/slate contrast themes, and enforces CSS `page-break-inside: avoid` rules across dimension cards before capturing the canvas.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm** / **yarn** / **pnpm**
* **Supabase Account** & **Google Gemini API Key**

### 1. Environment Setup

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

### 2. Database Schema Setup

Execute the following SQL migration in your Supabase SQL Editor:

```sql
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_type TEXT NOT NULL CHECK (call_type IN ('kickoff', 'coaching')),
  coach_name TEXT,
  client_name TEXT,
  transcript TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
  error_message TEXT,
  score INTEGER,
  band TEXT,
  one_thing JSONB,
  brief TEXT,
  red_flags JSONB,
  dimensions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup by ID and status polling
CREATE INDEX idx_evaluations_status ON evaluations(id, status);
```

### 3. Installation & Local Execution

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to launch the evaluator dashboard.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
