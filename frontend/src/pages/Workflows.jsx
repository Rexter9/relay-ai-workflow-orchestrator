import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Zap, CheckCircle2, X, Loader2, Sparkles, Trash2, Copy, Check } from "lucide-react";
import {
  listWorkflows,
  createWorkflow,
  publishWorkflow,
  triggerManual,
  triggerWebhook,
  deleteWorkflow,
  getApiBase,
} from "../lib/api";
import { WORKFLOW_TEMPLATES } from "../lib/workflowTemplates";

const STATUS_STYLES = {
  draft: "bg-amber-50 text-amber-700",
  published: "bg-emerald-50 text-emerald-700",
};

const TAG_STYLES = {
  "Fully Automated": "bg-blue-50 text-blue-700",
  "Human Approval": "bg-violet-50 text-violet-700",
};

const EMPTY_JSON = `{
  "nodes": [
    { "id": "node_1", "type": "notify", "config": { "target": "ops", "message": "Workflow started" }, "position": { "x": 0, "y": 0 } }
  ],
  "edges": []
}`;

// One workflow card — shows its status, lets you publish a draft, or
// trigger a published workflow with a custom JSON payload.
const WorkflowCard = ({ workflow, onPublished, onTriggered, onDeleted }) => {
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [triggerMode, setTriggerMode] = useState("manual"); // "manual" | "webhook"
  const [payload, setPayload] = useState('{ "description": "test run" }');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(null); // "url" | "secret" | null

  const webhookUrl = `${getApiBase()}/webhook/${workflow._id}`;

  const handleCopy = (text, which) => {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleDelete = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await deleteWorkflow(workflow._id);
      onDeleted();
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.error || err.message });
      setBusy(false);
      setConfirmingDelete(false);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await publishWorkflow(workflow._id);
      setFeedback({ type: "success", text: "Published." });
      onPublished();
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.error || err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleTrigger = async () => {
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payload);
    } catch (err) {
      setFeedback({ type: "error", text: "Invalid JSON payload." });
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      // Manual mode calls the console-trigger endpoint directly. Webhook
      // mode calls the SAME endpoint an external system would call —
      // authenticated with the workflow's own secret in a header, not by
      // being logged into this console. This is what proves the webhook
      // path actually enforces the secret, not just the manual path.
      const result =
        triggerMode === "webhook"
          ? await triggerWebhook(workflow._id, workflow.webhookSecret, parsedPayload)
          : await triggerManual(workflow._id, parsedPayload);
      setFeedback({ type: "success", text: `Run started — ID: ${result.runId}` });
      onTriggered();
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.error || err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-5 shadow-soft"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{workflow.name}</h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                STATUS_STYLES[workflow.status] || "bg-gray-100 text-gray-600"
              }`}
            >
              {workflow.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 truncate">
            {workflow.description || "No description"}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {workflow.nodes.length} node{workflow.nodes.length !== 1 ? "s" : ""} ·{" "}
            {workflow.edges.length} edge{workflow.edges.length !== 1 ? "s" : ""} · created{" "}
            {new Date(workflow.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {workflow.status === "draft" ? (
            <button
              onClick={handlePublish}
              disabled={busy}
              className="flex items-center gap-1.5 text-sm bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Publish
            </button>
          ) : (
            <button
              onClick={() => setTriggerOpen(!triggerOpen)}
              className="flex items-center gap-1.5 text-sm bg-accent-500 hover:bg-accent-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {triggerOpen ? <X size={14} /> : <Zap size={14} />}
              {triggerOpen ? "Close" : "Trigger"}
            </button>
          )}

          {confirmingDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={busy}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete workflow"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {triggerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-gray-100">
              {/* Mode switch — this is the whole point: two different ways
                  into the same workflow, each authenticated differently. */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-3">
                <button
                  onClick={() => setTriggerMode("manual")}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                    triggerMode === "manual" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                  }`}
                >
                  Manual (console)
                </button>
                <button
                  onClick={() => setTriggerMode("webhook")}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                    triggerMode === "webhook" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                  }`}
                >
                  Webhook (external system)
                </button>
              </div>

              {triggerMode === "webhook" && (
                <div className="mb-3 space-y-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Webhook URL — give this to the external system
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 truncate">
                        {webhookUrl}
                      </code>
                      <button
                        onClick={() => handleCopy(webhookUrl, "url")}
                        className="shrink-0 text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                        title="Copy URL"
                      >
                        {copied === "url" ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Secret — sent as the x-relay-secret header
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 truncate">
                        {workflow.webhookSecret}
                      </code>
                      <button
                        onClick={() => handleCopy(workflow.webhookSecret, "secret")}
                        className="shrink-0 text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                        title="Copy secret"
                      >
                        {copied === "secret" ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    "Run now" below sends this exact request — URL + secret header + payload —
                    the same call a real external system would make. Try changing a character in
                    the secret first to see it get rejected with 401.
                  </p>
                </div>
              )}

              <label className="text-xs font-medium text-gray-500">Input payload (JSON)</label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={3}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
              />
              <button
                onClick={handleTrigger}
                disabled={busy}
                className="mt-2 flex items-center gap-1.5 text-sm bg-accent-500 hover:bg-accent-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                Run now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {feedback && (
        <div
          className={`mt-3 text-xs rounded-lg px-3 py-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {feedback.text}
        </div>
      )}
    </motion.div>
  );
};

