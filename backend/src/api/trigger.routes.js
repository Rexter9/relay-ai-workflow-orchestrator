const express = require("express");
const router = express.Router();
const triggerController = require("../controllers/trigger.controller");

router.post("/webhook/:workflowId", triggerController.handleWebhook);
router.post("/trigger/manual/:workflowId", triggerController.handleManualTrigger);

module.exports = router;