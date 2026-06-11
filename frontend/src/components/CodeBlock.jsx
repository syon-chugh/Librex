import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { useState } from "react"
import toast from "react-hot-toast"

export default function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("Code copied")
    setTimeout(() => setCopied(false), 2000)
  }

  const lang = language || "javascript"

  return (
    <div className="code-block-wrapper">
      <div className="code-header">
        <span className="code-lang-label">{lang}</span>
        <button
          onClick={handleCopy}
          className={`copy-btn ${copied ? 'copied' : ''}`}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className="code-content">
        <SyntaxHighlighter
          language={lang}
          style={dark}
          customStyle={{
            margin: 0,
            padding: '14px 16px',
            background: 'transparent',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            lineHeight: '1.65',
            whiteSpace: 'pre',
            overflowX: 'auto',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}