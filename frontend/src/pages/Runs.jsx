import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, RefreshCw, Trash2 } from "lucide-react";
import { listRuns, getRun, deleteRun } from "../lib/api";

const STATUS_STYLES = {
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-600",
  waiting_approval: "bg-amber-50 text-amber-700",
  running: "bg-blue-50 text-blue-700",
  queued: "bg-blue-50 text-blue-700",
  rejected: "bg-red-50 text-red-600",
};

// One run row — expands to show its full step-by-step trace, fetched
// on demand so the list stays light until someone wants the detail.
const RunRow = ({ run, onDeleted }) => {
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState(null);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await deleteRun(run._id);
      onDeleted();
    } catch (err) {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const toggle = async () => {
    if (!open && steps === null) {
      setLoadingSteps(true);
      try {
        const detail = await getRun(run._id);
        setSteps(detail.steps);
      } catch (err) {
        setSteps([]);
      } finally {
        setLoadingSteps(false);
      }
    }
    setOpen(!open);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl shadow-soft overflow-hidden"
    >
      <div
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && toggle()}
        className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-400">{run._id.slice(-8)}</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                STATUS_STYLES[run.status] || "bg-gray-100 text-gray-600"
              }`}
            >
              {run.status}
            </span>
            <span className="text-xs text-gray-400">via {run.triggeredBy}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {run.totalStepsExecuted} step{run.totalStepsExecuted !== 1 ? "s" : ""} executed ·{" "}
            {new Date(run.createdAt).toLocaleString()}
          </p>
          {run.error && <p className="text-xs text-red-600 mt-1">{run.error}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {confirmingDelete ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingDelete(true);
              }}
              className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete run"
            >
              <Trash2 size={15} />
            </button>
          )}
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
              {loadingSteps ? (
                <p className="text-xs text-gray-400">Loading trace…</p>
              ) : steps.length === 0 ? (
                <p className="text-xs text-gray-400">No steps recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {steps.map((step) => (
                    <div key={step._id} className="flex items-start gap-3 text-xs">
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full font-medium ${
                          STATUS_STYLES[step.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {step.status}
                      </span>
                      <div className="min-w-0">
                        <span className="font-medium text-gray-700">{step.nodeId}</span>
                        <span className="text-gray-400"> ({step.nodeType})</span>
                        {step.error && <p className="text-red-600 mt-0.5">{step.error}</p>}
                        {step.durationMs != null && (
                          <span className="text-gray-400"> · {step.durationMs}ms</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Runs = () => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listRuns();
      setRuns(data);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          Every workflow run, newest first. Click a run to see its step-by-step trace.
        </p>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Loading runs…</div>
      ) : runs.length === 0 ? (
        <div className="text-sm text-gray-400">
          No runs yet — trigger a published workflow from the Workflows page.
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <RunRow key={run._id} run={run} onDeleted={refresh} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Runs;