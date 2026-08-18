// The two procedural lesson frameworks, PPP and 5E, each a fixed 50-minute
// sequence. Every generated lesson plan uses one of these instead of a
// grade-specific stage table: grade only changes the curriculum label shown
// in the metadata block (see frameworks.js), not the lesson's procedure.
//
// `kind` tells contentBuilder.js which template to use for Teacher Procedures /
// Student Tasks / Formative Checks. `ttt`/`stt` are target (not measured) talk
// ratios for that stage, used for the whole-lesson weighted average shown in
// the framework banner.

const PPP_STAGES = [
  { id: 1, name: "Warm-Up & Lead-In", minutes: 5, interaction: "T-S / Pair-Share", ttt: 25, stt: 75, kind: "warmup" },
  { id: 2, name: "Presentation (Discovery & Meaning)", minutes: 10, interaction: "T-S Guided Elicitation", ttt: 40, stt: 60, kind: "presentation" },
  { id: 3, name: "Controlled Practice", minutes: 10, interaction: "Individual / Pair", ttt: 15, stt: 85, kind: "controlled" },
  { id: 4, name: "Semi-Controlled Practice", minutes: 10, interaction: "Pair / Group", ttt: 10, stt: 90, kind: "semicontrolled" },
  { id: 5, name: "Freer Production", minutes: 10, interaction: "Small Groups", ttt: 10, stt: 90, kind: "production" },
  { id: 6, name: "Plenary & Feedback", minutes: 5, interaction: "T-S Whole Class", ttt: 35, stt: 65, kind: "plenary" }
];

const FIVE_E_STAGES = [
  { id: 1, name: "Engage", minutes: 8, interaction: "T-S Whole Class", ttt: 35, stt: 65, kind: "engage" },
  { id: 2, name: "Explore", minutes: 12, interaction: "Pair / Group", ttt: 10, stt: 90, kind: "explore" },
  { id: 3, name: "Explain", minutes: 10, interaction: "T-S Guided Elicitation", ttt: 35, stt: 65, kind: "explain" },
  { id: 4, name: "Elaborate", minutes: 12, interaction: "Pair / Group / Individual", ttt: 10, stt: 90, kind: "elaborate" },
  { id: 5, name: "Evaluate", minutes: 8, interaction: "Individual / Whole Class", ttt: 25, stt: 75, kind: "evaluate" }
];

const FRAMEWORKS = {
  PPP: {
    key: "PPP",
    fullName: "PPP (Presentation, Practice, Production)",
    stages: PPP_STAGES
  },
  "5E": {
    key: "5E",
    fullName: "5E (Engage, Explore, Explain, Elaborate, Evaluate)",
    stages: FIVE_E_STAGES
  }
};

function totalMinutes(stages) {
  return stages.reduce((sum, s) => sum + s.minutes, 0);
}

function weightedTalkRatio(stages) {
  const minutes = totalMinutes(stages);
  const ttt = stages.reduce((sum, s) => sum + s.minutes * s.ttt, 0) / minutes;
  return { ttt: Math.round(ttt), stt: 100 - Math.round(ttt), minutes };
}

module.exports = { FRAMEWORKS, totalMinutes, weightedTalkRatio };
