import { useState } from "react"

export default function SourcesPanel({ sources, confidence }) {
  const [expanded, setExpanded] = useState(false)

  const getConfidenceColor = (score) => {
    if (score >= 80) return { className: "confidence-high", label: "High" }
    if (score >= 50) return { className: "confidence-medium", label: "Medium" }
    return { className: "confidence-low", label: "Low" }
  }

  const conf = getConfidenceColor(confidence || 0)

  return (
    <div className="sources-panel">
      <button
        onClick={() => setExpanded(!expanded)}
        className="sources-toggle"
      >
        <span className={`chevron ${expanded ? 'open' : ''}`}>▾</span>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: "600", textTransform: "uppercase" }}>
          Sources
        </span>
        <span style={{ color: "var(--muted-foreground)" }}>({sources.length})</span>
        {confidence !== undefined && (
          <span className={`source-badge ${conf.className}`} style={{ marginLeft: "auto" }}>
            {confidence}% {conf.label}
          </span>
        )}
      </button>

      {expanded && (
        <div className="sources-grid">
          {sources.map((source, idx) => (
            <a
              key={idx}
              href={source.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="source-card"
            >
              <div className="source-title">{source.title || "Untitled"}</div>
              {source.section && (
                <div className="source-section">{source.section}</div>
              )}
              <div className="source-preview">
                {source.chunk_text || source.preview || "No preview available"}
              </div>
              <div className="source-badge">
                {source.chunk_type || "documentation"}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}