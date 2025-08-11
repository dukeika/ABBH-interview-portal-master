const STAGES = ["APPLIED", "WRITTEN", "VIDEO", "FINAL"];

function nextStage(current) {
  const i = STAGES.indexOf(current);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : current;
}

function prevStage(current) {
  const i = STAGES.indexOf(current);
  return i > 0 ? STAGES[i - 1] : current;
}

module.exports = { STAGES, nextStage, prevStage };
