import MaskViewer from './MaskViewer'
import styles from './MessageBubble.module.css'

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const hasPii  = message.meta?.piiDetected

  return (
    <div className={`${styles.row} ${isUser ? styles.user : styles.assistant}`}>
      {/* Role label */}
      <div className={styles.label}>
        {isUser ? (
          <span className={styles.labelUser}>YOU</span>
        ) : (
          <span className={styles.labelVault}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1L1.5 2.75V5c0 2.1 1.5 3.9 3.5 4.5 2-.6 3.5-2.4 3.5-4.5V2.75L5 1z"
                fill="var(--amber)" opacity="0.9"/>
            </svg>
            VAULT
          </span>
        )}
      </div>

      {/* Bubble */}
      <div className={`${styles.bubble} ${hasPii ? styles.piiGlow : ''}`}>
        {hasPii && <div className={styles.piiStripe} />}
        <p className={styles.content}>{message.content}</p>
        {!isUser && message.meta && <MaskViewer meta={message.meta} />}
      </div>
    </div>
  )
}