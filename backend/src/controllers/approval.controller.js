const approvalService = require("../services/approval.service");

// GET /approvals
const listPendingApprovals = async (req, res) => {
  try {
    const approvals = await approvalService.listPendingApprovals();
    res.status(200).json(approvals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /approvals/:id/decide
const decideApproval = async (req, res) => {
  try {
    const { decision, decidedBy, notes } = req.body;
    const approval = await approvalService.decideApproval(req.params.id, decision, decidedBy, notes);
    res.status(200).json(approval);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = { listPendingApprovals, decideApproval };