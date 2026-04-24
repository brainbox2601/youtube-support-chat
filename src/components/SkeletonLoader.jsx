// ─────────────────────────────────────────────────────────────────
// src/components/SkeletonLoader.jsx
// Pulsing placeholder shown while Firebase loads
// Props:
//   theme — "light" | "dark"
// ─────────────────────────────────────────────────────────────────

const SkeletonBlock = ({ width, height, radius = 4, theme }) => (
  <div style={{
    width,
    height,
    borderRadius: radius,
    background: theme === "dark" ? "#1e1e1e" : "#e8e8e8",
    animation: "skPulse 1.4s ease-in-out infinite",
  }}/>
);

const SkeletonMessage = ({ align = "left", theme }) => (
  <div style={{
    display:        "flex",
    flexDirection:  align === "right" ? "row-reverse" : "row",
    alignItems:     "flex-end",
    gap:            10,
    padding:        "6px 16px",
  }}>
    {align === "left" && (
      <SkeletonBlock width={30} height={30} radius={50} theme={theme}/>
    )}
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: "60%" }}>
      {align === "left" && <SkeletonBlock width={80} height={10} theme={theme}/>}
      <SkeletonBlock
        width={align === "right" ? 130 : 170}
        height={38}
        radius={16}
        theme={theme}
      />
    </div>
  </div>
);

export default function SkeletonLoader({ theme = "light" }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes skPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      {/* Welcome banner skeleton */}
      <div style={{
        margin:       "12px 12px 0",
        background:   theme === "dark" ? "#111" : "#fff",
        border:       `1px solid ${theme === "dark" ? "#222" : "#f0f0f0"}`,
        borderRadius: 12,
        padding:      16,
        display:      "flex",
        alignItems:   "center",
        gap:          12,
      }}>
        <SkeletonBlock width={44} height={44} radius={50} theme={theme}/>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <SkeletonBlock width={130} height={12} theme={theme}/>
          <SkeletonBlock width={90}  height={10} theme={theme}/>
        </div>
      </div>

      {/* Message skeletons */}
      <div style={{ marginTop: 12 }}>
        <SkeletonMessage align="left"  theme={theme}/>
        <SkeletonMessage align="right" theme={theme}/>
        <SkeletonMessage align="left"  theme={theme}/>
        <SkeletonMessage align="right" theme={theme}/>
      </div>
    </div>
  );
}