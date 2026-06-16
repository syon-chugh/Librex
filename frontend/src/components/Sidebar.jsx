const LIBRARY_COLORS = ["#6366F1", "#8B5CF6", "#06B6D4", "#22C55E", "#F97316", "#EC4899"]

export default function Sidebar({ libraries, activeLibrary, onSelect, onAddClick }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div>
          <div>Indexed libraries</div>
          <small>Curated knowledge bases</small>
        </div>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
          {libraries.length}
        </span>
      </div>

      <div className="library-list">
        {libraries.length === 0 ? (
          <div
            style={{
              color: "var(--muted-foreground)",
              fontSize: "var(--text-sm)",
              textAlign: "center",
              padding: "var(--spacing-6) var(--spacing-4)",
              fontStyle: "italic",
            }}
          >
            No libraries yet
          </div>
        ) : (
          libraries.map((lib, idx) => {
            const color = LIBRARY_COLORS[idx % LIBRARY_COLORS.length]
            const isActive = activeLibrary === lib.name
            const number = String(idx + 1).padStart(2, "0")

            return (
              <button
                key={lib.name}
                onClick={() => onSelect(lib.name)}
                className={`library-item ${isActive ? "active" : ""}`}
                style={{ background: "transparent", border: "none", cursor: "pointer", "--library-accent": color }}
              >
                <span className="library-number">{number}</span>
                <div className="library-dot" style={{ background: color }} />
                <div className="library-meta">
                  <span className="library-name">{lib.name}</span>
                  <span className="library-caption">Documentation corpus</span>
                </div>
                <span className="library-count">{lib.count}</span>
              </button>
            )
          })
        )}
      </div>

      <button onClick={onAddClick} className="add-library-btn">
        <span>+</span>
        <span>Index new library</span>
      </button>
    </div>
  )
}
