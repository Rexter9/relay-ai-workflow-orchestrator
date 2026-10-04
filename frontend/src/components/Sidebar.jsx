import { NavLink } from "react-router-dom";
import { LayoutGrid, Workflow, PlayCircle, ShieldCheck } from "lucide-react";

// Nav items — simple, no icons-as-decoration overload, just clear labels
const navItems = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/workflows", label: "Workflows", icon: Workflow },
  { to: "/runs", label: "Runs", icon: PlayCircle },
  { to: "/approvals", label: "Approvals", icon: ShieldCheck },
];

const Sidebar = () => {
  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent-500 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">R</span>
          </div>
          <span className="text-[15px] font-semibold text-gray-900">Relay</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Workflow Orchestrator</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-accent-50 text-accent-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-gray-100 text-xs text-gray-400">
        Capstone Project — Mohd Faiz
      </div>
    </aside>
  );
};

export default Sidebar;