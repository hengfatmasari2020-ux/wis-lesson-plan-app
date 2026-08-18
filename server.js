const express = require("express");
const path = require("path");
const { generateLessonPlanDocx } = require("./src/docxGenerator");
const { getGradeMeta } = require("./src/frameworks");
const { detectFramework } = require("./src/frameworkDetector");
const { FRAMEWORKS, weightedTalkRatio } = require("./src/lessonStages");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Lets the front end show the grade's Cambridge subject/unit label as soon as
// a grade is picked.
app.get("/api/frameworks/:grade", (req, res) => {
  try {
    const meta = getGradeMeta(req.params.grade);
    res.json({ grade: Number(req.params.grade), subtitle: meta.subtitle });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Lets the front end show a live "Detected framework: PPP / 5E" note as the
// teacher types their recommended teaching strategy.
app.post("/api/detect-framework", (req, res) => {
  const detected = detectFramework((req.body && req.body.strategy) || "");
  const framework = FRAMEWORKS[detected.key];
  const talk = weightedTalkRatio(framework.stages);
  res.json({
    key: detected.key,
    fullName: framework.fullName,
    rationale: detected.rationale,
    ttt: talk.ttt,
    stt: talk.stt
  });
});

function validate(body) {
  const errors = [];
  const grade = Number(body.grade);
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) errors.push("Grade must be an integer between 1 and 12.");
  if (!body.topic || !body.topic.trim()) errors.push("Unit / lesson topic is required.");
  if (!body.objectives || !body.objectives.trim()) errors.push("Cambridge Learning Objectives is required.");
  if (!body.criteria || !body.criteria.trim()) errors.push("Success Criteria is required.");
  return errors;
}

app.post("/api/generate-docx", async (req, res) => {
  const errors = validate(req.body || {});
  if (errors.length) return res.status(400).json({ errors });

  try {
    const { buffer, filename } = await generateLessonPlanDocx({
      grade: Number(req.body.grade),
      topic: req.body.topic.trim(),
      resources: (req.body.resources || "").trim() || "No additional resources supplied.",
      strategy: (req.body.strategy || "").trim() || "Teacher's professional judgement, appropriate to the class.",
      objectives: req.body.objectives.trim(),
      criteria: req.body.criteria.trim(),
      differentiation: {
        support: (req.body.differentiation?.support || "").trim(),
        core: (req.body.differentiation?.core || "").trim(),
        challenge: (req.body.differentiation?.challenge || "").trim()
      }
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(400).json({ errors: [err.message] });
  }
});

app.listen(PORT, () => {
  console.log(`WIS Lesson Plan App running at http://localhost:${PORT}`);
});
