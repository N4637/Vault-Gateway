import { useState, useRef, useEffect } from 'react'
import styles from './ChatBox.module.css'

export default function ChatBox({ onSubmit, loading }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [text])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.box}>
        <span className={styles.prompt}>$</span>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Type a prompt… (Shift+Enter for newline)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={1}
        />
        <button
          className={styles.send}
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          aria-label="Send"
        >
          {loading ? <span className={styles.spinner} /> : '↑'}
        </button>
      </div>
      <p className={styles.hint}>
        Enter to send &nbsp;·&nbsp; Shift+Enter for newline &nbsp;·&nbsp; PII is masked automatically
      </p>
    </div>
  )
}
