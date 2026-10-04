import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Workflow, PlayCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { listWorkflows, listRuns, listApprovals } from "../lib/api";

// A single stat card — reused for each metric on the overview page
const StatCard = ({ icon: Icon, label, value, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay }}
    className="bg-white border border-gray-200 rounded-xl p-5 shadow-soft"
  >
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
        <Icon size={15} className="text-accent-600" />
      </div>
    </div>
    <div className="text-2xl font-semibold text-gray-900 mt-3">{value}</div>
  </motion.div>
);

const Overview = () => {
  const [stats, setStats] = useState({
    workflows: 0,
    published: 0,
    runs: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [workflows, runs, approvals] = await Promise.all([
          listWorkflows(),
          listRuns(),
          listApprovals(),
        ]);
        setStats({
          workflows: workflows.length,
          published: workflows.filter((w) => w.status === "published").length,
          runs: runs.length,
          pendingApprovals: approvals.length,
        });
      } catch (err) {
        setError("Could not reach the backend. Check the connection URL (top right).");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">
        A quick snapshot of everything running through Relay right now.
      </p>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Workflow} label="Total workflows" value={loading ? "—" : stats.workflows} delay={0} />
        <StatCard icon={CheckCircle2} label="Published" value={loading ? "—" : stats.published} delay={0.05} />
        <StatCard icon={PlayCircle} label="Total runs" value={loading ? "—" : stats.runs} delay={0.1} />
        <StatCard
          icon={ShieldCheck}
          label="Pending approvals"
          value={loading ? "—" : stats.pendingApprovals}
          delay={0.15}
        />
      </div>
    </div>
  );
};

export default Overview;