// Template gallery — real-world starting points. Picking one just fills
// the create form below; nothing is sent to the backend until Create
// is clicked, so the user can tweak the name or payload first.
const TemplateGallery = ({ onUseTemplate }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
    {WORKFLOW_TEMPLATES.map((tpl) => (
      <motion.div
        key={tpl.key}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-xl p-4 shadow-soft flex flex-col"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent-500 shrink-0" />
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TAG_STYLES[tpl.tag]}`}>
            {tpl.tag}
          </span>
        </div>
        <h3 className="font-semibold text-gray-900 text-sm mt-2">{tpl.name}</h3>
        <p className="text-xs text-gray-500 mt-1 flex-1">{tpl.description}</p>
        <button
          onClick={() => onUseTemplate(tpl)}
          className="mt-3 text-sm text-accent-600 hover:text-accent-700 font-medium text-left"
        >
          Use this template →
        </button>
      </motion.div>
    ))}
  </div>
);

// The "create workflow" form body. Its fields are controlled by the parent
// (Workflows) so a template pick can fill them in from outside.
const CreateWorkflowPanel = ({ name, setName, description, setDescription, json, setJson, setOpen, onCreated }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (err) {
      setError("Invalid JSON in nodes/edges.");
      return;
    }

    setBusy(true);
    try {
      await createWorkflow({ name, description, ...parsed });
      setName("");
      setDescription("");
      setJson(EMPTY_JSON);
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-5 shadow-soft mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">New workflow</h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <label className="text-xs font-medium text-gray-500">Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Refund Approval Flow"
        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
      />

      <label className="text-xs font-medium text-gray-500 mt-3 block">Description</label>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description"
        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
      />

      <label className="text-xs font-medium text-gray-500 mt-3 block">Nodes + edges (JSON)</label>
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={10}
        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
      />

      {error && <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={busy}
        className="mt-3 flex items-center gap-1.5 text-sm bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Create
      </button>
    </motion.div>
  );
};

const Workflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create-form state lives here so a template pick can fill it from outside
  const [formOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formJson, setFormJson] = useState(EMPTY_JSON);

  const refresh = async () => {
    try {
      const data = await listWorkflows();
      setWorkflows(data);
      setError("");
    } catch (err) {
      setError("Could not reach the backend. Check the connection URL (top right).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleUseTemplate = (tpl) => {
    setFormName(tpl.name);
    setFormDescription(tpl.description);
    setFormJson(JSON.stringify(tpl.definition, null, 2));
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Pick a real-world template below, or build your own from scratch.
      </p>

      <TemplateGallery onUseTemplate={handleUseTemplate} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 text-sm">Your workflows</h2>
        {!formOpen && (
          <button
            onClick={() => {
              setFormName("");
              setFormDescription("");
              setFormJson(EMPTY_JSON);
              setFormOpen(true);
            }}
            className="flex items-center gap-1.5 text-sm bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            New workflow
          </button>
        )}
      </div>

      {formOpen && (
        <CreateWorkflowPanel
          name={formName}
          setName={setFormName}
          description={formDescription}
          setDescription={setFormDescription}
          json={formJson}
          setJson={setFormJson}
          setOpen={setFormOpen}
          onCreated={refresh}
        />
      )}

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Loading workflows…</div>
      ) : workflows.length === 0 ? (
        <div className="text-sm text-gray-400">No workflows yet — pick a template above.</div>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => (
            <WorkflowCard
              key={wf._id}
              workflow={wf}
              onPublished={refresh}
              onTriggered={refresh}
              onDeleted={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Workflows;