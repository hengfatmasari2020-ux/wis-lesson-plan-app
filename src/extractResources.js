// Orchestrates: extract raw text from the uploaded file, run the free
// rule-based parser, then call the AI fallback only for whichever fields the
// rules didn't find. Returns field suggestions for topic, resources,
// strategy, objectives and criteria, plus a `sources` map so the UI can be
// honest about which fields were guessed by AI versus found directly by
// label-matching. Differentiation is never extracted here — teachers always
// type Support/Core/Challenge in themselves.

const { extractFile } = require("./fileExtractor");
const { parse, collectAllText } = require("./ruleBasedParser");
const { extractMissingFields, isConfigured } = require("./aiExtractor");

const FIELDS = ["topic", "resources", "strategy", "objectives", "criteria"];

async function extractResourcesFromFile(buffer, filename, mimetype) {
  const extracted = await extractFile(buffer, filename, mimetype);
  const ruleResult = parse(extracted);

  const result = {
    topic: ruleResult.topic || "",
    resources: ruleResult.resources || "",
    strategy: "",
    objectives: "",
    criteria: ""
  };
  const sources = {};
  for (const field of FIELDS) {
    sources[field] = ruleResult.found[field] ? "rule" : "none";
  }

  const missingFields = FIELDS.filter((f) => !result[f]);

  if (missingFields.length && isConfigured()) {
    const rawText = collectAllText(extracted);
    const { data, used } = await extractMissingFields(rawText, missingFields);
    if (used && data) {
      for (const field of missingFields) {
        if (data[field]) {
          result[field] = data[field];
          sources[field] = "ai";
        }
      }
    }
  }

  return { ...result, sources, aiAvailable: isConfigured() };
}

module.exports = { extractResourcesFromFile };
