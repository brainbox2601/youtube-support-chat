// ─────────────────────────────────────────────────────────────────
// src/pages/AgentDashboard.jsx
// Your private phone dashboard.
// See all customer chats in real time and reply.
// ─────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";
import {
  listenToAllChats,
  listenToMessages,
  sendMessage,
  markChatAsRead,
  closeChat,
} from "../firebase";
import MessageBubble   from "../components/MessageBubble";
import TypingIndicator from "../components/TypingIndicator";
import { renameCustomer } from "../firebase";

const AGENT_AVATAR = "https://i.pravatar.cc/100?img=8";
const AGENT_UID    = "AGENT"; // Fixed ID for the agent
const EMOJIS = ["😊","👍","🙏","❤️","🔥","✅","😢","😮","🎉","💯","🤝","⚡","👋","🔍","⏳"];

const QUICK_REPLIES = [
  "On it! 🔍",
  "Can you share your order #?",
  "I'll escalate this now ✅",
  "Give me a moment...",
  "Could you share a screenshot?",
];

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AgentDashboard() {
  const [chats, setChats]               = useState([]);
  const [activeChat, setActiveChat]     = useState(null);
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [showEmoji, setShowEmoji]       = useState(false);
  const [agentStatus, setAgentStatus]   = useState("online");
  const [search, setSearch]             = useState("");
  const [showSearch, setShowSearch]     = useState(false);
  const [filter, setFilter]             = useState("all");
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [sending, setSending]           = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState("");

  const feedRef   = useRef(null);
  const inputRef  = useRef(null);
  const unsubMsgs = useRef(null);
  const MAX       = 200;

  const totalUnread = chats.reduce((sum, c) => sum + (c.unread || 0), 0);

  // ── Listen to all chats (real-time) ────────────────────────────
  useEffect(() => {
    const unsub = listenToAllChats((allChats) => {
      setChats(allChats);
    });
    return () => unsub();
  }, []);

  // ── Open a chat thread ──────────────────────────────────────────
  const openChat = useCallback((chat) => {
    setActiveChat(chat);
    setShowEmoji(false);
    setShowChatMenu(false);
    setMessages([]);

    // Stop previous listener
    if (unsubMsgs.current) unsubMsgs.current();

    // Start real-time listener for this chat's messages
    unsubMsgs.current = listenToMessages(chat.id, (msgs) => {
      setMessages(msgs);
    });

    // Mark as read
    markChatAsRead(chat.id);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
  }, []);

  // Cleanup message listener on unmount
  useEffect(() => {
    return () => { if (unsubMsgs.current) unsubMsgs.current(); };
  }, []);

  // ── Auto scroll ─────────────────────────────────────────────────
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ── Send reply ──────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !activeChat || sending) return;

    setSending(true);
    setInput("");
    setShowEmoji(false);

    try {
      await sendMessage({
        chatId:     activeChat.id,
        text,
        senderId:   AGENT_UID,
        senderType: "agent",
        senderName: "Support Agent",
      });
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, activeChat, sending]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };
   const handleRename = async () => {
  if (!nameInput.trim() || !activeChat) return;
  await renameCustomer(activeChat.id, nameInput.trim());
  setChats(prev => prev.map(c =>
    c.id === activeChat.id ? { ...c, displayName: nameInput.trim() } : c
  ));
  setActiveChat(prev => ({ ...prev, displayName: nameInput.trim() }));
  setEditingName(false);
  setNameInput("");
};
  // ── Close/resolve a chat ────────────────────────────────────────
  const handleCloseChat = async (chatId) => {
    await closeChat(chatId);
    setShowChatMenu(false);
    if (activeChat?.id === chatId) {
      setActiveChat(prev => ({ ...prev, status: "closed" }));
    }
  };

  // ── Filter chats ────────────────────────────────────────────────
  const filteredChats = chats.filter(c => {
    const matchSearch = !search
      || (c.customerId || "").toLowerCase().includes(search.toLowerCase())
      || (c.lastMessage || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  });

  // ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Roboto',sans-serif", background:"#0f0f0f", height:"100vh", display:"flex", flexDirection:"column", color:"#f1f1f1", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
        .chat-item { transition:background .15s; cursor:pointer; }
        .chat-item:hover { background:#1a1a1a !important; }
        .chat-item.active { background:#1e1e1e !important; border-left:3px solid #FF0000 !important; }
        .feed::-webkit-scrollbar{width:4px}
        .feed::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
        .list-scroll::-webkit-scrollbar{width:4px}
        .list-scroll::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:4px}
        textarea:focus{outline:none} textarea{resize:none} input:focus{outline:none}
        .icon-btn{transition:background .15s;border-radius:50%;display:flex;align-items:center;justify-content:center}
        .icon-btn:hover{background:rgba(255,255,255,0.1)}
        .filter-tab{transition:all .15s;cursor:pointer;border:none;background:transparent}
        .send-btn{transition:transform .15s,background .2s}
        .send-btn:active{transform:scale(.88)}
        .emoji-i:hover{background:rgba(255,255,255,0.1);border-radius:4px}
        .unread-badge{background:#FF0000;color:white;fontSize:10px;fontWeight:700;borderRadius:10px;padding:1px 6px;minWidth:18px;textAlign:center;animation:pulse 2s ease-in-out infinite}
        .quick-reply{transition:all .15s;cursor:pointer;white-space:nowrap;flex-shrink:0}
        .quick-reply:hover{border-color:#FF0000 !important;color:#f1f1f1 !important}
        .menu-item:hover{background:#2a2a2a}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background:"#111", borderBottom:"1px solid #222", padding:"0 16px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ position:"relative" }}>
            <img src={AGENT_AVATAR} alt="Agent" style={{ width:34, height:34, borderRadius:"50%", objectFit:"cover", border:"2px solid #333" }}/>
            <span style={{ position:"absolute", bottom:0, right:0, width:10, height:10, borderRadius:"50%", background: agentStatus === "online" ? "#00c853" : "#ffa000", border:"2px solid #111" }}/>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600 }}>Support Agent</div>
            <div style={{ fontSize:11, color: agentStatus === "online" ? "#00c853" : "#ffa000" }}>
              {agentStatus === "online" ? "● Online" : "● Away"}
            </div>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {totalUnread > 0 && (
            <span style={{ background:"#FF0000", color:"white", fontSize:10, fontWeight:700, borderRadius:10, padding:"2px 7px", animation:"pulse 2s ease-in-out infinite" }}>
              {totalUnread}
            </span>
          )}
          <button
            onClick={() => setAgentStatus(s => s === "online" ? "away" : "online")}
            style={{ background: agentStatus === "online" ? "#00c85322" : "#ffa00022", border:`1px solid ${agentStatus === "online" ? "#00c853" : "#ffa000"}`, color: agentStatus === "online" ? "#00c853" : "#ffa000", borderRadius:20, padding:"4px 10px", fontSize:11, fontWeight:600, fontFamily:"'Roboto',sans-serif", cursor:"pointer" }}
          >
            {agentStatus === "online" ? "Go Away" : "Go Online"}
          </button>
          <button className="icon-btn" onClick={() => setShowSearch(v => !v)}
            style={{ background:"transparent", border:"none", color:"#aaa", cursor:"pointer", padding:6 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── SEARCH ── */}
      {showSearch && (
        <div style={{ background:"#111", padding:"8px 16px", borderBottom:"1px solid #222" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"#1a1a1a", borderRadius:20, padding:"8px 14px", border:"1px solid #333" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ color:"#555", flexShrink:0 }}>
              <circle cx="11" cy="11" r="8" stroke="#555" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              style={{ flex:1, background:"transparent", border:"none", color:"#f1f1f1", fontSize:13, fontFamily:"'Roboto',sans-serif" }}/>
            {search && <button onClick={() => setSearch("")} style={{ background:"transparent", border:"none", color:"#555", cursor:"pointer" }}>✕</button>}
          </div>
        </div>
      )}

      {/* ── FILTER TABS ── */}
      <div style={{ display:"flex", background:"#111", borderBottom:"1px solid #222", padding:"0 16px", flexShrink:0 }}>
        {["all","active","closed"].map(f => (
          <button key={f} className="filter-tab"
            onClick={() => setFilter(f)}
            style={{ padding:"10px 14px", fontSize:12, fontWeight: filter === f ? 600 : 400, color: filter === f ? "#f1f1f1" : "#666", borderBottom: filter === f ? "2px solid #FF0000" : "2px solid transparent", fontFamily:"'Roboto',sans-serif", textTransform:"capitalize" }}>
            {f}
            {f === "active" && (
              <span style={{ marginLeft:5, background:"#FF000033", color:"#FF0000", borderRadius:10, padding:"1px 5px", fontSize:10, fontWeight:700 }}>
                {chats.filter(c => c.status === "active").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── BODY ── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>

        {/* ── CHAT LIST ── */}
        <div style={{ width: activeChat ? 0 : "100%", overflow:"hidden", transition:"width .25s ease", display:"flex", flexDirection:"column", background:"#0f0f0f" }}>
          <div className="list-scroll" style={{ overflowY:"auto", flex:1 }}>
            {filteredChats.length === 0 ? (
              <div style={{ padding:32, textAlign:"center", color:"#555", fontSize:13 }}>
                {chats.length === 0 ? "Waiting for customers... 👀" : "No conversations found"}
              </div>
            ) : filteredChats.map((chat, i) => (
              <div key={chat.id}
                className={`chat-item ${activeChat?.id === chat.id ? "active" : ""}`}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:"1px solid #1a1a1a", borderLeft:"3px solid transparent", background: chat.unread > 0 ? "#141414" : "transparent", animationDelay:`${i*.04}s` }}
                onClick={() => openChat(chat)}
              >
                <div style={{ position:"relative", flexShrink:0 }}>
                  <div style={{
                    width:46, height:46, borderRadius:"50%",
                    background:"#2a2a2a", border:"2px solid #222",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:16, fontWeight:700, color:"#f1f1f1",
                  }}>
                    {(chat.customerId || "?").slice(-2).toUpperCase()}
                  </div>
                  {chat.status === "active" && (
                    <span style={{ position:"absolute", bottom:1, right:1, width:11, height:11, borderRadius:"50%", background:"#00c853", border:"2px solid #0f0f0f" }}/>
                  )}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight: chat.unread > 0 ? 700 : 500, color:"#f1f1f1" }}>
                      {chat.displayName || `Customer ${(chat.customerId || "").slice(-6)}`}
                    </span>
                    <span style={{ fontSize:10, color:"#555", flexShrink:0 }}>{chat.lastMessageAt}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontSize:12, color: chat.unread > 0 ? "#aaa" : "#555", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"80%" }}>
                      {chat.lastMessage || "No messages yet"}
                    </span>
                    {chat.unread > 0 && (
                      <span style={{ background:"#FF0000", color:"white", fontSize:10, fontWeight:700, borderRadius:10, padding:"1px 6px", minWidth:18, textAlign:"center" }}>
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CHAT THREAD ── */}
        {activeChat && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#0f0f0f", animation:"fadeIn .2s ease-out", position:"absolute", inset:0, zIndex:10 }}>

            {/* Thread header */}
            <div style={{ background:"#111", borderBottom:"1px solid #222", padding:"0 12px", height:56, display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
              <button className="icon-btn" onClick={() => { setActiveChat(null); if(unsubMsgs.current) unsubMsgs.current(); }}
                style={{ background:"transparent", border:"none", color:"#aaa", cursor:"pointer", padding:6 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
              </button>

              <div style={{ width:36, height:36, borderRadius:"50%", background:"#2a2a2a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#f1f1f1", flexShrink:0 }}>
                {(activeChat.customerId || "?").slice(-2).toUpperCase()}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                {editingName ? (
  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
    <input autoFocus value={nameInput}
      onChange={e => setNameInput(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditingName(false); }}
      placeholder="Enter customer name..."
      style={{ background:"#2a2a2a", border:"1px solid #FF0000", borderRadius:6, padding:"4px 8px", color:"#f1f1f1", fontSize:13, fontFamily:"'Roboto',sans-serif", outline:"none" }}
    />
    <button onClick={handleRename} style={{ background:"#FF0000", border:"none", borderRadius:6, padding:"4px 10px", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" }}>Save</button>
    <button onClick={() => setEditingName(false)} style={{ background:"transparent", border:"none", color:"#555", cursor:"pointer", fontSize:18 }}>✕</button>
  </div>
) : (
  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
    <span style={{ fontSize:13, fontWeight:600, color:"#f1f1f1" }}>
      {activeChat.displayName || `Customer ${(activeChat.customerId || "").slice(-6)}`}
    </span>
    <button onClick={() => { setEditingName(true); setNameInput(activeChat.displayName || ""); }}
      style={{ background:"transparent", border:"none", cursor:"pointer", color:"#555", padding:2 }}>
      ✏️
    </button>
  </div>
)}
                <span style={{ fontSize:11, color: activeChat.status === "active" ? "#00c853" : "#555" }}>
                  {activeChat.status === "active" ? "● Active" : "● Closed"}
                </span>
              </div>

              {/* 3-dot menu */}
              <div style={{ position:"relative" }}>
                <button className="icon-btn" onClick={() => setShowChatMenu(v => !v)}
                  style={{ background:"transparent", border:"none", color:"#aaa", cursor:"pointer", padding:6 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                  </svg>
                </button>
                {showChatMenu && (
                  <div style={{ position:"absolute", right:0, top:36, zIndex:50, background:"#1e1e1e", border:"1px solid #333", borderRadius:8, minWidth:170, overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,0.5)" }}>
                    {[
                      { label:"Mark as resolved",  action: () => handleCloseChat(activeChat.id) },
                      { label:"Block user",         action: () => setShowChatMenu(false) },
                      { label:"Copy chat ID",       action: () => { navigator.clipboard?.writeText(activeChat.id); setShowChatMenu(false); }},
                    ].map(item => (
                      <button key={item.label} className="menu-item" onClick={item.action}
                        style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 14px", fontSize:13, color:"#ddd", background:"transparent", border:"none", cursor:"pointer", fontFamily:"'Roboto',sans-serif" }}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Resolved banner */}
            {activeChat.status === "closed" && (
              <div style={{ background:"#1a1a1a", borderBottom:"1px solid #2a2a2a", padding:"8px 16px", textAlign:"center", fontSize:12, color:"#666", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#00c853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                This conversation was marked as resolved
              </div>
            )}

            {/* Feed */}
            <div ref={feedRef} className="feed"
              style={{ flex:1, overflowY:"auto", padding:"12px", display:"flex", flexDirection:"column", gap:6 }}
              onClick={() => setShowChatMenu(false)}
            >
              <div style={{ textAlign:"center", marginBottom:8 }}>
                <span style={{ fontSize:11, color:"#555", background:"#1a1a1a", borderRadius:20, padding:"3px 10px" }}>Today</span>
              </div>

              {messages.length === 0 && (
                <div style={{ textAlign:"center", padding:"32px 16px", color:"#555", fontSize:13 }}>
                  No messages yet
                </div>
              )}

              {messages.map((msg, i) => {
                const isAgent  = msg.senderType === "agent";
                const prevSame = i > 0 && messages[i-1].senderType === msg.senderType;
                return (
                  <div key={msg.id}>
                    <MessageBubble
                      msg={msg}
                      isAgent={isAgent}
                      avatarUrl={AGENT_AVATAR}
                      senderName="You"
                      showAvatar={!prevSame}
                      showName={false}
                      theme="dark"
                    />
                  </div>
                );
              })}
            </div>

            {/* Input — only if chat is active */}
            {activeChat.status === "active" && (
              <div style={{ background:"#111", borderTop:"1px solid #222", padding:"8px 12px 12px", flexShrink:0 }}>
                {showEmoji && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4, padding:"8px 4px", marginBottom:8, background:"#1a1a1a", borderRadius:10, border:"1px solid #2a2a2a" }}>
                    {EMOJIS.map(e => (
                      <button key={e} className="emoji-i"
                        onClick={() => { if (input.length < MAX) setInput(p => p+e); inputRef.current?.focus(); }}
                        style={{ fontSize:18, padding:5, cursor:"pointer", background:"transparent", border:"none" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display:"flex", alignItems:"flex-end", gap:8, background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:24, padding:"8px 8px 8px 14px" }}>
                  <button onClick={() => setShowEmoji(v => !v)} style={{ background:"transparent", border:"none", cursor:"pointer", color: showEmoji ? "#FF0000" : "#555", padding:4, display:"flex", alignItems:"center", flexShrink:0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 110-16 8 8 0 010 16zm-3.5-6.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-3.5 3.5c1.657 0 3-1 3.5-2.5h-7c.5 1.5 1.843 2.5 3.5 2.5z"/>
                    </svg>
                  </button>

                  <textarea ref={inputRef} rows={1} maxLength={MAX} value={input}
                    onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                    placeholder="Reply to customer..."
                    style={{ flex:1, background:"transparent", border:"none", fontSize:13, color:"#f1f1f1", lineHeight:1.5, fontFamily:"'Roboto',sans-serif", maxHeight:80, overflowY:"auto" }}
                  />

                  <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                    <span style={{ fontSize:10, color:"#444" }}>{input.length}/{MAX}</span>
                    <button className="send-btn" onClick={handleSend} disabled={!input.trim() || sending}
                      style={{ background: input.trim() && !sending ? "#FF0000" : "#2a2a2a", border:"none", borderRadius:"50%", width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor: input.trim() && !sending ? "pointer" : "default" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Quick replies */}
                <div style={{ display:"flex", gap:6, marginTop:8, overflowX:"auto", paddingBottom:2 }}>
                  {QUICK_REPLIES.map(r => (
                    <button key={r} className="quick-reply"
                      onClick={() => { setInput(r); inputRef.current?.focus(); }}
                      style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:16, padding:"5px 10px", fontSize:11, color:"#888", fontFamily:"'Roboto',sans-serif" }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
