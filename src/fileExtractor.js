// Extracts plain text from an uploaded lesson-material file. Pure JS only
// (no LibreOffice/Python), so this runs on Render's plain Node service.
//
// PPTX/DOCX are ZIP archives of XML; we unzip and strip tags directly rather
// than pulling in a full XML parser. PPTX slide notes are kept separate from
// slide body text because notes are continuous prose (teacher scripts) and
// parse far more reliably than slide body text, which is scattered across
// independent text boxes with no guaranteed reading order.

const JSZip = require("jszip");
const pdfParse = require("pdf-parse");

function stripTags(xml) {
  return xml
    .replace(/<\/w:p>|<\/a:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

async function extractPptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/)[1]);
      const nb = Number(b.match(/slide(\d+)\.xml/)[1]);
      return na - nb;
    });

  const slides = [];
  for (const path of slideFiles) {
    const num = Number(path.match(/slide(\d+)\.xml/)[1]);
    const xml = await zip.files[path].async("string");
    const text = stripTags(xml);

    const notesPath = `ppt/notesSlides/notesSlide${num}.xml`;
    let notes = "";
    if (zip.files[notesPath]) {
      const notesXml = await zip.files[notesPath].async("string");
      notes = stripTags(notesXml);
    }
    slides.push({ number: num, text, notes });
  }
  return { kind: "pptx", slides };
}

async function extractDocx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.files["word/document.xml"].async("string");
  return { kind: "docx", text: stripTags(xml) };
}

async function extractPdf(buffer) {
  const data = await pdfParse(buffer);
  return { kind: "pdf", text: data.text };
}

function detectKind(filename, mimetype) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  if (ext === "pptx" || mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation") return "pptx";
  if (ext === "docx" || mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (ext === "pdf" || mimetype === "application/pdf") return "pdf";
  return null;
}

async function extractFile(buffer, filename, mimetype) {
  const kind = detectKind(filename, mimetype);
  if (!kind) throw new Error(`Unsupported file type: ${filename}. Upload a .pptx, .docx, or .pdf file.`);
  if (kind === "pptx") return extractPptx(buffer);
  if (kind === "docx") return extractDocx(buffer);
  return extractPdf(buffer);
}

module.exports = { extractFile };
