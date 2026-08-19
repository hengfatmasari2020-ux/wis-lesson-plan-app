// Builds the landscape .docx lesson plan: a PPP or 5E procedural plan (see
// lessonStages.js), auto-detected from the teacher's strategy text, with WIS
// navy/gold branding carried over from the original reference script.

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, ShadingType, HeadingLevel, BorderStyle, AlignmentType,
  VerticalAlign, PageOrientation
} = require("docx");

const { getGradeMeta } = require("./frameworks");
const { FRAMEWORKS, weightedTalkRatio } = require("./lessonStages");
const { detectFramework } = require("./frameworkDetector");
const { buildStageContent } = require("./contentBuilder");
const { TT_REDUCTION_CHECKLIST } = require("./ttReductionChecklist");

const NAVY = "0D1B2A";
const GOLD = "C9A84C";
const WHITE = "FFFFFF";
const LIGHTGOLD = "F5EFDD";

// A4 landscape, usable width after 700 DXA margins each side (16838 - 1400).
const TABLE_WIDTH = 15438;

function headingCell(text, width, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: opts.span,
    shading: { type: ShadingType.CLEAR, fill: NAVY },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, color: WHITE })]
    })]
  });
}

function cell(text, width, opts = {}) {
  const lines = Array.isArray(text) ? text : [text];
  const bullet = lines.length > 1; // single-value cells stay plain; lists get bullets
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: opts.span,
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: LIGHTGOLD } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: lines.map((l, i) => new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: bullet ? `• ${l}` : l, bold: !!opts.bold && i === 0 })]
    }))
  });
}

// Splits free text a teacher typed (support/core/challenge notes) into bullet
// lines: respects existing newlines if present, otherwise splits on sentences.
function toBulletLines(text) {
  if (!text) return [];
  const byLine = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (byLine.length > 1) return byLine;
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function labelValueCell(label, value, width, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: opts.span,
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: LIGHTGOLD } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: label, bold: true, color: NAVY })] }),
      new Paragraph({ children: [new TextRun({ text: value })] })
    ]
  });
}

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 220, after: 100 },
    children: [new TextRun({ text, bold: true, color: NAVY })]
  });
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function buildMetadataTable(grade, subtitle, topic, date, minutes, framework, rationale, strategy, resources) {
  const W = [3859, 3859, 3860, 3860];
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: W,
    rows: [
      new TableRow({ children: [
        labelValueCell("Grade / Class", `Grade ${grade}`, W[0]),
        labelValueCell("Duration / Date", `${minutes} Minutes | ${date}`, W[1] + W[2] + W[3], { span: 3 })
      ]}),
      new TableRow({ children: [
        labelValueCell("Subject / Unit", subtitle, W[0] + W[1], { span: 2, shade: true }),
        labelValueCell("Target Focus", topic, W[2] + W[3], { span: 2, shade: true })
      ]}),
      new TableRow({ children: [
        labelValueCell("Selected Framework", framework.fullName, W[0]),
        labelValueCell("Framework Rationale", rationale, W[1] + W[2] + W[3], { span: 3 })
      ]}),
      new TableRow({ children: [
        labelValueCell("Recommended Teaching Strategy", strategy, TABLE_WIDTH, { span: 4, shade: true })
      ]}),
      new TableRow({ children: [
        labelValueCell("Key Resources", resources, TABLE_WIDTH, { span: 4 })
      ]})
    ]
  });
}

function buildProceduralTable(framework, inputs) {
  const W = [1818, 1818, 1604, 3720, 3721, 2757];
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headingCell("Stage & Timing", W[0]),
      headingCell("Interaction Pattern", W[1]),
      headingCell("Talk Ratio (Target)", W[2]),
      headingCell("Teacher Procedures", W[3]),
      headingCell("Student Tasks", W[4]),
      headingCell("Formative Checks", W[5])
    ]
  });

  const rows = framework.stages.map((stage, i) => {
    const content = buildStageContent(stage, inputs);
    const shade = i % 2 === 1;
    return new TableRow({
      children: [
        cell(`${stage.name} (${stage.minutes} min)`, W[0], { shade, bold: true }),
        cell(stage.interaction, W[1], { shade }),
        cell(`TTT ${stage.ttt}% / STT ${stage.stt}%`, W[2], { shade }),
        cell(content.teacher, W[3], { shade }),
        cell(content.student, W[4], { shade }),
        cell(content.check, W[5], { shade })
      ]
    });
  });

  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: W,
    rows: [headerRow, ...rows]
  });
}

