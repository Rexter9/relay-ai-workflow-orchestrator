const Approval = require("../db/models/Approval");
const Run = require("../db/models/run");
const runQueue = require("../queue/runQueue");

const listPendingApprovals = async () => {
  return await Approval.find({ status: "pending" }).sort({ requestedAt: -1 });
};

const decideApproval = async (approvalId, decision, decidedBy, notes) => {
  const approval = await Approval.findById(approvalId);

  if (!approval) {
    const err = new Error("Approval not found");
    err.statusCode = 404;
    throw err;
  }

  if (approval.status !== "pending") {
    const err = new Error(`Approval already ${approval.status}`);
    err.statusCode = 400;
    throw err;
  }

  if (!["approved", "rejected"].includes(decision)) {
    const err = new Error("Decision must be 'approved' or 'rejected'");
    err.statusCode = 400;
    throw err;
  }

  approval.status = decision;
  approval.decidedAt = new Date();
  approval.decidedBy = decidedBy || "unknown";
  approval.notes = notes || "";
  await approval.save();

  // ENGINE-ENFORCED: the run only moves forward because WE push it back
  // onto the queue here, after confirming a real approval record was saved.
  // The AI never has a way to trigger this itself.
  const run = await Run.findById(approval.runId);
  if (run && run.status === "waiting_approval") {
    run.status = "queued";
    await run.save();
    await runQueue.add("execute-run", { runId: run._id.toString() });
  }

  return approval;
};

module.exports = { listPendingApprovals, decideApproval };