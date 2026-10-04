const mongoose = require("mongoose");

const ApprovalSchema = new mongoose.Schema(
  {
    runId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Run",
      required: true,
    },
    nodeId: { type: String, required: true }, // The approval node waiting for a decision

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    requestedAt: { type: Date, default: Date.now },
    decidedAt: { type: Date, default: null },
    decidedBy: { type: String, default: null }, // Temporary placeholder for the approver's name or email; authentication will be added later

    notes: { type: String, default: "" }, // Optional comment provided when approving or rejecting
  },
  { timestamps: true }
);

module.exports = mongoose.model("Approval", ApprovalSchema);