// AI fallback for fields the rule-based parser (ruleBasedParser.js) couldn't
// find by label-matching: teaching strategy, learning objectives, and success
// criteria almost always need this, since they're free prose scattered across
// slide text boxes with no fixed order.
//
// Only called for fields still missing after the free rule-based pass, and
// only if ANTHROPIC_API_KEY is configured — without a key this module is a
// no-op so the app still works on rule-based extraction alone.

const Anthropic = require("@anthropic-ai/sdk");

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const MAX_INPUT_CHARS = 15000;

function isConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

function buildPrompt(rawText, missingFields) {
  return `You are extracting lesson-planning details from a teacher's slide deck or teaching guide, for a Western International School English lesson plan generator.

Below is text extracted from the uploaded file (slide text and speaker notes, or document text). Extract ONLY the following fields, which could not be found automatically: ${missingFields.join(", ")}.

Rules:
- Base every field strictly on what is actually in the source text. Never invent content, page numbers, or activities that are not present.
- If a field genuinely cannot be determined from the source, return an empty string for it.
- Keep each field concise and written in clear, professional British English, active voice, no em dashes.
- "objectives" should state what students will learn or be able to do, drawn from the source's own stated objectives.
- "criteria" should be checkable "I can..." statements, drawn from or reasonably inferred from the objectives and tasks in the source.
- "strategy" should name the actual teaching approach used in the source (e.g. modelling, guided elicitation, cold-calling, think-aloud annotation), not a generic guess.

Respond with ONLY a JSON object, no other text, matching this shape:
{"topic": "", "resources": "", "strategy": "", "objectives": "", "criteria": ""}

SOURCE TEXT:
"""
${rawText.slice(0, MAX_INPUT_CHARS)}
"""`;
}

async function extractMissingFields(rawText, missingFields) {
  if (!isConfigured() || !missingFields.length) {
    return { data: null, used: false };
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      messages: [{ role: "user", content: buildPrompt(rawText, missingFields) }]
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { data: null, used: false };

    const parsed = JSON.parse(jsonMatch[0]);
    return { data: parsed, used: true };
  } catch (err) {
    console.error("AI extraction failed:", err.message);
    return { data: null, used: false, error: err.message };
  }
}

module.exports = { extractMissingFields, isConfigured };
