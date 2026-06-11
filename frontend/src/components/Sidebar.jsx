const LIBRARY_COLORS = ["#FF6B35", "#0F6E56", "#854F0B", "#185FA5", "#993C1D", "#6B2FA0"]

export default function Sidebar({ libraries, activeLibrary, onSelect, onAddClick }) {
  return (
    <div className="sidebar">
      {/* Index Header */}
      <div className="sidebar-header">
        <span>Index</span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
          {libraries.length}
        </span>
      </div>

      {/* Library List */}
      <div className="library-list">
        {libraries.length === 0 ? (
          <div style={{ 
            color: "var(--muted-foreground)", 
            fontSize: "var(--text-sm)", 
            textAlign: "center", 
            padding: "var(--spacing-6) var(--spacing-4)",
            fontStyle: "italic"
          }}>
            No libraries yet
          </div>
        ) : (
          libraries.map((lib, idx) => {
            const color = LIBRARY_COLORS[idx % LIBRARY_COLORS.length]
            const isActive = activeLibrary === lib.name
            const number = String(idx + 1).padStart(2, '0')

            return (
              <button
                key={lib.name}
                onClick={() => onSelect(lib.name)}
                className={`library-item ${isActive ? 'active' : ''}`}
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                <span className="library-number">{number}</span>
                <div
                  className="library-dot"
                  style={{ background: color }}
                />
                <span className="library-name">{lib.name}</span>
                <span className="library-count">{lib.count}</span>
              </button>
            )
          })
        )}
      </div>

      {/* Add Library Button */}
      <button
        onClick={onAddClick}
        className="add-library-btn"
      >
        + Index new library
      </button>
    </div>
  )
}