// ─────────────────────────────────────────────────────────────────
// src/components/MessageBubble.jsx
// Used by both CustomerChat and AgentDashboard
// ─────────────────────────────────────────────────────────────────

const VerifiedBadge = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#FF0000"/>
    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Props ─────────────────────────────────────────────────────────
// msg         — { id, text, senderType, time }
// isAgent     — true if the message is from the support agent
// avatarUrl   — avatar image URL
// senderName  — display name shown above the bubble
// showAvatar  — whether to show avatar (false for consecutive messages)
// showName    — whether to show the sender name label
// theme       — "light" (customer page) | "dark" (agent dashboard)

export default function MessageBubble({
  msg,
  isAgent,
  avatarUrl,
  senderName,
  showAvatar = true,
  showName   = true,
  theme      = "light",
}) {
  const isDark    = theme === "dark";
  const isRight = isAgent;
  const bubbleBg  = isRight
    ? "#FF0000"
    : isDark ? "#1e1e1e" : "#ffffff";

  const bubbleColor = isRight ? "#ffffff" : isDark ? "#f1f1f1" : "#0f0f0f";

  const borderRadius = isRight
    ? "18px 18px 4px 18px"
    : "18px 18px 18px 4px";

  const bubbleShadow = isRight
    ? "0 2px 8px rgba(255,0,0,0.2)"
    : isDark
      ? "0 1px 3px rgba(0,0,0,0.3)"
      : "0 1px 3px rgba(0,0,0,0.08)";

  const bubbleBorder = isRight
    ? "none"
    : isDark ? "1px solid #2a2a2a" : "1px solid #e8e8e8";

  return (
    <div style={{
      display:       "flex",
      flexDirection: isRight ? "row-reverse" : "row",
      alignItems:    "flex-end",
      gap:           8,
    }}>
      {/* Avatar */}
      {!isRight && (
        showAvatar
          ? <img src={avatarUrl} alt={senderName}
              style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}/>
          : <div style={{ width: 28, flexShrink: 0 }}/>
      )}

      {/* Bubble + name + time */}
      <div style={{
        maxWidth:       "75%",
        display:        "flex",
        flexDirection:  "column",
        gap:            2,
        alignItems:     isRight ? "flex-end" : "flex-start",
      }}>
        {/* Sender name */}
        {showName && !isRight && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, paddingLeft: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#FF0000" }}>
              {senderName}
            </span>
            {isAgent && <VerifiedBadge />}
          </div>
        )}

        {/* Bubble */}
        <div style={{
          background:   bubbleBg,
          color:        bubbleColor,
          borderRadius,
          padding:      "10px 14px",
          fontSize:     13,
          lineHeight:   1.5,
          wordBreak:    "break-word",
          boxShadow:    bubbleShadow,
          border:       bubbleBorder,
        }}>
          {msg.text}
        </div>

        {/* Timestamp */}
        <span style={{
          fontSize:   10,
          color:      isDark ? "#444" : "#aaa",
          paddingLeft: 4, paddingRight: 4,
        }}>
          {msg.time}
        </span>
      </div>
    </div>
  );
}