// Auto-detects PPP vs 5E from the teacher's "Recommended teaching strategy"
// text. PPP is the default for discrete, language-focused ESL lessons; 5E is
// only chosen when the strategy text signals open-ended, inquiry-led work.

const PPP_KEYWORDS = [
  "presentation", "controlled practice", "drill", "elicitation", "ccq",
  "concept check", "grammar", "sentence pattern", "modelling", "model sentence",
  "guided practice", "structured practice", "vocabulary activation",
  "repetition", "substitution"
];

const FIVE_E_KEYWORDS = [
  "engage", "explore", "exploration", "inquiry", "investigate", "investigation",
  "discovery", "discover", "hands-on", "hands on", "experiment", "hypothesis",
  "elaborate", "project-based", "project based", "real-world", "real world"
];

function countHits(text, keywords) {
  return keywords.reduce((count, kw) => (text.includes(kw) ? count + 1 : count), 0);
}

function detectFramework(strategyText) {
  const text = (strategyText || "").toLowerCase();
  const pppScore = countHits(text, PPP_KEYWORDS);
  const fiveEScore = countHits(text, FIVE_E_KEYWORDS);

  if (fiveEScore > pppScore) {
    return {
      key: "5E",
      rationale: "The teaching strategy signals open-ended, inquiry-led work, so the lesson is built as student-led exploration and discovery before formal explanation and application."
    };
  }
  return {
    key: "PPP",
    rationale: "The teaching strategy signals a discrete language form or skill focus, so the lesson is built as explicit presentation and structured, guided practice before free production."
  };
}

module.exports = { detectFramework };
