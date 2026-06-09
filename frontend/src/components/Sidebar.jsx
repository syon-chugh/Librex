const LIBRARY_COLORS = ["#534AB7", "#0F6E56", "#854F0B", "#185FA5", "#993C1D", "#6B2FA0"]

export default function Sidebar({ libraries, activeLibrary, onSelect, onAddClick }) {
  return (
    <div
      style={{
        width: "220px",
        backgroundColor: "#f8f9fa",
        borderRight: "1px solid #ddd",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: "16px"
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", fontWeight: "700" }}>
        StackSage
      </h2>

      {libraries.length === 0 ? (
        <div style={{ color: "#888", fontSize: "13px", textAlign: "center", marginTop: "40px" }}>
          No libraries indexed yet
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", marginBottom: "16px" }}>
          {libraries.map((lib, idx) => {
            const color = LIBRARY_COLORS[idx % LIBRARY_COLORS.length]
            const isActive = activeLibrary === lib.name

            return (
              <div
                key={lib.name}
                onClick={() => onSelect(lib.name)}
                style={{
                  padding: "10px 12px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  backgroundColor: isActive ? "#e0e0e0" : "transparent",
                  borderLeft: isActive ? `4px solid ${color}` : "4px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.2s"
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: color,
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "600", fontSize: "14px", textTransform: "capitalize" }}>
                    {lib.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888" }}>
                    {lib.count} chunks
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={onAddClick}
        style={{
          padding: "10px",
          backgroundColor: "#534AB7",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
          marginTop: "auto"
        }}
      >
        + Add Library
      </button>
    </div>
  )
}
