// ─────────────────────────────────────────────────────────────────
// src/components/TypingIndicator.jsx
// The three bouncing dots shown when agent is typing
// Props:
//   avatarUrl — avatar to show next to the dots
//   theme     — "light" | "dark"
// ─────────────────────────────────────────────────────────────────

export default function TypingIndicator({ avatarUrl, theme = "light" }) {
  const isDark = theme === "dark";

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 4 }}>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%           { transform: translateY(-5px); }
        }
        .typing-dot {
          animation: typingBounce 1.2s ease-in-out infinite;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: ${isDark ? "#555" : "#aaa"};
          display: inline-block;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .typing-dot:nth-child(3) { animation-delay: 0.30s; }
      `}</style>

      <img
        src={avatarUrl}
        alt="Typing"
        style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />

      <div style={{
        background:   isDark ? "#1e1e1e" : "#ffffff",
        border:       isDark ? "1px solid #2a2a2a" : "1px solid #e8e8e8",
        borderRadius: "18px 18px 18px 4px",
        padding:      "10px 14px",
        display:      "flex",
        alignItems:   "center",
        gap:          4,
        boxShadow:    isDark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <span className="typing-dot"/>
        <span className="typing-dot"/>
        <span className="typing-dot"/>
      </div>
    </div>
  );
}