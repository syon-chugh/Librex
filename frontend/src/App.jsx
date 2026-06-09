import { useState, useEffect } from "react"
import { useLibraries } from "./hooks/useLibraries"
import { useChat } from "./hooks/useChat"
import Sidebar from "./components/Sidebar"
import ChatPanel from "./components/ChatPanel"
import AddLibraryModal from "./components/AddLibraryModal"

function App() {
  const { libraries, loading, refetch } = useLibraries()
  const { messages, loading: chatLoading, sendMessage, clearChat } = useChat()
  const [activeLibrary, setActiveLibrary] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (libraries.length > 0 && !activeLibrary) {
      setActiveLibrary(libraries[0].name)
    }
  }, [libraries, activeLibrary])

  const handleSelectLibrary = (libName) => {
    setActiveLibrary(libName)
    clearChat()
  }

  const handleAddSuccess = () => {
    refetch()
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh"
        }}
      >
        <div>Loading libraries...</div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        libraries={libraries}
        activeLibrary={activeLibrary}
        onSelect={handleSelectLibrary}
        onAddClick={() => setShowAddModal(true)}
      />

      <ChatPanel
        activeLibrary={activeLibrary}
        messages={messages}
        loading={chatLoading}
        onSendMessage={sendMessage}
      />

      {showAddModal && (
        <AddLibraryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      <style>{`
        @keyframes blink {
          0%, 20%, 50%, 80%, 100% {
            opacity: 1;
          }
          40% {
            opacity: 0.5;
          }
          60% {
            opacity: 0.7;
          }
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        #root {
          height: 100%;
        }
      `}</style>
    </div>
  )
}

export default App
