import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import { listApprovals, decideApproval } from "../lib/api";

// One pending approval — a human decides here, which is what actually
// lets the paused run resume (see approval.service.js on the backend:
// the AI itself can never make this decision, only this real API call can).
const ApprovalCard = ({ approval, onDecided }) => {
  const [decidedBy, setDecidedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleDecide = async (decision) => {
    setBusy(true);
    setError("");
    try {
      await decideApproval(approval._id, decision, decidedBy || "console-user", notes);
      onDecided();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setBusy(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-white border border-gray-200 rounded-xl p-5 shadow-soft"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
          pending
        </span>
        <span className="text-xs text-gray-400">node: {approval.nodeId}</span>
      </div>

      <p className="text-sm text-gray-600 mt-2">
        Run <span className="font-mono text-xs">{approval.runId}</span> is paused here, waiting
        for a human decision.
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Requested {new Date(approval.requestedAt).toLocaleString()}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <input
          value={decidedBy}
          onChange={(e) => setDecidedBy(e.target.value)}
          placeholder="Your name"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
        />
      </div>

      {error && <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => handleDecide("approved")}
          disabled={busy}
          className="flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Approve
        </button>
        <button
          onClick={() => handleDecide("rejected")}
          disabled={busy}
          className="flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          Reject
        </button>
      </div>
    </motion.div>
  );
};

const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      const data = await listApprovals();
      setApprovals(data);
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
      <p className="text-sm text-gray-500 mb-6">
        Runs paused at an approval node, waiting for a real human decision before they can
        continue.
      </p>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Loading approvals…</div>
      ) : approvals.length === 0 ? (
        <div className="text-sm text-gray-400">Nothing pending right now.</div>
      ) : (
        <div className="space-y-3">
          {approvals.map((ap) => (
            <ApprovalCard key={ap._id} approval={ap} onDecided={refresh} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Approvals;