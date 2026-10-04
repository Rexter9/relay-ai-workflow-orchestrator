const triggerService = require("../services/trigger.service");

// POST /webhook/:workflowId
const handleWebhook = async (req, res) => {
  try {
    const secret = req.headers["x-relay-secret"]; // secret header se aayega
    const run = await triggerService.triggerViaWebhook(
      req.params.workflowId,
      secret,
      req.body
    );
    res.status(202).json({ message: "Run queued", runId: run._id });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// POST /trigger/manual/:workflowId
const handleManualTrigger = async (req, res) => {
  try {
    const run = await triggerService.triggerManually(req.params.workflowId, req.body);
    res.status(202).json({ message: "Run queued", runId: run._id });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  handleWebhook,
  handleManualTrigger,
};