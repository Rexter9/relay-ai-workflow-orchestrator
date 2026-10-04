const express = require("express");
const router = express.Router();
const workflowController = require("../controllers/workflow.controller");

router.post("/", workflowController.createWorkflow);
router.get("/", workflowController.listWorkflows);
router.get("/:id", workflowController.getWorkflow);
router.put("/:id", workflowController.updateWorkflow);
router.post("/:id/publish", workflowController.publishWorkflow);
router.delete("/:id", workflowController.deleteWorkflow);

module.exports = router;