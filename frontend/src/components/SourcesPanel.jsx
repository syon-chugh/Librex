import { useMemo, useState } from "react"

const getDomain = (url) => {
  if (!url) return "docs"

  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "docs"
  }
}

export default function SourcesPanel({ sources, confidence }) {
  const [expanded, setExpanded] = useState(false)

  const getConfidenceColor = (score) => {
    if (score >= 80) return { className: "confidence-high", label: "High" }
    if (score >= 50) return { className: "confidence-medium", label: "Medium" }
    return { className: "confidence-low", label: "Low" }
  }

  const conf = getConfidenceColor(confidence || 0)
  const panelHeight = useMemo(() => `${sources.length * 180}px`, [sources.length])

  return (
    <div className="sources-panel">
      <button onClick={() => setExpanded(!expanded)} className="sources-toggle">
        <span className={`chevron ${expanded ? "open" : ""}`}>▾</span>
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

      <div
        className="sources-grid"
        style={{
          maxHeight: expanded ? panelHeight : "0px",
          opacity: expanded ? 1 : 0,
          marginTop: expanded ? "14px" : "0px",
        }}
      >
        {sources.map((source, idx) => {
          const domain = getDomain(source.url)

          return (
            <a
              key={`${source.url || source.title || "source"}-${idx}`}
              href={source.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="source-card"
            >
              <div className="source-card-top">
                <div className="source-favicon" aria-hidden="true">
                  {domain.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="source-title">{source.title || "Untitled"}</div>
                  <div className="source-domain">{domain}</div>
                </div>
              </div>
              {source.section && <div className="source-section">{source.section}</div>}
              <div className="source-preview">{source.chunk_text || source.preview || "No preview available"}</div>
              <div className="source-badge">{source.chunk_type || "documentation"}</div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
