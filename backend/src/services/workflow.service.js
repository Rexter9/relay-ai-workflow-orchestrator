const crypto = require("crypto");
const Workflow = require("../db/models/Workflow");
const Run = require("../db/models/run");
const Step = require("../db/models/Step");
const Approval = require("../db/models/Approval");

const generateSecret = () => crypto.randomBytes(24).toString("hex");

const createWorkflow = async (data) => {
  const workflow = new Workflow({
    ...data,
    status: "draft",
    webhookSecret: generateSecret(),
  });
  await workflow.save();
  return workflow;
};

const listWorkflows = async () => {
  return await Workflow.find().sort({ createdAt: -1 });
};

const getWorkflowById = async (id) => {
  const workflow = await Workflow.findById(id);
  if (!workflow) {
    const err = new Error("Workflow not found");
    err.statusCode = 404;
    throw err;
  }
  return workflow;
};

const updateWorkflow = async (id, data) => {
  const workflow = await getWorkflowById(id);

  // Published workflows are immutable — editing would break the "frozen
  // snapshot" guarantee that already-running and completed runs rely on.
  if (workflow.status === "published") {
    const err = new Error("Cannot edit a published workflow. Create a new one instead.");
    err.statusCode = 400;
    throw err;
  }

  Object.assign(workflow, data);
  await workflow.save();
  return workflow;
};

const publishWorkflow = async (id) => {
  const workflow = await getWorkflowById(id);

  if (!workflow.nodes || workflow.nodes.length === 0) {
    const err = new Error("Cannot publish a workflow with no nodes");
    err.statusCode = 400;
    throw err;
  }

  workflow.status = "published";
  await workflow.save();
  return workflow;
};

// Deletes the workflow and everything that was ever run from it — its
// runs, each run's step trace, and any approval records tied to those
// runs. Without this cleanup, deleting a workflow would leave orphaned
// documents in the runs/steps/approvals collections forever.
const deleteWorkflow = async (id) => {
  const workflow = await getWorkflowById(id);

  const runs = await Run.find({ workflowId: id }).select("_id");
  const runIds = runs.map((r) => r._id);

  if (runIds.length > 0) {
    await Step.deleteMany({ runId: { $in: runIds } });
    await Approval.deleteMany({ runId: { $in: runIds } });
    await Run.deleteMany({ _id: { $in: runIds } });
  }

  await Workflow.findByIdAndDelete(id);

  return { deletedWorkflowId: id, deletedRuns: runIds.length };
};

module.exports = {
  createWorkflow,
  listWorkflows,
  getWorkflowById,
  updateWorkflow,
  publishWorkflow,
  deleteWorkflow,
  generateSecret,
};