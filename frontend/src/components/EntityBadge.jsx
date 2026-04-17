import styles from './EntityBadge.module.css'

// Color per entity type so badges are visually distinct
const TYPE_COLORS = {
  PERSON:              '#00ff88',
  EMAIL_ADDRESS:       '#00cfff',
  PHONE_NUMBER:        '#ffaa00',
  API_KEY:             '#ff4444',
  DATABASE_CREDENTIAL: '#ff4444',
  IP_ADDRESS:          '#aa88ff',
  URL:                 '#88ccff',
  CREDIT_CARD:         '#ff6688',
  IBAN_CODE:           '#ff6688',
  US_SSN:              '#ff6688',
  LOCATION:            '#88ffcc',
  DATE_TIME:           '#cccccc',
}

export default function EntityBadge({ entity }) {
  const color = TYPE_COLORS[entity.entity_type] || '#888888'

  return (
    <div className={styles.badge} style={{ '--badge-color': color }}>
      <span className={styles.placeholder}>{entity.placeholder}</span>
      <span className={styles.arrow}>→</span>
      <span className={styles.original}>{entity.original_text}</span>
      <span className={styles.confidence}>
        {Math.round(entity.confidence * 100)}%
      </span>
    </div>
  )
}
