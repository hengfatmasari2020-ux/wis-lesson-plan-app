# WIS Lesson Plan App

Generates branded Word (.docx) lesson plans for Western International School's
English Department, Grades 1 to 12, as a PPP or 5E procedural plan.

## Run it

```bash
npm install
npm start
```

Then open http://localhost:3000. Set a different port with `PORT=5000 npm start`.

## How it works

- `public/` — the single-page form (HTML/CSS/JS), no build step. As the teacher
  types their teaching strategy, the form calls `/api/detect-framework` to show
  a live "Detected framework: PPP / 5E" note.
- `server.js` — Express API: `GET /api/frameworks/:grade` (Cambridge subject/unit
  label for the metadata block), `POST /api/detect-framework` (PPP/5E detection
  preview), and `POST /api/generate-docx` (builds and returns the .docx).
- `src/frameworks.js` — grade-to-Cambridge-label mapping only (e.g. Grade 1 =
  Global English Stage 2). Grade no longer changes the lesson's structure, only
  this label.
- `src/lessonStages.js` — the two fixed 50-minute procedural frameworks: PPP
  (Warm-Up, Presentation, Controlled Practice, Semi-Controlled Practice, Freer
  Production, Plenary) and 5E (Engage, Explore, Explain, Elaborate, Evaluate),
  each stage carrying an interaction pattern and target TTT/STT talk ratio.
- `src/frameworkDetector.js` — keyword-based PPP vs 5E detection from the
  teacher's "Recommended teaching strategy" text. Defaults to PPP (the
  standard for discrete language-focused ESL lessons) unless the text signals
  open-ended, inquiry-led work.
- `src/contentBuilder.js` — per-stage Teacher Procedures / Student Tasks /
  Formative Checks templates, populated from the topic, resources, and
  strategy. Formative checks are generated automatically per stage; there is
  no separate AfL input field.
- `src/ttReductionChecklist.js` — the fixed "Teacher TTT-Reduction Self-Audit
  Checklist" appended to every plan (generic coaching content, not derived
  from the form).
- `src/docxGenerator.js` — assembles the A4 landscape .docx: WIS navy/gold
  branding, Calibri font (10pt body, 18pt title), Lesson Metadata & Context,
  Measurable Learning Objectives (SWBAT), Procedural Execution Plan (bulleted
  cells), Three-Tier Differentiation & Scaffolding Matrix, and the
  TTT-Reduction checklist.
- `POST /api/extract-resources` — accepts an uploaded .pptx/.docx/.pdf
  (processed in memory only, never stored) and returns suggested values for
  the six form fields, so a teacher can upload their slides/guide instead of
  typing everything by hand:
  - `src/fileExtractor.js` — pulls plain text out of the file. PPTX slide
    notes are extracted separately from slide body text, since notes are
    continuous prose (a teacher script) and parse far more reliably than
    slide bodies, which are scattered across independent text boxes with no
    guaranteed reading order.
  - `src/ruleBasedParser.js` — free, deterministic extraction tuned to the
    WIS teacher's-guide script format ("TEACHER SAYS:", "TEACHER DOES:",
    "STUDENTS DO:", "DIFFERENTIATION - Support: ... | Core: ... |
    Challenge: ..."). Finds topic, resources, and differentiation reliably;
    cannot reliably find objectives/criteria/strategy since those are free
    prose with no fixed label.
  - `src/aiExtractor.js` — only called for fields the rules didn't find, and
    only if `ANTHROPIC_API_KEY` is set (see below). No-ops otherwise, so the
    app still works on rule-based extraction alone without a key.
  - `src/extractResources.js` — orchestrates the two, and reports which
    method (`rule` / `ai` / `none`) found each field so the UI can be honest
    about it.
  - The front end (`public/app.js`) only fills in fields that are currently
    empty; anything the teacher already typed is left untouched.

### Enabling AI-assisted extraction (optional)

Without any setup, uploads still extract topic/resources/differentiation via
the free rule-based parser. To also auto-fill teaching strategy, objectives,
and success criteria from messier or differently-formatted files, add an
Anthropic API key:

1. Get a key from [console.anthropic.com](https://console.anthropic.com)
   (requires your own billing set up there — a few cents per generation).
2. On Render: the service's **Environment** tab → add `ANTHROPIC_API_KEY`.
3. Locally: `ANTHROPIC_API_KEY=sk-... npm start`.

## Notes

- Every generated plan is a fixed 50-minute lesson (PPP stages sum to 50
  minutes; 5E stages sum to 50 minutes).
- Differentiation (Support / Core / Challenge) lives in its own Three-Tier
  Matrix section, not repeated inline per stage.
- File name convention: `Grade<N>-English-<YYYY-MM-DD>.docx`.
