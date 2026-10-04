const mongoose = require("mongoose");

const StepSchema = new mongoose.Schema(
  {
    runId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Run",
      required: true,
    },

    nodeId: { type: String, required: true }, // The node ID from the workflow's nodes array
    nodeType: { type: String, required: true }, // http_request / ai / approval / etc.

    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },

    input: { type: mongoose.Schema.Types.Mixed, default: {} }, // Resolved input for this step
    output: { type: mongoose.Schema.Types.Mixed, default: null }, // Result of this step

    attempt: { type: Number, default: 1 }, // Retry count
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    durationMs: { type: Number, default: null },

    // Additional trace information for AI nodes
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
    },

    idempotencyKey: { type: String, default: null }, // Unique key for side-effect calls

    error: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Step", StepSchema);