const form = document.getElementById("lesson-form");
const gradeSelect = document.getElementById("grade");
const gradeNote = document.getElementById("grade-note");
const strategyInput = document.getElementById("strategy");
const frameworkNote = document.getElementById("framework-note");
const errorsBox = document.getElementById("form-errors");
const submitBtn = document.getElementById("submit-btn");
const materialUpload = document.getElementById("material-upload");
const uploadStatus = document.getElementById("upload-status");

const FIELD_IDS = {
  topic: "topic",
  resources: "resources",
  strategy: "strategy",
  objectives: "objectives",
  criteria: "criteria"
};
const DIFF_FIELD_IDS = { support: "diff-support", core: "diff-core", challenge: "diff-challenge" };
const FIELD_LABELS = {
  topic: "Unit / lesson topic",
  resources: "Resources",
  strategy: "Teaching strategy",
  objectives: "Learning Objectives",
  criteria: "Success Criteria",
  differentiation: "Differentiation"
};

materialUpload.addEventListener("change", async () => {
  const file = materialUpload.files[0];
  if (!file) return;

  uploadStatus.hidden = false;
  uploadStatus.textContent = `Reading ${file.name}…`;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/extract-resources", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not read that file.");

    const filled = [];
    const skipped = [];
    const notFound = [];

    for (const [field, elId] of Object.entries(FIELD_IDS)) {
      const el = document.getElementById(elId);
      const value = (data[field] || "").trim();
      if (!value) {
        if (field !== "resources" || !el.value.trim()) notFound.push(FIELD_LABELS[field]);
        continue;
      }
      if (el.value.trim()) {
        skipped.push(FIELD_LABELS[field]);
      } else {
        el.value = value;
        filled.push(`${FIELD_LABELS[field]} (${data.sources[field]})`);
      }
    }

    const diff = data.differentiation || {};
    let diffFilled = false;
    for (const [tier, elId] of Object.entries(DIFF_FIELD_IDS)) {
      const el = document.getElementById(elId);
      const value = (diff[tier] || "").trim();
      if (!value) continue;
      if (el.value.trim()) {
        if (!skipped.includes(FIELD_LABELS.differentiation)) skipped.push(FIELD_LABELS.differentiation);
      } else {
        el.value = value;
        diffFilled = true;
      }
    }
    if (diffFilled) filled.push(`Differentiation (${data.sources.differentiation})`);
    else if (!diff.support && !diff.core && !diff.challenge) notFound.push(FIELD_LABELS.differentiation);

    if (strategyInput.value) detectFramework();

    const parts = [];
    if (filled.length) parts.push(`Filled: ${filled.join(", ")}.`);
    if (skipped.length) parts.push(`Left as-is (already had content): ${skipped.join(", ")}.`);
    if (notFound.length) parts.push(`Not found${data.aiAvailable ? "" : " (AI extraction not configured on this server)"}: ${notFound.join(", ")}.`);
    uploadStatus.textContent = parts.length ? parts.join(" ") : "Nothing usable was found in that file.";
  } catch (err) {
    uploadStatus.textContent = `Could not extract from that file: ${err.message}`;
  } finally {
    materialUpload.value = "";
  }
});

gradeSelect.addEventListener("change", async () => {
  const grade = gradeSelect.value;
  if (!grade) {
    gradeNote.hidden = true;
    return;
  }
  try {
    const res = await fetch(`/api/frameworks/${grade}`);
    if (!res.ok) throw new Error("Could not load grade info.");
    const info = await res.json();
    gradeNote.textContent = info.subtitle;
    gradeNote.hidden = false;
  } catch (err) {
    gradeNote.hidden = true;
  }
});

let detectTimer = null;
strategyInput.addEventListener("input", () => {
  clearTimeout(detectTimer);
  detectTimer = setTimeout(detectFramework, 300);
});

async function detectFramework() {
  try {
    const res = await fetch("/api/detect-framework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategy: strategyInput.value })
    });
    if (!res.ok) throw new Error("Could not detect framework.");
    const info = await res.json();
    frameworkNote.textContent = `Detected framework: ${info.fullName} (target TTT ${info.ttt}% / STT ${info.stt}%)`;
    frameworkNote.hidden = false;
  } catch (err) {
    frameworkNote.hidden = true;
  }
}

// Show the default (PPP) detection immediately, before the teacher types anything.
detectFramework();

function showErrors(messages) {
  errorsBox.innerHTML = `<strong>Please fix the following:</strong><ul>${messages.map((m) => `<li>${m}</li>`).join("")}</ul>`;
  errorsBox.hidden = false;
}

function clearErrors() {
  errorsBox.hidden = true;
  errorsBox.innerHTML = "";
}

function clientValidate(data) {
  const errors = [];
  if (!data.grade) errors.push("Grade is required.");
  if (!data.topic.trim()) errors.push("Unit / lesson topic is required.");
  if (!data.objectives.trim()) errors.push("Cambridge Learning Objectives is required.");
  if (!data.criteria.trim()) errors.push("Success Criteria is required.");
  return errors;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const data = {
    grade: gradeSelect.value,
    topic: document.getElementById("topic").value,
    resources: document.getElementById("resources").value,
    strategy: strategyInput.value,
    objectives: document.getElementById("objectives").value,
    criteria: document.getElementById("criteria").value,
    differentiation: {
      support: document.getElementById("diff-support").value,
      core: document.getElementById("diff-core").value,
      challenge: document.getElementById("diff-challenge").value
    }
  };

  const clientErrors = clientValidate(data);
  if (clientErrors.length) {
    showErrors(clientErrors);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Generating…";

  try {
    const res = await fetch("/api/generate-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ errors: ["Something went wrong. Please try again."] }));
      showErrors(body.errors || ["Something went wrong. Please try again."]);
      return;
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match ? match[1] : `Grade${data.grade}-English-lesson-plan.docx`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    showErrors(["Could not reach the server. Please try again."]);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Generate lesson plan (.docx)";
  }
});
