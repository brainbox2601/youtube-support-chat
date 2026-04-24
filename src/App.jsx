// ─────────────────────────────────────────────────────────────────
// src/App.jsx
// Routes:
//   /chat   → CustomerChat  (the link you share in your video)
//   /agent  → AgentDashboard (your private phone dashboard)
// ─────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CustomerChat    from "./pages/CustomerChat";
import AgentDashboard  from "./pages/AgentDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer-facing page — share this link in your video */}
        <Route path="/chat"  element={<CustomerChat />} />

        {/* Agent dashboard — only you access this */}
        <Route path="/agent-x7k92p" element={<AgentDashboard />} />

        {/* Default: redirect to customer chat */}
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
