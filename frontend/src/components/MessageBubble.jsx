import ReactMarkdown from "react-markdown"
import CodeBlock from "./CodeBlock"
import SourcesPanel from "./SourcesPanel"

export default function MessageBubble({ message }) {
  const isUser = message.role === "user"

  if (isUser) {
    return (
      <div className="message user">
        <div className="message-label">
          <span>You</span>
          <span>{message.originalQuestion || message.content.substring(0, 28)}</span>
        </div>
        <div className="message-content">{message.content}</div>
      </div>
    )
  }

  return (
    <div className="message assistant">
      <div className="assistant-avatar" aria-hidden="true">L</div>
      <div className="assistant-body">
        <div className="message-label">
          <span>Librex</span>
          <span>Grounded answer</span>
        </div>

        <div className="message-content message-prose">
          <ReactMarkdown
            components={{
              code({ inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "")
                return !inline ? (
                  <CodeBlock
                    code={String(children).replace(/\n$/, "")}
                    language={match ? match[1] : "text"}
                  />
                ) : (
                  <code
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.9em",
                      background: "var(--surface-elevated)",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      color: "var(--brand)",
                      border: "1px solid var(--border-subtle)",
                    }}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
              p: ({ children }) => <p style={{ marginBottom: "var(--spacing-3)", lineHeight: "1.8" }}>{children}</p>,
              ul: ({ children }) => <ul style={{ paddingLeft: "20px", marginBottom: "var(--spacing-3)" }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ paddingLeft: "20px", marginBottom: "var(--spacing-3)" }}>{children}</ol>,
              li: ({ children }) => <li style={{ marginBottom: "var(--spacing-1)" }}>{children}</li>,
              strong: ({ children }) => <strong style={{ fontWeight: "700", color: "var(--foreground)" }}>{children}</strong>,
              em: ({ children }) => <em style={{ fontStyle: "italic", color: "var(--foreground)" }}>{children}</em>,
              h1: ({ children }) => <h1 style={{ fontSize: "1.65em", fontWeight: "700", marginTop: "var(--spacing-5)", marginBottom: "var(--spacing-3)" }}>{children}</h1>,
              h2: ({ children }) => <h2 style={{ fontSize: "1.35em", fontWeight: "700", marginTop: "var(--spacing-4)", marginBottom: "var(--spacing-2)" }}>{children}</h2>,
              h3: ({ children }) => <h3 style={{ fontSize: "1.12em", fontWeight: "700", marginTop: "var(--spacing-4)", marginBottom: "var(--spacing-2)" }}>{children}</h3>,
              a: ({ children, href }) => (
                <a href={href} target="_blank" rel="noreferrer" style={{ color: "#a5b4fc", textDecoration: "none" }}>
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote
                  style={{
                    borderLeft: "2px solid rgba(129, 140, 248, 0.5)",
                    paddingLeft: "14px",
                    marginBottom: "var(--spacing-3)",
                    color: "var(--secondary-foreground)",
                  }}
                >
                  {children}
                </blockquote>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {message.sources && message.sources.length > 0 && (
          <SourcesPanel sources={message.sources} confidence={message.confidenceScore} />
        )}
      </div>
    </div>
  )
}
