import { useState, useEffect } from "react"
import { useLibraries } from "./hooks/useLibraries"
import { useChat } from "./hooks/useChat"
import Sidebar from "./components/Sidebar"
import ChatPanel from "./components/ChatPanel"
import AddLibraryModal from "./components/AddLibraryModal"
import { Toaster } from "react-hot-toast"

function App() {
  const { libraries, loading, refetch } = useLibraries()
  const { messages, loading: chatLoading, sendMessage, clearChat, getLibraryHistory } = useChat()
  const [activeLibrary, setActiveLibrary] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  // Apply theme
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  // Set active library
  useEffect(() => {
    if (libraries.length > 0 && !activeLibrary) {
      setActiveLibrary(libraries[0].name)
    }
  }, [libraries, activeLibrary])

  // Keyboard shortcut: Cmd/Ctrl+K to focus composer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const textarea = document.querySelector('.composer-textarea')
        if (textarea) textarea.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  if (loading) {
    return (
      <div className="app">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: "1rem", color: "var(--muted-foreground)" }}>
          Loading libraries...
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Editorial Codex Header */}
      <div className="app-header">
        <div className="logo-section">
          <div className="logo">L</div>
          <div className="wordmark">Librex</div>
          <div className="tag">codex v1</div>
        </div>
        <div className="header-right">
          <div className="shortcut-chip">⌘K</div>
          <button 
            className="theme-toggle" 
            onClick={toggleTheme} 
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="app-container">
        {/* Sidebar */}
        <Sidebar
          libraries={libraries}
          activeLibrary={activeLibrary}
          onSelect={handleSelectLibrary}
          onAddClick={() => setShowAddModal(true)}
        />

        {/* Chat Area */}
        <ChatPanel
          activeLibrary={activeLibrary}
          libraries={libraries}
          messages={messages}
          loading={chatLoading}
          onSendMessage={sendMessage}
        />
      </div>

      {/* Add Library Modal */}
      {showAddModal && (
        <AddLibraryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Toast Notifications */}
      <Toaster position="bottom-right" />
    </div>
  )
}

export default App