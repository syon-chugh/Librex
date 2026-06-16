import { useState, useEffect } from "react"
import { useLibraries } from "./hooks/useLibraries"
import { useChat } from "./hooks/useChat"
import Sidebar from "./components/Sidebar"
import ChatPanel from "./components/ChatPanel"
import AddLibraryModal from "./components/AddLibraryModal"
import { Toaster } from "react-hot-toast"

function App() {
  const { libraries, loading, refetch } = useLibraries()
  const { messages, loading: chatLoading, sendMessage, clearChat } = useChat()
  const [activeLibrary, setActiveLibrary] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark")

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light")
    } else {
      document.documentElement.removeAttribute("data-theme")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    if (libraries.length > 0 && !activeLibrary) {
      setActiveLibrary(libraries[0].name)
    }
  }, [libraries, activeLibrary])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        const textarea = document.querySelector(".composer-textarea")
        if (textarea) textarea.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSelectLibrary = (libName) => {
    setActiveLibrary(libName)
    clearChat()
  }

  const handleAddSuccess = () => {
    refetch()
    setShowAddModal(false)
  }

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"))
  }

  if (loading) {
    return (
      <div className="app">
        <div className="app-header">
          <div className="logo-section">
            <div className="logo">L</div>
            <div>
              <div className="wordmark">Librex</div>
              <div className="tag">Obsidian knowledge cockpit</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: "1rem", color: "var(--muted-foreground)" }}>
          Loading libraries...
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="logo-section">
          <div className="logo">
            <span>L</span>
          </div>
          <div>
            <div className="wordmark">Librex</div>
            <div className="tag">RAG documentation cockpit</div>
          </div>
        </div>

        <div className="header-right">
          <div className="shortcut-chip">
            <span>Focus</span>
            <kbd>⌘K</kbd>
          </div>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          </button>
        </div>
      </div>

      <div className="app-container">
        <Sidebar
          libraries={libraries}
          activeLibrary={activeLibrary}
          onSelect={handleSelectLibrary}
          onAddClick={() => setShowAddModal(true)}
        />
        <ChatPanel
          activeLibrary={activeLibrary}
          libraries={libraries}
          messages={messages}
          loading={chatLoading}
          onSendMessage={sendMessage}
        />
      </div>

      {showAddModal && (
        <AddLibraryModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />
      )}

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "rgba(15, 23, 42, 0.9)",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            boxShadow: "0 24px 60px rgba(2, 6, 23, 0.45)",
            backdropFilter: "blur(20px)",
          },
        }}
      />
    </div>
  )
}

export default App
