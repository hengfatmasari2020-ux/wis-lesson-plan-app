// Grade metadata only: which Cambridge stage/paper label to show for each grade
// in the lesson plan's Subject/Unit block. The lesson's procedural structure
// itself (PPP or 5E, see lessonStages.js) is the same across all grades.

const GRADE_META = {
  1: { subtitle: "Cambridge Global English Stage 2" },
  2: { subtitle: "Cambridge Global English Stage 3" },
  3: { subtitle: "Cambridge Global English Stage 4" },
  4: { subtitle: "Cambridge Global English Stage 5" },
  5: { subtitle: "Cambridge Global English Stage 6" },
  6: { subtitle: "Cambridge Global English Stage 7" },
  7: { subtitle: "Cambridge Global English Stage 8" },
  8: { subtitle: "Cambridge Global English Stage 9" },
  9: { subtitle: "Cambridge IGCSE English as a Second Language (0510/0511)" },
  10: { subtitle: "Cambridge IGCSE English as a Second Language (0510/0511)" },
  11: { subtitle: "Cambridge International AS Level English Language (9093) — Paper 1/2" },
  12: { subtitle: "Cambridge International A Level English Language (9093) — Paper 3/4" }
};

function getGradeMeta(grade) {
  const g = Number(grade);
  const meta = GRADE_META[g];
  if (!meta) throw new Error(`Unsupported grade: ${grade}. Grade must be between 1 and 12.`);
  return meta;
}

module.exports = { GRADE_META, getGradeMeta };
