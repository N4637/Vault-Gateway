import MaskViewer from './MaskViewer'
import styles from './MessageBubble.module.css'

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`${styles.row} ${isUser ? styles.userRow : styles.assistantRow}`}>
      <div className={styles.roleTag}>
        {isUser ? 'YOU' : 'VAULT'}
      </div>

      <div className={styles.bubble}>
        <p className={styles.content}>{message.content}</p>
        {!isUser && message.meta && <MaskViewer meta={message.meta} />}
      </div>
    </div>
  )
}
