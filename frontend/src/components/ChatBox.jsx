import { useState, useRef, useEffect } from 'react'
import styles from './ChatBox.module.css'

export default function ChatBox({ onSubmit, loading }) {
  const [text, setText] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const ta = ref.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
  }, [text])

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      fire()
    }
  }

  function fire() {
    const t = text.trim()
    if (!t || loading) return
    onSubmit(t)
    setText('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  const charCount = text.length
  const nearLimit = charCount > 8000

  return (
    <div className={styles.wrap}>
      {/* Top rule */}
      <div className={styles.rule} />

      <div className={`${styles.inputArea} ${loading ? styles.processing : ''}`}>
        {/* Prompt symbol */}
        <span className={styles.symbol}>›</span>

        <textarea
          ref={ref}
          className={styles.ta}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          placeholder="Enter prompt — PII is detected and masked automatically"
          rows={1}
        />

        <div className={styles.controls}>
          {charCount > 0 && (
            <span className={`${styles.chars} ${nearLimit ? styles.charsWarn : ''}`}>
              {charCount.toLocaleString()}
            </span>
          )}
          <button
            className={`${styles.sendBtn} ${!text.trim() || loading ? styles.sendDisabled : ''}`}
            onClick={fire}
            disabled={!text.trim() || loading}
            aria-label="Send"
          >
            {loading
              ? <span className={styles.spinner} />
              : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 12V2M2 7l5-5 5 5" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )
            }
          </button>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.hint}>↵ send &nbsp;·&nbsp; ⇧↵ newline</span>
        <span className={styles.hint}>PII detection powered by Presidio</span>
      </div>
    </div>
  )
}