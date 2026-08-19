// Free, deterministic extraction tuned to the WIS teacher's-guide slide
// script format: "TEACHER SAYS:", "TEACHER DOES:", "STUDENTS DO:", etc.
//
// Only the fields that can be found reliably by label-matching are filled in
// here (topic, resources). Differentiation is always typed in by the teacher,
// never auto-filled. Objectives, success criteria and teaching strategy
// require understanding free-flowing prose scattered across slide text boxes
// with no fixed order, which regex cannot do reliably — those are left for
// the AI fallback (see aiExtractor.js) when this parser can't find them.

function collectAllText(extracted) {
  if (extracted.kind === "pptx") {
    return extracted.slides.map((s) => `${s.text}\n${s.notes}`).join("\n");
  }
  return extracted.text;
}

function extractTopic(extracted) {
  const firstBlock = extracted.kind === "pptx"
    ? (extracted.slides[0] ? extracted.slides[0].text : "")
    : extracted.text.split("\n").slice(0, 15).join("\n");

  const lines = firstBlock.split("\n").map((l) => l.trim()).filter(Boolean);
  const unitLineIdx = lines.findIndex((l) => /unit\s*[\d.]+/i.test(l));
  if (unitLineIdx === -1) return null;

  const stopPattern = /coursebook|workbook|session\s*\d|introduction and|page\s*\d/i;
  const parts = [lines[unitLineIdx]];
  for (let i = unitLineIdx + 1; i < lines.length && i < unitLineIdx + 3; i++) {
    if (stopPattern.test(lines[i])) break;
    parts.push(lines[i]);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function dedupeCaseInsensitive(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = item.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function extractResources(extracted) {
  const text = collectAllText(extracted);
  const pattern = /(coursebook|workbook|learner'?s?\s*book)\s*(?:pages?|pp?\.)\s*[\d]+\s*(?:[-–—to]+\s*[\d]+)?/gi;
  const matches = text.match(pattern) || [];
  const unique = dedupeCaseInsensitive(matches.map((m) => m.replace(/\s+/g, " ").trim()));
  return unique.length ? unique.join(", ") + "." : null;
}

function parse(extracted) {
  const topic = extractTopic(extracted);
  const resources = extractResources(extracted);

  return {
    topic,
    resources,
    found: {
      topic: !!topic,
      resources: !!resources,
      strategy: false,
      objectives: false,
      criteria: false
    }
  };
}

module.exports = { parse, collectAllText };
