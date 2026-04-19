import { useEffect, useRef } from 'react'
import MessageBubble from '../components/MessageBubble'
import ChatBox from '../components/ChatBox'
import styles from './ChatPage.module.css'

const EXAMPLES = [
  {
    label: 'Email draft',
    prompt: 'Draft a professional email to john.smith@acme.com about delaying the Q4 report by one week.',
  },
  {
    label: 'Secret in code',
    prompt: 'Review this config: DB_PASS=Sup3rS3cr3t! API_KEY=sk-abc123xyz789. How should I store these securely?',
  },
  {
    label: 'Client data',
    prompt: 'Summarize: Client Sarah Connor, DOB 1984-03-15, SSN 123-45-6789 needs a refund for order #8821.',
  },
]

export default function ChatPage({ messages, loading, error, submit, clearHistory }) {
  const bottomRef = useRef(null)
  const isEmpty = messages.length === 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className={`${styles.page} page-enter`}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Privacy Terminal</h1>
          <div className={styles.pills}>
            <span className={styles.pill}>
              <span className={styles.pillDot} style={{ background: 'var(--green)' }} />
              Gemini connected
            </span>
            <span className={styles.pill}>
              <span className={styles.pillDot} style={{ background: 'var(--amber)' }} />
              Presidio active
            </span>
          </div>
        </div>
        {!isEmpty && (
          <button className={styles.clearBtn} onClick={clearHistory}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Clear
          </button>
        )}
      </header>

      {/* ── Feed ── */}
      <div className={styles.feed}>
        {isEmpty ? <EmptyState onSelect={submit} /> : (
          <>
            {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
            {loading && <TypingIndicator />}
            {error && (
              <div className={styles.error}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="var(--red)" strokeWidth="1.2"/>
                  <path d="M6.5 4v3.5M6.5 9.5v.5" stroke="var(--red)" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatBox onSubmit={submit} loading={loading} />
    </div>
  )
}

function EmptyState({ onSelect }) {
  return (
    <div className={styles.empty}>
      {/* Central shield emblem */}
      <div className={styles.emblem}>
        <div className={styles.emblemRing} />
        <div className={styles.emblemRing2} />
        <svg className={styles.emblemIcon} width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M20 4L6 11V20c0 8.3 5.9 16.1 14 18.5C28.1 36.1 34 28.3 34 20V11L20 4z"
            stroke="var(--amber)" strokeWidth="1.5" fill="rgba(245,166,35,0.06)"/>
          <path d="M14 20l4 4 8-8" stroke="var(--amber)" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className={styles.emptyText}>
        <h2 className={styles.emptyTitle}>Zero-trust AI gateway</h2>
        <p className={styles.emptyDesc}>
          Every prompt is scanned for sensitive data before it reaches the AI.
          Names, credentials, financial data — all masked in transit.
        </p>
      </div>

      {/* Flow diagram */}
      <div className={styles.flow}>
        {['Your prompt', 'PII masked', 'AI processes', 'Data restored'].map((step, i) => (
          <div key={i} className={styles.flowStep}>
            <div className={`${styles.flowNode} ${i === 1 ? styles.flowNodeActive : ''}`}>
              <span className={styles.flowNum}>{i + 1}</span>
            </div>
            <span className={styles.flowLabel}>{step}</span>
            {i < 3 && <div className={styles.flowArrow}>→</div>}
          </div>
        ))}
      </div>

      {/* Example prompts */}
      <div className={styles.examples}>
        <p className={styles.exTitle}>TRY AN EXAMPLE</p>
        <div className={styles.exGrid}>
          {EXAMPLES.map((ex, i) => (
            <button key={i} className={styles.exCard} onClick={() => onSelect(ex.prompt)}>
              <span className={styles.exLabel}>{ex.label}</span>
              <span className={styles.exText}>{ex.prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className={styles.typing}>
      <span className={styles.typingLabel}>VAULT</span>
      <div className={styles.dots}>
        <span /><span /><span />
      </div>
    </div>
  )
}