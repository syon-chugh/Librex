import { useRef, useEffect, useState } from "react"
import MessageBubble from "./MessageBubble"

const EXAMPLES = [
  "What are the core concepts?",
  "Give me an overview of this library",
  "Show me a basic usage example",
]

export default function ChatPanel({ activeLibrary, libraries, messages, loading, onSendMessage }) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async () => {
    if (!input.trim() || !activeLibrary) return
    const question = input.trim()
    setInput("")
    await onSendMessage(question, activeLibrary)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!activeLibrary) {
    return (
      <div className="chat-area">
        <div className="messages">
          <div className="empty-state empty-state-idle">
            <div className="empty-state-badge">Obsidian workspace</div>
            <h1 className="empty-state-title" style={{ fontFamily: "var(--font-serif)" }}>
              Select a library to begin
            </h1>
            <p className="empty-state-subtitle">
              Choose a documentation corpus from the sidebar to unlock grounded, source-backed answers.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const libIndex = libraries.findIndex((library) => library.name === activeLibrary)
  const libNumber = String(libIndex + 1).padStart(2, "0")
  const libCount = libraries[libIndex]?.count || 0

  return (
    <div className="chat-area">
      <div className="chat-subheader">
        <div className="chat-subheader-primary">
          <span>{libNumber}</span>
          <span>/{activeLibrary}</span>
        </div>
        <div className="chat-subheader-secondary">
          <span>{libCount} chunks indexed</span>
          {messages.length > 0 && <div className="live-dot" />}
        </div>
      </div>

      <div className="messages">
        <div className="messages-inner">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-badge">Knowledge engine ready</div>
              <h2 className="empty-state-title">
                Ask anything about <em style={{ fontStyle: "italic", fontFamily: "var(--font-serif)" }}>{activeLibrary}</em>
              </h2>
              <p className="empty-state-subtitle">
                Retrieve elegant, grounded answers across indexed docs, examples, and implementation details.
              </p>
              <div className="example-questions">
                {EXAMPLES.map((question, index) => (
                  <button
                    key={question}
                    className="question-chip"
                    onClick={() => setInput(question)}
                  >
                    <span className="question-number">{String(index + 1).padStart(2, "0")}</span>
                    <span>{question}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {loading && (
                <div className="message assistant">
                  <div className="assistant-avatar" aria-hidden="true">L</div>
                  <div className="assistant-body">
                    <div className="message-label">
                      <span>Librex</span>
                      <span>Thinking through the docs</span>
                    </div>
                    <div className="message-content">
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                        <div className="skeleton" style={{ width: "100%" }} />
                        <div className="skeleton" style={{ width: "92%" }} />
                        <div className="skeleton" style={{ width: "64%" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="composer">
        <span className="composer-prompt">⌘</span>
        <div className="composer-input-group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${activeLibrary} about patterns, APIs, setup, or caveats...`}
            className="composer-textarea"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="send-btn"
            title="Send (Enter)"
          >
            <span>Ask</span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </div>
  )
}
