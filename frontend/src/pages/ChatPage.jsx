import { useEffect, useRef } from 'react'
import MessageBubble from '../components/MessageBubble'
import ChatBox from '../components/ChatBox'
import EntityBadge from '../components/EntityBadge'
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

  // Collect all detected entities across conversation for the inspector panel
  const allEntities = messages
    .filter(m => m.role === 'assistant' && m.meta?.piiDetected)
    .flatMap(m => m.meta.detectedEntities || [])

  // Group by entity type
  const grouped = allEntities.reduce((acc, e) => {
    if (!acc[e.entity_type]) acc[e.entity_type] = []
    if (!acc[e.entity_type].find(x => x.original_text === e.original_text)) {
      acc[e.entity_type].push(e)
    }
    return acc
  }, {})

  const totalMasked = allEntities.length
  const hasInspectorData = totalMasked > 0

  return (
    <div className={`${styles.page} page-enter`}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Privacy Terminal</h1>
          <div className={styles.pills}>
            <span className={styles.pill}>
              <span className={styles.pillDot} style={{ background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
              Gemini connected
            </span>
            <span className={styles.pill}>
              <span className={styles.pillDot} style={{ background: 'var(--gold)' }} />
              Presidio active
            </span>
          </div>
        </div>
        {!isEmpty && (
          <button className={styles.clearBtn} onClick={clearHistory}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Clear session
          </button>
        )}
      </header>

      {/* ── Body: feed + inspector ── */}
      <div className={styles.body}>
        {/* Left: chat feed */}
        <div className={styles.feed}>
          {isEmpty
            ? <EmptyState onSelect={submit} />
            : (
              <>
                {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
                {loading && <TypingIndicator />}
                {error && (
                  <div className={styles.error}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <circle cx="6.5" cy="6.5" r="5.5" stroke="var(--red)" strokeWidth="1.2"/>
                      <path d="M6.5 4v3M6.5 9.5v.3" stroke="var(--red)" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    {error}
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )
          }
        </div>

        {/* Right: persistent inspector panel */}
        <aside className={styles.inspector}>
          <div className={styles.inspectorHeader}>
            <div className={styles.inspectorTitle}>
              {hasInspectorData && <span className={styles.inspectorDot} />}
              PII Inspector
              {hasInspectorData && (
                <span style={{ marginLeft: 'auto', color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                  {totalMasked} masked
                </span>
              )}
            </div>
          </div>

          <div className={styles.inspectorBody}>
            {!hasInspectorData ? (
              <div className={styles.inspectorEmpty}>
                <svg className={styles.inspectorEmptyIcon} width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 3L4 9V16c0 7.7 5.1 14.9 12 16.5 6.9-1.6 12-8.8 12-16.5V9L16 3z"
                    stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M11 16l3.5 3.5L21 12" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className={styles.inspectorEmptyText}>
                  Detected PII entities will appear here as you send prompts
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([type, entities]) => (
                <div key={type} className={styles.entityGroup}>
                  <p className={styles.entityGroupLabel}>{type.replace(/_/g, ' ')}</p>
                  <div className={styles.entityList}>
                    {entities.map((e, i) => (
                      <EntityBadge key={i} entity={e} compact />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* ── Input ── */}
      <ChatBox onSubmit={submit} loading={loading} />
    </div>
  )
}

function EmptyState({ onSelect }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emblem}>
        <div className={styles.emblemRing1} />
        <div className={styles.emblemRing2} />
        <div className={styles.emblemRing3} />
        <svg className={styles.emblemIcon} width="44" height="44" viewBox="0 0 44 44" fill="none">
          <path d="M22 4L6 12V22c0 9.4 6.5 18.2 16 20.5C31.5 40.2 38 31.4 38 22V12L22 4z"
            stroke="url(#sg)" strokeWidth="1.5" fill="rgba(232,160,32,0.06)"/>
          <path d="M15 22l5 5 9-9" stroke="url(#sg2)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"/>
          <defs>
            <linearGradient id="sg" x1="6" y1="4" x2="38" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e8a020"/><stop offset="1" stopColor="#f5c842"/>
            </linearGradient>
            <linearGradient id="sg2" x1="15" y1="18" x2="24" y2="27" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e8a020"/><stop offset="1" stopColor="#f5c842"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className={styles.emptyText}>
        <h2 className={styles.emptyTitle}>Zero-trust AI gateway</h2>
        <p className={styles.emptyDesc}>
          Every prompt is scanned for sensitive data before it reaches the AI.
          Names, credentials, financial data — all masked in transit.
        </p>
      </div>

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

      <div className={styles.examples}>
        <p className={styles.exTitle}>Try an example</p>
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
