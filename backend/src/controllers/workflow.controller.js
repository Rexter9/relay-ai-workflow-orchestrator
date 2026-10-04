const workflowService = require("../services/workflow.service");

const createWorkflow = async (req, res) => {
  try {
    const workflow = await workflowService.createWorkflow(req.body);
    res.status(201).json(workflow);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const listWorkflows = async (req, res) => {
  try {
    const workflows = await workflowService.listWorkflows();
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getWorkflow = async (req, res) => {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id);
    res.json(workflow);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const updateWorkflow = async (req, res) => {
  try {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.body);
    res.json(workflow);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const publishWorkflow = async (req, res) => {
  try {
    const workflow = await workflowService.publishWorkflow(req.params.id);
    res.json(workflow);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const deleteWorkflow = async (req, res) => {
  try {
    const result = await workflowService.deleteWorkflow(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  createWorkflow,
  listWorkflows,
  getWorkflow,
  updateWorkflow,
  publishWorkflow,
  deleteWorkflow,
};