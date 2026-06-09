import { useState } from "react"

export default function SourcesPanel({ sources }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ fontSize: "12px" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "inherit",
          textDecoration: "underline",
          fontSize: "12px",
          padding: 0
        }}
      >
        Sources ({sources.length})
      </button>

      {expanded && (
        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {sources.map((source, idx) => (
            <div
              key={idx}
              style={{
                padding: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "4px",
                fontSize: "11px"
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                {source.title}
              </div>
              {source.section && (
                <div style={{ color: "rgba(0, 0, 0, 0.6)", marginBottom: "4px" }}>
                  {source.section}
                </div>
              )}
              <div style={{ color: "rgba(0, 0, 0, 0.5)", marginBottom: "6px" }}>
                {source.chunk_text.substring(0, 120)}...
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#0F6E56",
                    textDecoration: "none",
                    fontSize: "11px"
                  }}
                >
                  ↗ Open source
                </a>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "10px",
                    backgroundColor: source.chunk_type === "code" ? "#FFA500" : "#185FA5",
                    color: "white",
                    fontWeight: "600"
                  }}
                >
                  {source.chunk_type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
