// Builds the three per-stage columns (Teacher Procedures, Student Tasks,
// Formative Checks) for the Procedural Execution Plan table, from the
// teacher's inputs and the stage's `kind`. Formative checks are generated
// here automatically, per stage, rather than taken from a separate AfL field.
//
// Each column returns an array of bullet points (rendered with "• " prefixes
// by docxGenerator.js) so cells read as scannable lists rather than dense
// paragraphs, and resources/strategy are threaded through multiple stages
// rather than mentioned once.

function firstClause(text, maxLen = 90) {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
}

function sentence(text) {
  const clean = text.trim().replace(/\.+$/, "");
  return `${clean}.`;
}

function materialsLine(resources) {
  return resources ? `Materials: ${firstClause(resources, 110)}` : null;
}

function referenceLine(resources) {
  return resources ? "Refer back to the materials in Resources & Teacher Guide as needed." : null;
}

function strategyLine(strategy) {
  return strategy ? `Strategy in use: ${sentence(strategy)}` : null;
}

const TEMPLATES = {
  warmup: (topic, resources) => ({
    teacher: [
      `Display or introduce a hook connected to "${topic}" to activate interest and prior knowledge.`,
      materialsLine(resources),
      'ICQ: confirm whether students respond alone, in pairs, or as a whole class before starting.'
    ].filter(Boolean),
    student: [
      `Turn-and-talk or quick whole-class response connecting personal experience to ${topic}.`,
      "Share one idea with the class when called on."
    ],
    check: [
      `Listen for baseline vocabulary and ideas relating to ${topic} before moving on.`
    ]
  }),

  engage: (topic, resources) => ({
    teacher: [
      `Display or introduce a hook connected to "${topic}" to spark curiosity and surface prior knowledge.`,
      materialsLine(resources),
      'ICQ: confirm whether students respond alone, in pairs, or as a whole class before starting.'
    ].filter(Boolean),
    student: [
      `Respond to the hook in pairs or as a whole class, sharing what they already know or notice about ${topic}.`,
      "Share one idea with the class when called on."
    ],
    check: [
      `Listen for baseline ideas and misconceptions about ${topic} before moving into exploration.`
    ]
  }),

  presentation: (topic, resources, strategy) => ({
    teacher: [
      `Present or elicit the target content for "${topic}" using guided questions rather than direct explanation.`,
      strategyLine(strategy),
      materialsLine(resources),
      'CCQ: ask one or two concept-check questions to confirm understanding before moving on.'
    ].filter(Boolean),
    student: [
      "Respond to guided questions, deduce the pattern or concept, and record it (for example on mini-whiteboards or in notebooks).",
      "Check their understanding against the model with a partner."
    ],
    check: [
      "Quick visual or verbal check that students have grasped the concept before moving to practice."
    ]
  }),

  explore: (topic, resources) => ({
    teacher: [
      `Facilitate hands-on or guided investigation of "${topic}" using the available resources, before any formal explanation.`,
      materialsLine(resources),
      'ICQ: confirm whether students investigate silently first or discuss as they go.'
    ].filter(Boolean),
    student: [
      `Investigate in pairs or small groups, gathering observations or examples related to ${topic}.`,
      "Record findings to share in the follow-up discussion."
    ],
    check: [
      "Circulate and listen for emerging understanding, without confirming or correcting yet."
    ]
  }),

  explain: (topic, resources, strategy) => ({
    teacher: [
      `Elicit and formalise the concept behind "${topic}" from what students discovered, using guided questions rather than lecturing.`,
      strategyLine(strategy),
      referenceLine(resources),
      'CCQ: ask one or two concept-check questions to confirm understanding before moving on.'
    ].filter(Boolean),
    student: [
      "Articulate the pattern or concept in their own words, checked against the model."
    ],
    check: [
      "Quick check that students can state the concept accurately before moving to application."
    ]
  }),

  controlled: (topic, resources) => ({
    teacher: [
      `Set a controlled task on "${topic}" (for example matching or gap-fill), drawing on the materials in Resources & Teacher Guide.`,
      'ICQ: confirm whether students work alone first, or straight away with a partner.',
      "Monitor without interrupting."
    ],
    student: [
      "Complete the controlled task individually, then compare answers with a partner."
    ],
    check: [
      "Circulate and note common errors or misconceptions for later feedback, without correcting in the moment."
    ]
  }),

  semicontrolled: (topic) => ({
    teacher: [
      `Set a semi-controlled pair or group task extending "${topic}" beyond the model example.`,
      "Prompt students to justify their choices, not just state them."
    ],
    student: [
      `Work in pairs or small groups to produce guided but original responses about ${topic}.`
    ],
    check: [
      "Listen in on two or three pairs and note accurate or inaccurate use of the target language."
    ]
  }),

  elaborate: (topic) => ({
    teacher: [
      `Set an extended or new-context task applying "${topic}" beyond the original example.`,
      'Prompt students to justify their answers, for example using "because".'
    ],
    student: [
      "Apply the concept to a new situation individually or in pairs, producing original responses."
    ],
    check: [
      "Note the accuracy and independence of application for individual follow-up."
    ]
  }),

  production: (topic) => ({
    teacher: [
      `Set a freer, communicative task on "${topic}" (for example a small-group presentation or role play) with minimal teacher control.`,
      "Circulate and note fluency and language use without interrupting."
    ],
    student: [
      `Work in small groups to produce and present original language connected to ${topic}.`,
      "Present to another pair or group."
    ],
    check: [
      "Note fluency and accurate application of the target language in a communicative context."
    ]
  }),

  plenary: (topic, resources, strategy, criteria) => ({
    teacher: [
      `Lead a short whole-class plenary on "${topic}", drawing out one or two common points for collective correction or reflection.`,
      "Set a brief individual exit task tied to the Success Criteria."
    ],
    student: [
      "Contribute corrections or reflections, then complete a brief exit task."
    ],
    check: [
      criteria ? `Evaluate against the Success Criteria: ${firstClause(criteria, 110)}` : "Evaluate against today's Success Criteria."
    ]
  }),

  evaluate: (topic, resources, strategy, criteria) => ({
    teacher: [
      `Lead a short plenary on "${topic}", then set a brief individual evaluation task.`,
      "Set a brief individual exit task tied to the Success Criteria."
    ],
    student: [
      "Complete a short individual task or exit ticket demonstrating understanding."
    ],
    check: [
      criteria ? `Evaluate against the Success Criteria: ${firstClause(criteria, 110)}` : "Evaluate against today's Success Criteria."
    ]
  })
};

function buildStageContent(stage, inputs) {
  const { topic, resources, strategy, criteria } = inputs;
  const template = TEMPLATES[stage.kind];
  if (!template) throw new Error(`No content template for stage kind: ${stage.kind}`);
  return template(topic, resources, strategy, criteria);
}

module.exports = { buildStageContent, firstClause, sentence };
