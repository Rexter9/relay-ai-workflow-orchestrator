const express = require("express");
const router = express.Router();
const approvalController = require("../controllers/approval.controller");

router.get("/", approvalController.listPendingApprovals);
router.post("/:id/decide", approvalController.decideApproval);

module.exports = router;