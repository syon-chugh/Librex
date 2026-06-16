import { useState } from "react"
import toast from "react-hot-toast"
import { indexLibrary, getIndexStatus } from "../api/client"

export default function AddLibraryModal({ onClose, onSuccess }) {
  const [libraryName, setLibraryName] = useState("")
  const [url, setUrl] = useState("")
  const [status, setStatus] = useState("idle")
  const [progress, setProgress] = useState({ current: 0 })
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!libraryName.trim()) {
      toast.error("Please enter a library name")
      return
    }
    try {
      setStatus("fetching")
      setError(null)
      const response = await indexLibrary(url.trim(), libraryName.trim().toLowerCase())
      pollStatus(response.job_id)
    } catch (err) {
      setError(err.message || "Failed to start indexing")
      toast.error("Failed to start indexing")
      setStatus("error")
    }
  }

  const pollStatus = (jid) => {
    const interval = setInterval(async () => {
      try {
        const data = await getIndexStatus(jid)
        setStatus(data.status)
        setProgress({ current: data.chunks_stored || 0 })
        if (data.status === "done") {
          clearInterval(interval)
          toast.success("Library indexed successfully!")
          setTimeout(() => onSuccess(), 800)
        } else if (data.status === "error") {
          clearInterval(interval)
          setError(data.error || "Indexing failed")
          setStatus("error")
          toast.error("Indexing failed")
        }
      } catch {
        clearInterval(interval)
        setError("Failed to check status")
        setStatus("error")
      }
    }, 1500)
  }

  const steps = ["Fetching", "Chunking", "Embedding", "Done"]
  const stepMap = { idle: -1, scraping: 0, fetching: 0, chunking: 1, embedding: 2, done: 3, error: -1 }
  const currentStep = stepMap[status] ?? -1
  const isIdle = status === "idle" || status === "error"

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Index a Library</h2>
        <p className="modal-subtitle">Enter a library name to get started</p>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "var(--radius-md)", padding: "var(--spacing-3) var(--spacing-4)",
            marginBottom: "var(--spacing-4)", color: "#ef4444", fontSize: "var(--text-sm)"
          }}>
            {error}
          </div>
        )}

        {isIdle ? (
          <div className="input-group">
            <input
              type="text"
              placeholder="Library name — e.g. react, tailwindcss, fastapi"
              value={libraryName}
              onChange={(e) => setLibraryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="input"
              autoFocus
            />
            <input
              type="url"
              placeholder="Docs URL (optional — only needed if not on Context7)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input"
              style={{ opacity: 0.7 }}
            />
            <p style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", margin: "-4px 0 8px" }}>
              Docs are fetched automatically — react, nextjs, vite use llms.txt (best quality); others use Context7. URL is only needed as a last resort.
            </p>
            <button
              onClick={handleSubmit}
              disabled={!libraryName.trim()}
              className="primary-btn"
            >
              Start Indexing
            </button>
          </div>
        ) : (
          <>
            <div className="progress-steps">
              {steps.map((step, idx) => {
                const isDone = idx < currentStep
                const isActive = idx === currentStep
                return (
                  <div key={idx} className={`step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                    <div className="step-circle">{isDone ? "+" : String(idx + 1).padStart(2, "0")}</div>
                    <div className="step-label">{step}</div>
                  </div>
                )
              })}
            </div>
            <p style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--muted-foreground)", marginTop: "var(--spacing-4)" }}>
              {status === "done" ? "Complete!" : progress.current > 0 ? `${progress.current} chunks stored` : "Processing..."}
            </p>
          </>
        )}
      </div>
    </div>
  )
}