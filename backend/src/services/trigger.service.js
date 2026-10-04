// const Workflow = require("../db/models/Workflow");
// const Run = require("../db/models/run");

// Shared logic — both webhook and manual triggers use the same flow.
// const createRun = async (workflowId, payload, triggeredBy) => {
//   const workflow = await Workflow.findById(workflowId);

//   if (!workflow) {
//     const err = new Error("Workflow not found");
//     err.statusCode = 404;
//     throw err;
//   }

//   if (workflow.status !== "published") {
//     const err = new Error("Only published workflows can be triggered");
//     err.statusCode = 400;
//     throw err;
//   }

//   // Save a frozen snapshot of the workflow so later updates do not affect active runs.
//   const run = new Run({
//     workflowId: workflow._id,
//     workflowSnapshot: {
//       nodes: workflow.nodes,
//       edges: workflow.edges,
//     },
//     input: payload || {},
//     status: "queued",
//     triggeredBy,
//   });

//   return await run.save();

//   // Note: queueing is handled in the background execution step once BullMQ + Redis are configured.
// };

const Workflow = require("../db/models/Workflow");
const Run = require("../db/models/run");
const runQueue = require("../queue/runQueue");

const createRun = async (workflowId, payload, triggeredBy) => {
  const workflow = await Workflow.findById(workflowId);

  if (!workflow) {
    const err = new Error("Workflow not found");
    err.statusCode = 404;
    throw err;
  }

  if (workflow.status !== "published") {
    const err = new Error("Only published workflows can be triggered");
    err.statusCode = 400;
    throw err;
  }

  const run = new Run({
    workflowId: workflow._id,
    workflowSnapshot: {
      nodes: workflow.nodes,
      edges: workflow.edges,
    },
    input: payload || {},
    status: "queued",
    triggeredBy,
  });

  await run.save();

  // Add the job to the background queue for asynchronous execution.
  await runQueue.add("execute-run", { runId: run._id.toString() });

  return run;
};

// Webhook trigger — after verifying the secret.
const triggerViaWebhook = async (workflowId, secret, payload) => {
  const workflow = await Workflow.findById(workflowId);

  if (!workflow) {
    const err = new Error("Workflow not found");
    err.statusCode = 404;
    throw err;
  }

  if (workflow.webhookSecret !== secret) {
    const err = new Error("Invalid webhook secret");
    err.statusCode = 401;
    throw err;
  }

  return await createRun(workflowId, payload, "webhook");
};

// Manual trigger — used for testing or demo flows without a secret check.
const triggerManually = async (workflowId, payload) => {
  return await createRun(workflowId, payload, "manual");
};

module.exports = {
  triggerViaWebhook,
  triggerManually,
};