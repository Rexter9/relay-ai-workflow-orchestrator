import { useState } from "react";
import { Settings, Check } from "lucide-react";
import { getApiBase, setApiBase } from "../lib/api";

const Topbar = ({ title }) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(getApiBase());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiBase(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    setOpen(false);
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-8">
      <h1 className="text-[17px] font-semibold text-gray-900">{title}</h1>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Settings size={16} />
          Backend connection
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-card p-4 z-20">
            <label className="text-xs font-medium text-gray-500">Backend URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
            />
            <button
              onClick={handleSave}
              className="mt-3 w-full bg-accent-500 hover:bg-accent-600 text-white text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              {saved ? <Check size={14} /> : null}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;