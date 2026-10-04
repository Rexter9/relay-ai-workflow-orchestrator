const express = require("express");
const router = express.Router();
const runController = require("../controllers/run.controller");

router.get("/", runController.listRuns);
router.get("/:id", runController.getRun);
router.delete("/:id", runController.deleteRun);

module.exports = router;