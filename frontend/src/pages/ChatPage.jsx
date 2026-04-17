import { useEffect, useRef } from 'react'
import { usePrompt } from '../hooks/usePrompt'
import MessageBubble from '../components/MessageBubble'
import ChatBox from '../components/ChatBox'
import styles from './ChatPage.module.css'

const EXAMPLE_PROMPTS = [
  'Draft an email to john.smith@acme.com about the Q3 report',
  'My API key is sk-abc123xyz. How do I rotate it securely?',
  'Summarize this: client Sarah Connor, phone 555-867-5309',
]

export default function ChatPage() {
  const { messages, loading, error, submit, clearHistory } = usePrompt()
  const bottomRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const isEmpty = messages.length === 0

  return (
    <div className={`${styles.page} page-enter`}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Privacy Terminal</h1>
          <p className={styles.subtitle}>
            Prompts are sanitized before reaching the AI
          </p>
        </div>
        {messages.length > 0 && (
          <button className={styles.clearBtn} onClick={clearHistory}>
            Clear session
          </button>
        )}
      </header>

      {/* ── Messages ── */}
      <div className={styles.feed}>
        {isEmpty ? (
          <EmptyState onSelect={submit} />
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}

            {loading && <TypingIndicator />}

            {error && (
              <div className={styles.error}>
                <span className={styles.errorIcon}>⚠</span>
                {error}
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <ChatBox onSubmit={submit} loading={loading} />
    </div>
  )
}

function EmptyState({ onSelect }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>
        <span className={styles.lockGlyph}>⚿</span>
      </div>
      <h2 className={styles.emptyTitle}>Zero-trust prompt gateway</h2>
      <p className={styles.emptyDesc}>
        PII is detected and masked before your prompt leaves this machine.
        The AI never sees your real data.
      </p>
      <div className={styles.examples}>
        <p className={styles.examplesLabel}>TRY AN EXAMPLE</p>
        {EXAMPLE_PROMPTS.map((p, i) => (
          <button key={i} className={styles.exampleBtn} onClick={() => onSelect(p)}>
            <span className={styles.exampleArrow}>→</span>
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className={styles.typingRow}>
      <span className={styles.typingTag}>VAULT</span>
      <div className={styles.typingDots}>
        <span /><span /><span />
      </div>
    </div>
  )
}
