import { useState, useEffect, useCallback } from "react"
import { getLibraries } from "../api/client"

export function useLibraries() {
  const [libraries, setLibraries] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLibraries = useCallback(async () => {
    try {
      const data = await getLibraries()
      setLibraries(data)
    } catch (err) {
      console.error("Failed to fetch libraries", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLibraries()
    const interval = setInterval(fetchLibraries, 10000)
    return () => clearInterval(interval)
  }, [fetchLibraries])

  return { libraries, loading, refetch: fetchLibraries }
}
