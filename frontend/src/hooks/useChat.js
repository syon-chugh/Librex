import { useState, useCallback, useEffect } from "react"
import { askQuestion } from "../api/client"

const SEARCH_HISTORY_KEY = "librai_search_history"

export function useChat() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState({})

  // Load search history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load search history:", e)
      }
    }
  }, [])

  // Save search history to localStorage
  const saveToHistory = useCallback((library, question) => {
    setSearchHistory(prev => {
      const updated = { ...prev }
      if (!updated[library]) {
        updated[library] = []
      }
      // Add to beginning, max 10 per library
      updated[library] = [
        { question, timestamp: new Date().toISOString() },
        ...updated[library].filter(q => q.question !== question)
      ].slice(0, 10)
      
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const sendMessage = useCallback(async (question, library) => {
    // Add user message immediately
    const userMsg = { id: Date.now(), role: "user", content: question, sources: [] }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Save to search history
    saveToHistory(library, question)

    try {
      const data = await askQuestion(question, library)
      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        chunksUsed: data.chunks_used,
        confidenceScore: data.confidence_score,
        originalQuestion: data.original_question,
        rewrittenQuestion: data.rewritten_question
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
  }, [saveToHistory])

  const clearChat = useCallback(() => setMessages([]), [])

  const getLibraryHistory = useCallback((library) => {
    return searchHistory[library] || []
  }, [searchHistory])

  return { 
    messages, 
    loading, 
    sendMessage, 
    clearChat,
    searchHistory,
    getLibraryHistory 
  }
}
