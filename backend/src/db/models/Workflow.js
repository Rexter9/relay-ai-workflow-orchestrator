const mongoose = require("mongoose");

// A single node structure. This is generic and can represent any node type.
const NodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // Unique node ID within the workflow (for example, "node_1")
    type: {
      type: String,
      required: true,
      enum: ["http_request", "condition", "delay", "notify", "ai", "approval"],
    },
    config: { type: mongoose.Schema.Types.Mixed, default: {} }, // Node settings such as URL, prompt, and condition expressions
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    }, // Used to position the node on the frontend canvas
  },
  { _id: false }
);

// A workflow edge connecting two nodes in the DAG.
const EdgeSchema = new mongoose.Schema(
  {
    from: { type: String, required: true }, // Source node ID
    to: { type: String, required: true }, // Target node ID
    condition: { type: String, default: null }, // Optional branch condition for condition nodes ("true"/"false")
  },
  { _id: false }
);

const WorkflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },

    nodes: { type: [NodeSchema], default: [] },
    edges: { type: [EdgeSchema], default: [] },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    webhookSecret: { type: String }, // Protects the webhook trigger

    createdBy: { type: String, default: "system" }, // Temporary simple owner field; authentication will be added later
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("Workflow", WorkflowSchema);