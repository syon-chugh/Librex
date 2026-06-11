import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { indexLibrary, getIndexStatus } from "../api/client"

export default function AddLibraryModal({ onClose, onSuccess }) {
  const [url, setUrl] = useState("")
  const [libraryName, setLibraryName] = useState("")
  const [status, setStatus] = useState("idle")
  const [jobId, setJobId] = useState(null)
  const [progress, setProgress] = useState({ current: 0, total: 100 })
  const [error, setError] = useState(null)

  const extractLibraryName = (urlStr) => {
    try {
      const hostname = new URL(urlStr).hostname
      return hostname.replace("www.", "").split(".")[0].toLowerCase()
    } catch {
      return ""
    }
  }

  const handleUrlChange = (e) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    setLibraryName(extractLibraryName(newUrl))
  }

  const handleSubmit = async () => {
    if (!url || !libraryName) {
      toast.error("Please enter a valid URL and library name")
      return
    }

    try {
      setStatus("scraping")
      setError(null)
      const response = await indexLibrary(url, libraryName)
      setJobId(response.job_id)
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
        const statusData = await getIndexStatus(jid)
        setStatus(statusData.status)
        setProgress({
          current: statusData.chunks_stored || 0,
          total: 100
        })

        if (statusData.status === "done") {
          clearInterval(interval)
          toast.success("Library indexed successfully!")
          setTimeout(() => {
            onSuccess()
          }, 800)
        } else if (statusData.status === "error") {
          clearInterval(interval)
          setError(statusData.error || "Indexing failed")
          setStatus("error")
          toast.error("Indexing failed")
        }
      } catch (err) {
        clearInterval(interval)
        setError("Failed to check status")
        setStatus("error")
      }
    }, 1500)
  }

  const steps = ["Scraping", "Chunking", "Embedding", "Done"]
  const stepMap = {
    idle: -1,
    scraping: 0,
    chunking: 1,
    embedding: 2,
    done: 3,
    error: -1
  }
  const currentStep = stepMap[status] ?? -1

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Index a Library</h2>
        <p className="modal-subtitle">Paste the documentation URL below</p>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-3) var(--spacing-4)",
            marginBottom: "var(--spacing-4)",
            color: "#ef4444",
            fontSize: "var(--text-sm)"
          }}>
            {error}
          </div>
        )}

        {status === "idle" || status === "error" ? (
          <div className="input-group">
            <input
              type="url"
              placeholder="https://docs.example.com"
              value={url}
              onChange={handleUrlChange}
              className="input"
            />
            <input
              type="text"
              placeholder="Library name (e.g., react, fastapi)"
              value={libraryName}
              onChange={(e) => setLibraryName(e.target.value)}
              className="input"
            />
            <button
              onClick={handleSubmit}
              disabled={!url || !libraryName}
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
                  <div key={idx} className={`step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                    <div className="step-circle">
                      {isDone ? '✓' : String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="step-label">{step}</div>
                  </div>
                )
              })}
            </div>
            <p style={{
              textAlign: "center",
              fontSize: "var(--text-sm)",
              color: "var(--muted-foreground)",
              marginTop: "var(--spacing-4)"
            }}>
              {progress.current > 0 && `${progress.current} chunks stored`}
              {progress.current === 0 && status !== "done" && "Processing..."}
              {status === "done" && "Complete! ✓"}
            </p>
          </>
        )}
      </div>
    </div>
  )
}