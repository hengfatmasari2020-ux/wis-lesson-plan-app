// Fixed coaching checklist appended to every generated lesson plan, reminding
// teachers of standard low-TTT (teacher talk time) practice. Not derived from
// the teacher's inputs — this is the same generic guidance on every plan.

const TT_REDUCTION_CHECKLIST = [
  {
    checkpoint: "Elicitation vs. Explanation",
    flaw: "Explaining rules or vocabulary directly instead of eliciting them from students.",
    solution: "Use guided questions and visual or contextual clues so students deduce the target language themselves."
  },
  {
    checkpoint: "Instruction Delivery",
    flaw: "Giving open-ended verbal instructions without checking understanding.",
    solution: "Use a single clear instruction plus an ICQ (Instruction Checking Question) before releasing students to the task."
  },
  {
    checkpoint: "Classroom Interaction",
    flaw: "Whole-class, teacher-to-student interrogation for most of the lesson.",
    solution: "Maximise pair and group work so most talk time belongs to students, not the teacher."
  },
  {
    checkpoint: "Error Correction",
    flaw: "Interrupting students mid-sentence to correct language.",
    solution: "Note errors silently during the task and address the common ones together afterwards."
  }
];

module.exports = { TT_REDUCTION_CHECKLIST };
