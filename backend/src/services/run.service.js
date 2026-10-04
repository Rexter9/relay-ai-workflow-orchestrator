const Run = require("../db/models/run");
const Step = require("../db/models/Step");
const Approval = require("../db/models/Approval");

// List runs, optionally filtered by workflowId. Newest first.
const listRuns = async (workflowId) => {
  const filter = workflowId ? { workflowId } : {};
  return await Run.find(filter).sort({ createdAt: -1 }).limit(50);
};

// Get one run plus all of its step records, so the frontend can show
// the full execution trace (what each node did, in order).
const getRunWithSteps = async (runId) => {
  const run = await Run.findById(runId);
  if (!run) {
    const err = new Error("Run not found");
    err.statusCode = 404;
    throw err;
  }

  const steps = await Step.find({ runId }).sort({ startedAt: 1 });

  return { run, steps };
};

// Deletes a run along with its step trace and any approval record tied
// to it, so nothing orphaned is left behind in other collections.
const deleteRun = async (runId) => {
  const run = await Run.findById(runId);
  if (!run) {
    const err = new Error("Run not found");
    err.statusCode = 404;
    throw err;
  }

  await Step.deleteMany({ runId });
  await Approval.deleteMany({ runId });
  await Run.findByIdAndDelete(runId);

  return { deletedRunId: runId };
};

module.exports = { listRuns, getRunWithSteps, deleteRun };