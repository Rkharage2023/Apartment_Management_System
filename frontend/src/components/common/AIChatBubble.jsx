// src/components/common/AIChatBubble.jsx
// ─── FLOATING AI CHAT BUBBLE ───────────────────────────────────────────────────
// Drop this into your root layout — it appears on EVERY page automatically.
// Usage: import AIChatBubble from './components/common/AIChatBubble'
//        then add <AIChatBubble /> in your App.jsx or root layout

import { useState, useRef, useEffect } from "react";

const GEMINI_MODEL = "gemini-2.5-flash";
const SYSTEM_PROMPT = `You are ApartaBot, a smart and friendly AI assistant for an Apartment Management System.
You help with: rent payments, maintenance requests, complaints, flat bookings, visitor logs, parking, society events, notices, and billing queries.
Keep responses concise (3-4 sentences max). Be warm, helpful, and professional.
If a task needs admin approval, say so clearly and suggest they visit the relevant section of the portal.`;

const QUICK_QUESTIONS = [
  "How do I pay rent?",
  "Submit a complaint",
  "Book a parking slot",
  "View my notices",
];

async function askGemini(apiKey, messages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Sorry, I couldn't respond. Please try again."
  );
}

export default function AIChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setShowPulse(false);
      setTimeout(() => inputRef.current?.focus(), 100);
      if (messages.length === 0) {
        setMessages([
          {
            role: "assistant",
            content:
              "👋 Hi! I'm ApartaBot, your AI assistant. How can I help you today?",
          },
        ]);
      }
    }
  }, [open]);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const updated = [...messages, { role: "user", content: msg }];
    setMessages(updated);
    setLoading(true);
    try {
      const reply = await askGemini(apiKey, updated);
      setMessages((p) => [...p, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((p) => [
        ...p,
        { role: "assistant", content: "⚠️ " + e.message },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      <style>{`
        @keyframes bubblePop {
          0%{transform:scale(0) rotate(-10deg);opacity:0}
          70%{transform:scale(1.08) rotate(2deg)}
          100%{transform:scale(1) rotate(0deg);opacity:1}
        }
        @keyframes pulse {
          0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.7)}
          70%{box-shadow:0 0 0 14px rgba(99,102,241,0)}
        }
        @keyframes slideUp {
          from{opacity:0;transform:translateY(20px) scale(.96)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
        @keyframes msgIn {
          from{opacity:0;transform:translateY(8px)}
          to{opacity:1;transform:none}
        }
        @keyframes dotBounce {
          0%,80%,100%{transform:scale(0);opacity:.3}
          40%{transform:scale(1);opacity:1}
        }
        @keyframes badgePop {
          0%{transform:scale(0)}
          80%{transform:scale(1.2)}
          100%{transform:scale(1)}
        }
        .ai-bubble-btn:hover { transform: scale(1.1) !important; }
        .ai-send:not(:disabled):hover { background: #4f46e5 !important; }
        .ai-quick:hover { background: rgba(99,102,241,.25) !important; border-color: rgba(99,102,241,.6) !important; }
        .ai-close:hover { background: rgba(255,255,255,.12) !important; }
      `}</style>

      {/* ── FLOATING BUBBLE BUTTON ── */}
      <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999 }}>
        {!open && showPulse && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              animation: "pulse 2s infinite",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Tooltip */}
        {!open && (
          <div
            style={{
              position: "absolute",
              bottom: "110%",
              right: 0,
              background: "#1e293b",
              color: "#e2e8f0",
              fontSize: 12,
              padding: "6px 12px",
              borderRadius: 8,
              whiteSpace: "nowrap",
              border: "1px solid rgba(99,102,241,.3)",
              boxShadow: "0 4px 16px rgba(0,0,0,.4)",
              marginBottom: 4,
            }}
          >
            💬 Chat with AI
            <div
              style={{
                position: "absolute",
                bottom: -6,
                right: 14,
                width: 10,
                height: 10,
                background: "#1e293b",
                border: "1px solid rgba(99,102,241,.3)",
                borderTop: "none",
                borderLeft: "none",
                transform: "rotate(45deg)",
              }}
            />
          </div>
        )}

        <button
          className="ai-bubble-btn"
          onClick={() => setOpen((p) => !p)}
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            border: "none",
            background: open
              ? "linear-gradient(135deg,#ef4444,#dc2626)"
              : "linear-gradient(135deg,#6366f1,#06b6d4)",
            cursor: "pointer",
            fontSize: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(99,102,241,.55)",
            transition: "transform .2s, box-shadow .2s",
            animation: "bubblePop .4s cubic-bezier(.34,1.56,.64,1)",
          }}
        >
          {open ? "✕" : "🤖"}
        </button>

        {/* Unread badge */}
        {!open && messages.length > 1 && (
          <div
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ef4444",
              color: "#fff",
              width: 20,
              height: 20,
              borderRadius: "50%",
              fontSize: 11,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #060d1a",
              animation: "badgePop .3s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            {Math.floor(messages.length / 2)}
          </div>
        )}
      </div>

      {/* ── CHAT WINDOW ── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            right: 28,
            zIndex: 9998,
            width: 360,
            height: 520,
            background: "linear-gradient(160deg,#0f172a 0%,#0d1424 100%)",
            borderRadius: 20,
            border: "1px solid rgba(99,102,241,.25)",
            boxShadow:
              "0 24px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04)",
            display: "flex",
            flexDirection: "column",
            animation: "slideUp .25s cubic-bezier(.34,1.56,.64,1)",
            overflow: "hidden",
            fontFamily: "'Sora','Segoe UI',sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              background:
                "linear-gradient(135deg,rgba(99,102,241,.2),rgba(6,182,212,.1))",
              borderBottom: "1px solid rgba(255,255,255,.06)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
                boxShadow: "0 0 16px rgba(99,102,241,.5)",
              }}
            >
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>
                ApartaBot
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 6px #22c55e",
                  }}
                />
                Online · Powered by Gemini (Free)
              </div>
            </div>
            <button
              className="ai-close"
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.1)",
                color: "#94a3b8",
                borderRadius: 8,
                width: 30,
                height: 30,
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background .15s",
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 14px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {messages.map((m, i) => {
              const isBot = m.role === "assistant";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: isBot ? "row" : "row-reverse",
                    gap: 8,
                    marginBottom: 10,
                    alignItems: "flex-end",
                    animation: "msgIn .2s ease",
                  }}
                >
                  {isBot && (
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      🤖
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: "80%",
                      background: isBot
                        ? "rgba(255,255,255,.06)"
                        : "linear-gradient(135deg,#6366f1,#4f46e5)",
                      border: isBot
                        ? "1px solid rgba(255,255,255,.08)"
                        : "none",
                      borderRadius: isBot
                        ? "4px 14px 14px 14px"
                        : "14px 4px 14px 14px",
                      padding: "9px 13px",
                      fontSize: 13,
                      color: "#e2e8f0",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      boxShadow: isBot
                        ? "none"
                        : "0 4px 16px rgba(99,102,241,.4)",
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 10,
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                  }}
                >
                  🤖
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: "4px 14px 14px 14px",
                    padding: "12px 16px",
                    display: "flex",
                    gap: 4,
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#6366f1",
                        animation: `dotBounce 1.2s ease ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions — show only at start */}
          {messages.length <= 1 && (
            <div
              style={{
                padding: "0 14px 10px",
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  className="ai-quick"
                  onClick={() => send(q)}
                  style={{
                    background: "rgba(99,102,241,.12)",
                    border: "1px solid rgba(99,102,241,.3)",
                    color: "#a5b4fc",
                    borderRadius: 20,
                    padding: "5px 11px",
                    fontSize: 11.5,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all .15s",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding: "10px 14px 14px",
              borderTop: "1px solid rgba(255,255,255,.06)",
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask me anything…"
              rows={1}
              style={{
                flex: 1,
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 12,
                color: "#e2e8f0",
                padding: "9px 13px",
                fontSize: 13,
                resize: "none",
                fontFamily: "inherit",
                lineHeight: 1.5,
                outline: "none",
                transition: "border .2s",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(99,102,241,.6)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,.1)")
              }
            />
            <button
              className="ai-send"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: "none",
                background:
                  loading || !input.trim() ? "rgba(99,102,241,.2)" : "#6366f1",
                color: "#fff",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background .15s",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
