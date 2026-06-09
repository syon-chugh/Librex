import CodeBlock from "./CodeBlock"
import SourcesPanel from "./SourcesPanel"

export default function MessageBubble({ message }) {
  const isUser = message.role === "user"

  // Parse code blocks from content
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const parts = []
  let lastIndex = 0

  let match
  while ((match = codeBlockRegex.exec(message.content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: message.content.substring(lastIndex, match.index)
      })
    }

    // Add code block
    parts.push({
      type: "code",
      language: match[1] || "javascript",
      content: match[2].trim()
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < message.content.length) {
    parts.push({
      type: "text",
      content: message.content.substring(lastIndex)
    })
  }

  // If no code blocks found, treat entire message as text
  if (parts.length === 0) {
    parts.push({ type: "text", content: message.content })
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "12px",
        padding: "0 12px"
      }}
    >
      <div
        style={{
          maxWidth: isUser ? "70%" : "100%",
          backgroundColor: isUser ? "#534AB7" : "#f0f0f0",
          color: isUser ? "white" : "black",
          padding: "12px 16px",
          borderRadius: "8px",
          wordWrap: "break-word"
        }}
      >
        {parts.map((part, idx) =>
          part.type === "text" ? (
            <p key={idx} style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {part.content}
            </p>
          ) : (
            <CodeBlock key={idx} code={part.content} language={part.language} />
          )
        )}

        {message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <SourcesPanel sources={message.sources} />
          </div>
        )}
      </div>
    </div>
  )
}
