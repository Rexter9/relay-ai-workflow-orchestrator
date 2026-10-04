const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./db");
require("./queue/redisConnection");
const workflowRoutes = require("./api/workflow.routes");
const triggerRoutes = require("./api/trigger.routes");
const approvalRoutes = require("./api/approval.routes");
const runRoutes = require("./api/run.routes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Relay backend is running 🚀" });
});

app.use("/workflows", workflowRoutes);
app.use("/", triggerRoutes);
app.use("/approvals", approvalRoutes);
app.use("/runs", runRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Relay backend running on http://localhost:${PORT}`);
});