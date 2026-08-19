// Orchestrates: extract raw text from the uploaded file, run the free
// rule-based parser, then call the AI fallback only for whichever fields the
// rules didn't find. Returns the six-field shape the form expects, plus a
// `sources` map so the UI can be honest about which fields were guessed by
// AI versus found directly by label-matching.

const { extractFile } = require("./fileExtractor");
const { parse, collectAllText } = require("./ruleBasedParser");
const { extractMissingFields, isConfigured } = require("./aiExtractor");

const FIELDS = ["topic", "resources", "strategy", "objectives", "criteria", "differentiation"];

async function extractResourcesFromFile(buffer, filename, mimetype) {
  const extracted = await extractFile(buffer, filename, mimetype);
  const ruleResult = parse(extracted);

  const result = {
    topic: ruleResult.topic || "",
    resources: ruleResult.resources || "",
    strategy: "",
    objectives: "",
    criteria: "",
    differentiation: ruleResult.differentiation || { support: "", core: "", challenge: "" }
  };
  const sources = {};
  for (const field of FIELDS) {
    sources[field] = ruleResult.found[field] ? "rule" : "none";
  }

  const missingFields = FIELDS.filter((f) => {
    if (f === "differentiation") return !ruleResult.found.differentiation;
    return !result[f];
  });

  if (missingFields.length && isConfigured()) {
    const rawText = collectAllText(extracted);
    const { data, used } = await extractMissingFields(rawText, missingFields);
    if (used && data) {
      for (const field of missingFields) {
        if (field === "differentiation") {
          if (data.differentiation && (data.differentiation.support || data.differentiation.core || data.differentiation.challenge)) {
            result.differentiation = {
              support: data.differentiation.support || "",
              core: data.differentiation.core || "",
              challenge: data.differentiation.challenge || ""
            };
            sources.differentiation = "ai";
          }
        } else if (data[field]) {
          result[field] = data[field];
          sources[field] = "ai";
        }
      }
    }
  }

  return { ...result, sources, aiAvailable: isConfigured() };
}

module.exports = { extractResourcesFromFile };
