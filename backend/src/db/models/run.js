const mongoose = require("mongoose");

const RunSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },

    // A frozen snapshot of the workflow at the time it was published.
    // This prevents older runs from being affected if the workflow is updated or republished later.
    workflowSnapshot: {
      nodes: { type: mongoose.Schema.Types.Mixed, default: [] },
      edges: { type: mongoose.Schema.Types.Mixed, default: [] },
    },

    status: {
      type: String,
      enum: ["queued", "running", "waiting_approval", "completed", "failed", "rejected"],
      default: "queued",
    },

    input: { type: mongoose.Schema.Types.Mixed, default: {} }, // Trigger payload received when the run started
    output: { type: mongoose.Schema.Types.Mixed, default: null }, // Final result, if available

    currentNodeId: { type: String, default: null }, // The node currently executing or next to execute
    completedNodeIds: { type: [String], default: [] }, // Tracks completed nodes to support crash recovery

    totalStepsExecuted: { type: Number, default: 0 }, // Counter used to guard against excessive step counts

    triggeredBy: {
      type: String,
      enum: ["webhook", "manual"],
      required: true,
    },

    error: { type: String, default: null }, // Failure reason if the run failed
  },
  { timestamps: true }
);

// Avoid OverwriteModelError if this model is registered more than once.
module.exports = mongoose.models.Run || mongoose.model("Run", RunSchema);