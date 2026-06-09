const BASE_URL = "http://localhost:8000"

export const getLibraries = async () => {
  const res = await fetch(`${BASE_URL}/libraries`)
  if (!res.ok) throw new Error("Failed to fetch libraries")
  return res.json()
}

export const askQuestion = async (question, library) => {
  const res = await fetch(`${BASE_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, library })
  })
  if (!res.ok) throw new Error("Failed to ask question")
  return res.json()
}

export const indexLibrary = async (url, libraryName) => {
  const res = await fetch(`${BASE_URL}/index`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, library_name: libraryName })
  })
  if (!res.ok) throw new Error("Failed to start indexing")
  return res.json()
}

export const getIndexStatus = async (jobId) => {
  const res = await fetch(`${BASE_URL}/index/status/${jobId}`)
  if (!res.ok) throw new Error("Failed to get status")
  return res.json()
}
