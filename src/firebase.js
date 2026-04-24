// ─────────────────────────────────────────────────────────────────
// src/firebase.js
// The brain of the whole system.
// Both CustomerChat and AgentDashboard import from here.
// ─────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// ── Your Firebase config (pulled from .env) ───────────────────────
const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_API_KEY,
  authDomain:        import.meta.env.VITE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_APP_ID,
};

// ── Initialize ────────────────────────────────────────────────────
const app = initializeApp(FIREBASE_CONFIG);
export const db   = getFirestore(app);
export const auth = getAuth(app);

// ─────────────────────────────────────────────────────────────────
// DATABASE STRUCTURE
//
//  chats/
//    {customerId}/
//      customerId: string
//      startedAt: Timestamp
//      status: "active" | "closed"
//      lastMessage: string
//      lastMessageAt: Timestamp
//      unread: number
//
//      messages/
//        {messageId}/
//          text: string
//          senderId: string
//          senderType: "customer" | "agent"
//          type: "text" | "image"
//          timestamp: Timestamp
//          read: boolean
// ─────────────────────────────────────────────────────────────────

// ── 1. Anonymous sign-in for customers ───────────────────────────
export const signInCustomer = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const result = await signInAnonymously(auth);
          resolve(result.user);
        } catch (error) {
          console.error("Auth error:", error.code, error.message);
          reject(error);
        }
      }
    });
  });
};
// ── 2. Create or resume a chat session ───────────────────────────
export const getOrCreateChat = async (customerId) => {
  const chatRef  = doc(db, "chats", customerId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) return customerId;

  await setDoc(chatRef, {
    customerId,
    startedAt:     serverTimestamp(),
    status:        "active",
    lastMessage:   "",
    lastMessageAt: serverTimestamp(),
    unread:        0,
  });

  return customerId;
};
// ── Telegram Notification ─────────────────────────────────────────
const notifyAgent = async (text, customerId) => {
  const TOKEN   = import.meta.env.VITE_TELEGRAM_TOKEN;
  const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: `🔔 New Support Message\n\n👤 Customer: ${customerId.slice(-6)}\n💬 "${text}"\n\n👉 Open Dashboard: ${import.meta.env.VITE_AGENT_URL}`,
      parse_mode: "HTML",
    }),
  });
};

// ── 3. Send a message ─────────────────────────────────────────────
export const sendMessage = async ({
  chatId,
  text,
  senderId,
  senderType = "customer",
  senderName = "",
  type       = "text",
}) => {
 if (!text.trim()) return;

// Notify agent via Telegram when customer sends a message
if (senderType === "customer") {
  await notifyAgent(text, senderId);
}

  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    text:       text.trim(),
    senderId,
    senderType,
    senderName,
    type,
    timestamp:  serverTimestamp(),
    read:       false,
  });

  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, {
    lastMessage:   text.trim().slice(0, 80),
    lastMessageAt: serverTimestamp(),
    status:        "active",
    // Increment unread only when customer sends
    ...(senderType === "customer" && { unread: (await getDoc(chatRef)).data()?.unread + 1 || 1 }),
  });
};

// ── 4. Listen to messages in a chat (real-time) ───────────────────
export const listenToMessages = (chatId, callback) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      time: doc.data().timestamp
        ? doc.data().timestamp.toDate().toLocaleTimeString([], {
            hour:   "2-digit",
            minute: "2-digit",
          })
        : "...",
    }));
    callback(messages);
  });
};

// ── 5. Listen to all chats — for agent dashboard ──────────────────
export const listenToAllChats = (callback) => {
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, orderBy("lastMessageAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      lastMessageAt: doc.data().lastMessageAt
        ? doc.data().lastMessageAt.toDate().toLocaleTimeString([], {
            hour:   "2-digit",
            minute: "2-digit",
          })
        : "...",
    }));
    callback(chats);
  });
};

// ── 6. Mark a chat as read ────────────────────────────────────────
export const markChatAsRead = async (chatId) => {
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, { unread: 0 });
};

// ── 7. Close / resolve a chat ─────────────────────────────────────
export const closeChat = async (chatId) => {
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, { status: "closed" });
};


// ── 9. Rename a customer (agent only) ────────────────────────────
export const renameCustomer = async (chatId, displayName) => {
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, { displayName: displayName.trim() });
};
