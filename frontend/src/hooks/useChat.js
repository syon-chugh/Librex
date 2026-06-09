import { useState, useCallback } from "react"
import { askQuestion } from "../api/client"

export function useChat() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const sendMessage = useCallback(async (question, library) => {
    // Add user message immediately
    const userMsg = { id: Date.now(), role: "user", content: question, sources: [] }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const data = await askQuestion(question, library)
      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        chunksUsed: data.chunks_used
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      console.error("Error:", err)
      const errorMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Something went wrong. Is the backend running?",
        sources: []
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }, [])

  const clearChat = useCallback(() => setMessages([]), [])

  return { messages, loading, sendMessage, clearChat }
}
