import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Overview from "./pages/Overview";
import Workflows from "./pages/Workflows";
import Runs from "./pages/Runs";
import Approvals from "./pages/Approvals";

// Small helper so every page fades/slides in the same subtle way —
// consistent, not flashy. This is what makes transitions feel intentional
// rather than like a random animation library demo.
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.18, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const pageTitles = {
  "/": "Overview",
  "/workflows": "Workflows",
  "/runs": "Runs",
  "/approvals": "Approvals",
};

function App() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Relay";

  return (
    <div className="flex min-h-screen bg-[#f8f9fb]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={title} />
        <main className="flex-1 px-8 py-8">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <PageTransition>
                    <Overview />
                  </PageTransition>
                }
              />
              <Route
                path="/workflows"
                element={
                  <PageTransition>
                    <Workflows />
                  </PageTransition>
                }
              />
              <Route
                path="/runs"
                element={
                  <PageTransition>
                    <Runs />
                  </PageTransition>
                }
              />
              <Route
                path="/approvals"
                element={
                  <PageTransition>
                    <Approvals />
                  </PageTransition>
                }
              />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;