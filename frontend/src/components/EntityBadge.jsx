import styles from './EntityBadge.module.css'

const TYPE_META = {
  PERSON:              { color: '#3ecf8e', label: 'PERSON' },
  EMAIL_ADDRESS:       { color: '#7eb8f7', label: 'EMAIL' },
  PHONE_NUMBER:        { color: '#f5a623', label: 'PHONE' },
  API_KEY:             { color: '#ff5f5f', label: 'API KEY' },
  DATABASE_CREDENTIAL: { color: '#ff5f5f', label: 'DB CRED' },
  IP_ADDRESS:          { color: '#c084fc', label: 'IP ADDR' },
  URL:                 { color: '#67e8f9', label: 'URL' },
  CREDIT_CARD:         { color: '#fb7185', label: 'CARD' },
  IBAN_CODE:           { color: '#fb7185', label: 'IBAN' },
  US_SSN:              { color: '#fb7185', label: 'SSN' },
  LOCATION:            { color: '#86efac', label: 'LOCATION' },
  DATE_TIME:           { color: '#9ca3af', label: 'DATETIME' },
}

export default function EntityBadge({ entity }) {
  const meta = TYPE_META[entity.entity_type] || { color: '#6b7280', label: entity.entity_type }

  return (
    <div className={styles.badge} style={{ '--c': meta.color }}>
      <span className={styles.type}>{meta.label}</span>
      <span className={styles.divider} />
      <span className={styles.placeholder}>{entity.placeholder}</span>
      <span className={styles.arrow}>→</span>
      <span className={styles.original}>{entity.original_text}</span>
      <span className={styles.conf}>{Math.round(entity.confidence * 100)}%</span>
    </div>
  )
}