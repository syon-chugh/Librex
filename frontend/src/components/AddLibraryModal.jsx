import { useState, useEffect } from "react"
import { indexLibrary, getIndexStatus } from "../api/client"

export default function AddLibraryModal({ onClose, onSuccess }) {
  const [url, setUrl] = useState("")
  const [libraryName, setLibraryName] = useState("")
  const [status, setStatus] = useState("idle")
  const [jobId, setJobId] = useState(null)
  const [progress, setProgress] = useState({})

  const extractLibraryName = (urlStr) => {
    try {
      const hostname = new URL(urlStr).hostname
      return hostname.split(".")[0].toLowerCase()
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
    if (!url || !libraryName) return

    try {
      setStatus("indexing")
      const result = await indexLibrary(url, libraryName)
      setJobId(result.job_id)

      // Poll for status
      const pollInterval = setInterval(async () => {
        const statusResult = await getIndexStatus(result.job_id)
        setProgress(statusResult)

        if (statusResult.status === "done") {
          clearInterval(pollInterval)
          setStatus("done")
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 1000)
        } else if (statusResult.status === "error") {
          clearInterval(pollInterval)
          setStatus("error")
        }
      }, 2000)
    } catch (err) {
      setStatus("error")
      console.error("Error:", err)
    }
  }

  const progressSteps = [
    { key: "scraping", label: "Scraping pages..." },
    { key: "chunking", label: "Chunking content..." },
    { key: "embedding", label: "Embedding chunks..." },
    { key: "done", label: "Done ✓" }
  ]

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "32px",
          maxWidth: "400px",
          width: "90%"
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Add Library</h2>

        {status === "idle" && (
          <>
            <input
              type="url"
              placeholder="Paste docs URL"
              value={url}
              onChange={handleUrlChange}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />

            <input
              type="text"
              placeholder="Library name"
              value={libraryName}
              onChange={(e) => setLibraryName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "16px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#ddd",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!url || !libraryName}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: url && libraryName ? "#534AB7" : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: url && libraryName ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                Index Library
              </button>
            </div>
          </>
        )}

        {status === "indexing" && (
          <div>
            {progressSteps.map((step) => {
              const isActive = progress.status === step.key || (progress.status === "done" && step.key === "done")
              const isDone = progress.status === "done" || progressSteps.indexOf(step) < progressSteps.findIndex(s => s.key === progress.status)

              return (
                <div
                  key={step.key}
                  style={{
                    padding: "10px",
                    marginBottom: "8px",
                    backgroundColor: isActive ? "#f0f0f0" : "transparent",
                    borderRadius: "4px",
                    color: isDone ? "#0F6E56" : isActive ? "#534AB7" : "#ccc"
                  }}
                >
                  {isDone ? "✓" : isActive ? "○" : "○"} {step.label}
                </div>
              )
            })}

            {progress.pages_done > 0 && (
              <div style={{ marginTop: "16px", fontSize: "12px", color: "#888" }}>
                Pages: {progress.pages_done} | Chunks: {progress.chunks_stored}
              </div>
            )}
          </div>
        )}

        {status === "done" && (
          <div style={{ textAlign: "center", color: "#0F6E56" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>✓</div>
            <div>Library indexed successfully!</div>
          </div>
        )}

        {status === "error" && (
          <div style={{ textAlign: "center", color: "#cc0000" }}>
            <div style={{ marginBottom: "16px" }}>Error during indexing</div>
            <button
              onClick={() => {
                setStatus("idle")
                setJobId(null)
                setProgress({})
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#cc0000",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
