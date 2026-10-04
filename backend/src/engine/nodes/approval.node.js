const Approval = require("../../db/models/Approval");

const execute = async (config, context, { runId, nodeId }) => {
  let approval = await Approval.findOne({ runId, nodeId });

  if (!approval) {
    approval = new Approval({
      runId,
      nodeId,
      status: "pending",
    });
    await approval.save();
  }

  if (approval.status === "pending") {
    return { __pauseForApproval: true, approvalId: approval._id };
  }

  if (approval.status === "rejected") {
    throw new Error(`Approval rejected${approval.notes ? `: ${approval.notes}` : ""}`);
  }

  return { approved: true, approvalId: approval._id, decidedBy: approval.decidedBy };
};

module.exports = { execute };