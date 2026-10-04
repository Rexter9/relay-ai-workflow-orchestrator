const runService = require("../services/run.service");

const listRuns = async (req, res) => {
  try {
    // Optional query param: /runs?workflowId=...
    const runs = await runService.listRuns(req.query.workflowId);
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRun = async (req, res) => {
  try {
    const result = await runService.getRunWithSteps(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const deleteRun = async (req, res) => {
  try {
    const result = await runService.deleteRun(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = { listRuns, getRun, deleteRun };