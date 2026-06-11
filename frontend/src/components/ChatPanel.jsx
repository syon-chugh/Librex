import { useRef, useEffect, useState } from "react"
import MessageBubble from "./MessageBubble"

const EXAMPLES = {
  react: [
    "How do I use useEffect hooks?",
    "What is the difference between state and props?",
    "Show me a custom hook example"
  ],
  fastapi: [
    "How do I add authentication to endpoints?",
    "How do I handle file uploads?",
    "Show me CORS middleware setup"
  ],
  default: [
    "Give me an overview of this documentation",
    "What are the core concepts?",
    "Show me a basic usage example"
  ]
}

export default function ChatPanel({ activeLibrary, libraries, messages, loading, onSendMessage }) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !activeLibrary) return
    const question = input
    setInput("")
    await onSendMessage(question, activeLibrary)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!activeLibrary) {
    return (
      <div className="chat-area">
        <div className="empty-state" style={{ paddingTop: "20vh" }}>
          <h1 className="empty-state-title" style={{ fontFamily: "var(--font-serif)" }}>
            Select a library to begin
          </h1>
          <p className="empty-state-subtitle">
            Choose from your indexed libraries in the sidebar
          </p>
        </div>
      </div>
    )
  }

  const examples = EXAMPLES[activeLibrary] || EXAMPLES.default
  const libIndex = libraries.findIndex(l => l.name === activeLibrary)
  const libNumber = String(libIndex + 1).padStart(2, '0')
  const libCount = libraries[libIndex]?.count || 0

  return (
    <div className="chat-area">
      {/* Sub-header */}
      <div className="chat-subheader">
        <span>{libNumber} / {activeLibrary}</span>
        <span>·</span>
        <span>{libCount} chunks indexed</span>
        {messages.length > 0 && <div className="live-dot"></div>}
      </div>

      {/* Messages Area */}
      <div className="messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-state-title">
              Ask anything about <em style={{ fontStyle: "italic", fontFamily: "var(--font-serif)" }}>{activeLibrary}</em>
            </h2>
            <p className="empty-state-subtitle">
              Get answers grounded in the official documentation
            </p>
            <div className="example-questions">
              {examples.map((q, i) => (
                <button
                  key={i}
                  className="question-chip"
                  onClick={() => setInput(q)}
                >
                  <span className="question-number">{String(i + 1).padStart(2, '0')}</span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className="message">
                <MessageBubble message={msg} />
              </div>
            ))}
            {loading && (
              <div className="message">
                <div className="message-label">Librex · responding</div>
                <div className="message-content">
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                    <div className="skeleton" style={{ width: "100%" }}></div>
                    <div className="skeleton" style={{ width: "95%" }}></div>
                    <div className="skeleton" style={{ width: "70%" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Terminal-style Composer */}
      <div className="composer">
        <span className="composer-prompt">&gt;</span>
        <div className="composer-input-group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about this documentation..."
            className="composer-textarea"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="send-btn"
            title="Send (Enter)"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}