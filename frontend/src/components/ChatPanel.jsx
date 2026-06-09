import { useRef, useEffect, useState } from "react"
import MessageBubble from "./MessageBubble"

export default function ChatPanel({ activeLibrary, messages, loading, onSendMessage }) {
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

  const EXAMPLE_QUESTIONS = [
    "How do I create a component?",
    "Show me an example of hooks",
    "What's the best practice for..."
  ]

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100vh"
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #ddd",
          backgroundColor: "#f8f9fa"
        }}
      >
        {activeLibrary ? (
          <div>
            <h1 style={{ margin: "0 0 4px 0", fontSize: "20px", textTransform: "capitalize" }}>
              {activeLibrary}
            </h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
              Ask anything about {activeLibrary}
            </p>
          </div>
        ) : (
          <div style={{ color: "#888" }}>Select a library to start</div>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px"
        }}
      >
        {messages.length === 0 && activeLibrary ? (
          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "24px" }}>
              Ask anything about {activeLibrary}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px", margin: "0 auto" }}>
              {EXAMPLE_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(q, activeLibrary)}
                  style={{
                    padding: "12px",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    textAlign: "left"
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading && (
              <div style={{ padding: "12px", textAlign: "center", color: "#888" }}>
                <span style={{ animation: "blink 1.4s infinite" }}>...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      {activeLibrary && (
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid #ddd",
            backgroundColor: "#f8f9fa",
            display: "flex",
            gap: "8px"
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            style={{
              flex: 1,
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px",
              fontFamily: "inherit",
              resize: "none",
              minHeight: "40px",
              maxHeight: "120px"
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              padding: "10px 16px",
              backgroundColor: input.trim() && !loading ? "#534AB7" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}
