import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { useState } from "react"

export default function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lang = language || "javascript"

  return (
    <div style={{ position: "relative", margin: "12px 0" }}>
      <div
        style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          fontSize: "11px",
          color: "#888",
          textTransform: "uppercase",
          fontWeight: "600"
        }}
      >
        {lang}
      </div>
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          padding: "4px 8px",
          fontSize: "12px",
          backgroundColor: "#0F6E56",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          zIndex: 10
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <SyntaxHighlighter
        language={lang}
        style={dark}
        customStyle={{
          margin: "0",
          borderRadius: "6px",
          padding: "16px"
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
