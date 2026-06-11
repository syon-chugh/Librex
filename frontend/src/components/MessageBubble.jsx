import { useState } from "react"
import ReactMarkdown from "react-markdown"
import CodeBlock from "./CodeBlock"
import SourcesPanel from "./SourcesPanel"

export default function MessageBubble({ message }) {
  const isUser = message.role === "user"

  if (isUser) {
    return (
      <div className="message user">
        <div className="message-label">You · {message.originalQuestion || message.content.substring(0, 20)}</div>
        <div className="message-content">{message.content}</div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="message assistant">
      <div className="message-label">Librex · response</div>
      
      <div className="message-content">
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline ? (
                <CodeBlock
                  code={String(children).replace(/\n$/, '')}
                  language={match ? match[1] : 'text'}
                />
              ) : (
                <code style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '0.9em', 
                  background: 'var(--surface-elevated)', 
                  padding: '2px 6px', 
                  borderRadius: '3px', 
                  color: 'var(--brand)' 
                }} {...props}>
                  {children}
                </code>
              )
            },
            p: ({ children }) => <p style={{ marginBottom: 'var(--spacing-3)', lineHeight: '1.75' }}>{children}</p>,
            ul: ({ children }) => <ul style={{ paddingLeft: '20px', marginBottom: 'var(--spacing-3)' }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ paddingLeft: '20px', marginBottom: 'var(--spacing-3)' }}>{children}</ol>,
            li: ({ children }) => <li style={{ marginBottom: 'var(--spacing-1)' }}>{children}</li>,
            strong: ({ children }) => <strong style={{ fontWeight: '600' }}>{children}</strong>,
            em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
            h1: ({ children }) => <h1 style={{ fontSize: '1.5em', fontWeight: '600', marginTop: 'var(--spacing-4)', marginBottom: 'var(--spacing-2)' }}>{children}</h1>,
            h2: ({ children }) => <h2 style={{ fontSize: '1.25em', fontWeight: '600', marginTop: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)' }}>{children}</h2>,
            h3: ({ children }) => <h3 style={{ fontSize: '1.1em', fontWeight: '600', marginTop: 'var(--spacing-3)', marginBottom: 'var(--spacing-1)' }}>{children}</h3>,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>

      {message.sources && message.sources.length > 0 && (
        <SourcesPanel sources={message.sources} confidence={message.confidenceScore} />
      )}
    </div>
  )
}