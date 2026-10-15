// ─── Gemini API Wrapper ───
// Direct REST API calls to Gemini — no SDK needed.

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiGenerateOptions {
  model?: string;
  systemInstruction?: string;
  messages: GeminiMessage[];
  jsonMode?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

interface GeminiResponse {
  text: string;
  promptTokens: number;
  completionTokens: number;
  thinkingTokens: number;
}

// ─── Structured Output Schema ───
// Sent to Gemini as `responseSchema` so the API enforces the contract
// server-side instead of relying on the prose schema in the system prompt.
// Mirrors lib/types.ts (EvaluationResultSchema / DimensionSchema / AutoCapSchema).
const EVALUATION_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    total_score: { type: 'NUMBER', description: 'Total score achieved' },
    max_possible: { type: 'NUMBER', description: '100 normally, 85 when coaching D4 is disabled' },
    grade_stage: { type: 'STRING', description: 'ELITE | STRONG | INCONSISTENT | AT RISK | FAIL' },
    the_one_thing: { type: 'STRING', description: 'The single highest-leverage improvement + counterfactual score' },
    the_brief: { type: 'STRING', description: '2-4 sentences written to the coach' },
    red_flags: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Each churn risk identified, even on high-scoring calls',
    },
    auto_caps_checked: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          condition: { type: 'STRING' },
          cap_applied: { type: 'STRING' },
          fired: { type: 'BOOLEAN' },
        },
        required: ['condition', 'cap_applied', 'fired'],
      },
    },
    dimensions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING', description: 'D1, D2, ... D12' },
          name: { type: 'STRING', description: 'Dimension name from the rubric' },
          pillar: { type: 'STRING', nullable: true, description: 'Pillar name if coaching, null for kickoff' },
          score: { type: 'NUMBER', nullable: true, description: 'null only when disabled' },
          max_score: { type: 'NUMBER', description: '5, 10, or 15' },
          band: { type: 'STRING', description: 'Elite | Strong | Mid | Weak | Fail | N/A' },
          reasoning: { type: 'STRING', description: 'Quote-first rationale' },
          verbatim_quotes: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: 'Exact transcript lines copied character-for-character. NEVER omit — use [] only if genuinely absent.',
          },
          quick_fix: { type: 'STRING', description: 'Specific actionable improvement to reach full marks' },
          disabled: { type: 'BOOLEAN', description: 'true only for coaching D4 when no movement coaching occurred' },
          disabled_reason: { type: 'STRING', nullable: true, description: 'only when disabled is true, otherwise null' },
        },
        required: [
          'id', 'name', 'score', 'max_score', 'band',
          'reasoning', 'verbatim_quotes', 'quick_fix', 'disabled',
        ],
        propertyOrdering: [
          'id', 'name', 'pillar', 'score', 'max_score', 'band',
          'reasoning', 'verbatim_quotes', 'quick_fix', 'disabled', 'disabled_reason',
        ],
      },
    },
  },
  required: [
    'total_score', 'max_possible', 'grade_stage', 'the_one_thing', 'the_brief',
    'red_flags', 'auto_caps_checked', 'dimensions',
  ],
  propertyOrdering: [
    'total_score', 'max_possible', 'grade_stage', 'the_one_thing', 'the_brief',
    'red_flags', 'auto_caps_checked', 'dimensions',
  ],
};

export async function generateWithGemini(options: GeminiGenerateOptions): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY environment variable');

  const model = options.model || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  const requestBody: Record<string, unknown> = {
    contents: options.messages.map(m => ({
      role: m.role,
      parts: m.parts,
    })),
    generationConfig: {
      temperature: options.temperature ?? 0,
      maxOutputTokens: options.maxOutputTokens ?? 65536,
      ...(options.jsonMode
        ? {
            responseMimeType: 'application/json',
            responseSchema: EVALUATION_RESPONSE_SCHEMA,
          }
        : {}),
    },
  };

  // System instruction as a top-level field (Gemini API format)
  if (options.systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    let errMsg = `Gemini API error (${res.status})`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errMsg;
    } catch { /* use default */ }
    throw new Error(errMsg);
  }

  const data = await res.json();

  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error('Gemini returned no candidates. The response may have been filtered.');
  }

  const text = candidate.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return {
    text,
    promptTokens: data.usageMetadata?.promptTokenCount || 0,
    completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
    thinkingTokens: data.usageMetadata?.thoughtsTokenCount || 0,
  };
}