function buildDifferentiationTable(differentiation) {
  const W = [3860, 11578];
  const tiers = [
    ["Tier 1: Emerging / Support", differentiation.support],
    ["Tier 2: Target / Core", differentiation.core],
    ["Tier 3: Extension / Advanced", differentiation.challenge]
  ];
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: W,
    rows: tiers.map(([label, text], i) => {
      const lines = toBulletLines(text);
      return new TableRow({
        children: [
          cell(label, W[0], { shade: i % 2 === 1, bold: true }),
          cell(lines.length ? lines : ["No notes supplied."], W[1], { shade: i % 2 === 1 })
        ]
      });
    })
  });
}

function buildAuditTable() {
  const W = [3421, 6008, 6009];
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headingCell("Audit Checkpoint", W[0]),
      headingCell("Common Flaw", W[1]),
      headingCell("Low-TTT Solution", W[2])
    ]
  });
  const rows = TT_REDUCTION_CHECKLIST.map((item, i) => new TableRow({
    children: [
      cell(item.checkpoint, W[0], { shade: i % 2 === 1, bold: true }),
      cell(item.flaw, W[1], { shade: i % 2 === 1 }),
      cell(item.solution, W[2], { shade: i % 2 === 1 })
    ]
  }));
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: W,
    rows: [headerRow, ...rows]
  });
}

function generateLessonPlanDocx(inputs) {
  const { grade, topic, resources, strategy, objectives, criteria, differentiation } = inputs;
  const meta = getGradeMeta(grade);
  const detected = detectFramework(strategy);
  const framework = FRAMEWORKS[detected.key];
  const talk = weightedTalkRatio(framework.stages);
  const date = inputs.date || todayISO();

  const children = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 6 } },
      spacing: { after: 120 },
      children: [
        new TextRun({ text: "Western International School  |  English Department", bold: true, color: NAVY })
      ]
    }),
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 40 },
      children: [new TextRun({ text: `Lesson Plan: ${topic}`, bold: true, color: NAVY, size: 36 })]
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({
        text: `Grade ${grade} | Framework: ${framework.fullName} | Target Talk Ratio: TTT ${talk.ttt}% / STT ${talk.stt}% (whole-lesson target)`,
        italics: true, color: NAVY
      })]
    }),

    sectionHeading("1. Lesson Metadata & Context"),
    buildMetadataTable(grade, meta.subtitle, topic, date, talk.minutes, framework, detected.rationale, strategy, resources),

    sectionHeading("2. Measurable Learning Objectives (SWBAT)"),
    new Paragraph({ spacing: { after: 80 }, children: [
      new TextRun({ text: `By the end of this ${talk.minutes}-minute lesson, Students Will Be Able To (SWBAT):`, italics: true, color: NAVY })
    ]}),
    new Paragraph({ spacing: { after: 40 }, children: [
      new TextRun({ text: "Learning Objectives: ", bold: true, color: NAVY }),
      new TextRun({ text: objectives })
    ]}),
    new Paragraph({ spacing: { after: 160 }, children: [
      new TextRun({ text: "Success Criteria: ", bold: true, color: NAVY }),
      new TextRun({ text: criteria })
    ]}),

    sectionHeading("3. Procedural Execution Plan"),
    buildProceduralTable(framework, { topic, resources, strategy, criteria }),

    sectionHeading("4. Three-Tier Differentiation & Scaffolding Matrix"),
    buildDifferentiationTable(differentiation),

    sectionHeading("5. Teacher TTT-Reduction Self-Audit Checklist"),
    buildAuditTable(),

    new Paragraph({
      spacing: { before: 200 },
      border: { top: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 6 } },
      children: [
        new TextRun({ text: `Total lesson time: ${talk.minutes} minutes (${framework.fullName}).`, color: NAVY })
      ]
    })
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20 } // 10pt body text throughout (title stays at its own 18pt)
        }
      }
    },
    sections: [{
      properties: {
        page: {
          // A4 portrait dimensions (11906 x 16838 DXA); docx swaps them for LANDSCAPE.
          size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
          margin: { top: 700, bottom: 700, left: 700, right: 700 }
        }
      },
      children
    }]
  });

  const filename = `Grade${grade}-English-${date}.docx`;
  return Packer.toBuffer(doc).then((buffer) => ({ buffer, filename }));
}

module.exports = { generateLessonPlanDocx, todayISO };
