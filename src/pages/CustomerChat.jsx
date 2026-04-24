// ─────────────────────────────────────────────────────────────────
// src/pages/CustomerChat.jsx
// ─────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";
import { signInCustomer, getOrCreateChat, sendMessage, listenToMessages } from "../firebase";
import MessageBubble   from "../components/MessageBubble";
import TypingIndicator from "../components/TypingIndicator";

const AGENT_AVATAR = "https://i.pravatar.cc/100?img=8";
const EMOJIS = ["😊","👍","🙏","❤️","🔥","✅","😢","😮","🎉","💯","🤝","⚡"];

// ── YouTube Logo ──────────────────────────────────────────────────
const YouTubeLogo = ({ height = 18 }) => (
  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
    <svg height={height} viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 0 14.285 0 14.285 0C14.285 0 5.35042 0 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C0 5.35042 0 10 0 10C0 10 0 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5701 5.35042 27.9727 3.12324Z" fill="#FF0000"/>
      <path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white"/>
    </svg>
    <span style={{ fontSize:height, fontWeight:700, color:"#282828", letterSpacing:"-0.5px" }}>YouTube</span>
  </div>
);

const VerifiedBadge = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#FF0000"/>
    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function timeNow() {
  return new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

// ── WELCOME SCREEN ────────────────────────────────────────────────
function WelcomeScreen({ onStart }) {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [subject, setSubject] = useState("");
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim())                       e.name    = "Please enter your name";
    if (!email.trim())                      e.email   = "Please enter your email";
    else if (!/\S+@\S+\.\S+/.test(email))  e.email   = "Please enter a valid email";
    if (!subject.trim())                    e.subject = "Please describe your issue";
    return e;
  };

  const handleStart = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setLoading(true);
    await onStart({ name: name.trim(), email: email.trim(), subject: subject.trim() });
  };

  const inputStyle = (hasError) => ({
    width:"100%", padding:"12px 14px", fontSize:14,
    fontFamily:"'Roboto',sans-serif",
    border:`1.5px solid ${hasError ? "#FF0000" : "#e0e0e0"}`,
    borderRadius:8, background:"#fafafa", color:"#0f0f0f",
    outline:"none", transition:"border-color .2s",
  });

  return (
    <div style={{ fontFamily:"'Roboto',sans-serif", background:"#f9f9f9", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .welcome-card { animation: fadeUp .4s ease-out forwards; }
        input:focus, textarea:focus { outline:none; border-color:#FF0000 !important; }
        textarea { resize:none; }
        .start-btn:hover { background:#cc0000 !important; transform:translateY(-1px); box-shadow:0 4px 12px rgba(255,0,0,0.3); }
        .start-btn { transition:all .2s; }
        .back:hover { background:#f0f0f0; border-radius:4px; }
      `}</style>

      {/* Nav */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e5e5", padding:"0 16px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
        <button className="back" style={{ display:"flex", alignItems:"center", gap:4, color:"#606060", fontSize:13, padding:"6px 10px", border:"none", background:"transparent", cursor:"pointer", fontFamily:"'Roboto',sans-serif" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#606060">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back to video
        </button>
        <YouTubeLogo height={18}/>
        <div style={{ width:100 }}/>
      </div>

      {/* Card */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px" }}>
        <div className="welcome-card" style={{ background:"#fff", borderRadius:16, padding:"32px 28px", maxWidth:480, width:"100%", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", border:"1px solid #f0f0f0" }}>

          {/* Agent */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <img src={AGENT_AVATAR} alt="Agent" style={{ width:56, height:56, borderRadius:"50%", objectFit:"cover", border:"3px solid #f0f0f0" }}/>
              <span style={{ position:"absolute", bottom:2, right:2, width:13, height:13, borderRadius:"50%", background:"#00c853", border:"2.5px solid #fff" }}/>
            </div>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                <span style={{ fontWeight:700, fontSize:16, color:"#0f0f0f" }}>YouTube Support</span>
                <VerifiedBadge/>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:"#00c853", display:"inline-block" }}/>
                <span style={{ fontSize:12, color:"#00a040", fontWeight:500 }}>Online now</span>
                <span style={{ fontSize:12, color:"#aaa" }}>· Replies in minutes</span>
              </div>
            </div>
          </div>

          <h2 style={{ fontSize:20, fontWeight:700, color:"#0f0f0f", marginBottom:6 }}>👋 How can we help?</h2>
          <p style={{ fontSize:13, color:"#606060", marginBottom:24, lineHeight:1.5 }}>
            Fill in your details and we'll connect you with a support agent right away.
          </p>

          {/* Name */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:600, color:"#444", display:"block", marginBottom:6 }}>Full Name *</label>
            <input type="text" placeholder="e.g. John Smith" value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name:"" })); }}
              style={inputStyle(errors.name)}/>
            {errors.name && <span style={{ fontSize:11, color:"#FF0000", marginTop:4, display:"block" }}>{errors.name}</span>}
          </div>

          {/* Email */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:600, color:"#444", display:"block", marginBottom:6 }}>Email Address *</label>
            <input type="email" placeholder="e.g. john@email.com" value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email:"" })); }}
              style={inputStyle(errors.email)}/>
            {errors.email && <span style={{ fontSize:11, color:"#FF0000", marginTop:4, display:"block" }}>{errors.email}</span>}
          </div>

          {/* Subject */}
          <div style={{ marginBottom:28 }}>
            <label style={{ fontSize:12, fontWeight:600, color:"#444", display:"block", marginBottom:6 }}>What do you need help with? *</label>
            <textarea rows={3} placeholder="e.g. My monetization dashboard isn't loading..." value={subject}
              onChange={e => { setSubject(e.target.value); setErrors(p => ({ ...p, subject:"" })); }}
              style={{ ...inputStyle(errors.subject), lineHeight:1.5 }}/>
            {errors.subject && <span style={{ fontSize:11, color:"#FF0000", marginTop:4, display:"block" }}>{errors.subject}</span>}
          </div>

          {/* Submit */}
          <button className="start-btn" onClick={handleStart} disabled={loading}
            style={{ width:"100%", background:"#FF0000", color:"#fff", border:"none", borderRadius:10, padding:"14px", fontSize:15, fontWeight:700, cursor: loading ? "wait" : "pointer", fontFamily:"'Roboto',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {loading ? "Connecting..." : (
              <>
                Start Live Chat
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </>
            )}
          </button>

          {/* Footer */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:16 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#aaa">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            <span style={{ fontSize:11, color:"#aaa" }}>Powered by <strong style={{ color:"#FF0000" }}>YouTube Support API</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
export default function CustomerChat() {
  const [screen, setScreen]           = useState("welcome");
  const [customer, setCustomer]       = useState(null);
  const [progress, setProgress]       = useState(0);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [showEmoji, setShowEmoji]     = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [authReady, setAuthReady]     = useState(false);
  const [error, setError]             = useState(null);

  const chatIdRef = useRef(null);
  const userRef   = useRef(null);
  const feedRef   = useRef(null);
  const inputRef  = useRef(null);
  const unsubRef  = useRef(null);
  const prevMsgs  = useRef([]);
  const MAX       = 200;

  const handleStart = async ({ name, email, subject }) => {
    setCustomer({ name, email, subject });
    let prog = 0;
    const iv = setInterval(() => {
      prog += Math.random() * 20;
      if (prog >= 90) { clearInterval(iv); prog = 90; }
      setProgress(prog);
    }, 120);

    try {
      const user   = await signInCustomer();
      userRef.current = user;
      const chatId = await getOrCreateChat(user.uid);
      chatIdRef.current = chatId;

      unsubRef.current = listenToMessages(chatId, (msgs) => {
        const last = msgs[msgs.length - 1];
        if (last?.senderType === "agent" && msgs.length > prevMsgs.current.length) setAgentTyping(false);
        prevMsgs.current = msgs;
        setMessages(msgs);
      });

      // Send intro message with customer details
      await sendMessage({
        chatId,
        text:       `👤 ${name} (${email})\n📋 Issue: ${subject}`,
        senderId:   user.uid,
        senderType: "customer",
      });

      setAuthReady(true);
      clearInterval(iv);
      setProgress(100);
      setTimeout(() => setScreen("chat"), 400);
    } catch (err) {
      setError("Could not connect. Please refresh and try again.");
    }
  };

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior:"smooth" });
  }, [messages, agentTyping]);

  useEffect(() => {
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !authReady || !chatIdRef.current) return;
    setInput(""); setShowEmoji(false); setAgentTyping(true);
    try {
      await sendMessage({ chatId: chatIdRef.current, text, senderId: userRef.current.uid, senderType:"customer" });
    } catch { setError("Message failed."); setAgentTyping(false); }
  }, [input, authReady]);

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  if (screen === "welcome") return <WelcomeScreen onStart={handleStart}/>;

  return (
    <div style={{ fontFamily:"'Roboto',sans-serif", background:"#f9f9f9", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .page-in { animation:fadeIn .4s ease-out forwards; }
        .msg-new { animation:slideUp .22s ease-out forwards; }
        .feed::-webkit-scrollbar{width:4px}
        .feed::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}
        textarea:focus{outline:none} textarea{resize:none}
        .back:hover{background:#f0f0f0;border-radius:4px}
        .emoji-i:hover{background:#f0f0f0;border-radius:4px}
        .send-btn{transition:transform .15s,background .2s}
        .send-btn:active{transform:scale(.88)}
      `}</style>

      <div style={{ position:"fixed", top:0, left:0, height:3, zIndex:9999, width:`${progress}%`, transition:"width .15s ease", background:"linear-gradient(90deg,#FF0000,#ff4444)", opacity: progress < 100 ? 1 : 0, pointerEvents:"none" }}/>

      {/* Nav */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e5e5", padding:"0 16px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
        <button className="back" onClick={() => setScreen("welcome")} style={{ display:"flex", alignItems:"center", gap:4, color:"#606060", fontSize:13, padding:"6px 10px", border:"none", background:"transparent", cursor:"pointer", fontFamily:"'Roboto',sans-serif" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#606060"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Back
        </button>
        <YouTubeLogo height={18}/>
        <div style={{ width:80 }}/>
      </div>

      {error && <div style={{ background:"#fdecea", borderBottom:"1px solid #f5c6cb", padding:"10px 16px", textAlign:"center", fontSize:13, color:"#c62828" }}>⚠️ {error}</div>}

      <div className="page-in" style={{ flex:1, display:"flex", flexDirection:"column", maxWidth:640, width:"100%", margin:"0 auto" }}>

        {/* Banner */}
        <div style={{ margin:"12px 12px 0", background:"#fff", border:"1px solid #e8e8e8", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <img src={AGENT_AVATAR} alt="Agent" style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover" }}/>
            <span style={{ position:"absolute", bottom:1, right:1, width:11, height:11, borderRadius:"50%", background:"#00c853", border:"2px solid #fff" }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontWeight:700, fontSize:14, color:"#0f0f0f" }}>YouTube Support</span>
              <VerifiedBadge/>
            </div>
            <p style={{ fontSize:12, color:"#606060", marginTop:2 }}>
              Hi <strong>{customer?.name}</strong>! We're looking into your issue now.
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5, background:"#f2fff7", borderRadius:20, padding:"4px 10px" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#00c853", display:"inline-block" }}/>
            <span style={{ fontSize:11, fontWeight:500, color:"#00a040" }}>Online</span>
          </div>
        </div>

        {/* Feed */}
        <div ref={feedRef} className="feed" style={{ flex:1, overflowY:"auto", padding:"12px", display:"flex", flexDirection:"column", gap:6 }} onClick={() => setShowEmoji(false)}>
          <div style={{ textAlign:"center", marginBottom:8 }}>
            <span style={{ fontSize:11, color:"#909090", background:"#f0f0f0", borderRadius:20, padding:"3px 10px" }}>Today</span>
          </div>
          {messages.map((msg, i) => {
            const isAgent  = msg.senderType === "agent";
            const prevSame = i > 0 && messages[i-1].senderType === msg.senderType;
            return (
              <div key={msg.id} className={i >= messages.length - 2 ? "msg-new" : ""}>
                <MessageBubble msg={msg} isAgent={isAgent} avatarUrl={AGENT_AVATAR} senderName={msg.senderName || "YouTube Support"} showAvatar={!prevSame} showName={!prevSame && isAgent} theme="light"/>
              </div>
            );
          })}
          {agentTyping && <TypingIndicator avatarUrl={AGENT_AVATAR} theme="light"/>}
        </div>

        {/* Input */}
        <div style={{ background:"#fff", borderTop:"1px solid #e8e8e8", padding:"8px 12px 12px", position:"sticky", bottom:0 }}>
          {showEmoji && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:4, padding:"8px 4px", marginBottom:8, background:"#fafafa", borderRadius:10, border:"1px solid #f0f0f0" }}>
              {EMOJIS.map(e => <button key={e} className="emoji-i" onClick={() => { if (input.length < MAX) setInput(p => p+e); inputRef.current?.focus(); }} style={{ fontSize:20, padding:4, cursor:"pointer", background:"transparent", border:"none" }}>{e}</button>)}
            </div>
          )}
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, background:"#f8f8f8", border:"1.5px solid #e0e0e0", borderRadius:24, padding:"8px 8px 8px 16px" }}>
            <button onClick={() => setShowEmoji(v => !v)} style={{ background:"transparent", border:"none", cursor:"pointer", padding:4, color: showEmoji ? "#FF0000" : "#909090", flexShrink:0, display:"flex", alignItems:"center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 110-16 8 8 0 010 16zm-3.5-6.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-3.5 3.5c1.657 0 3-1 3.5-2.5h-7c.5 1.5 1.843 2.5 3.5 2.5z"/></svg>
            </button>
            <textarea ref={inputRef} rows={1} maxLength={MAX} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Type a message..." style={{ flex:1, background:"transparent", border:"none", fontSize:14, color:"#0f0f0f", lineHeight:1.5, fontFamily:"'Roboto',sans-serif", maxHeight:80, overflowY:"auto" }}/>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
              <span style={{ fontSize:11, color:"#aaa" }}>{input.length}/{MAX}</span>
              <button className="send-btn" onClick={handleSend} disabled={!input.trim() || !authReady} style={{ background: input.trim() && authReady ? "#FF0000" : "#e0e0e0", border:"none", borderRadius:"50%", width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", cursor: input.trim() && authReady ? "pointer" : "default" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign:"center", padding:"10px 0 14px", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#aaa"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          <span style={{ fontSize:11, color:"#aaa" }}>Powered by <strong style={{ color:"#FF0000" }}>YouTube Support API</strong></span>
        </div>
      </div>
    </div>
  );
}
