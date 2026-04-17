import { useState } from 'react'
import EntityBadge from './EntityBadge'
import styles from './MaskViewer.module.css'

export default function MaskViewer({ meta }) {
  const [open, setOpen] = useState(false)

  if (!meta?.piiDetected) return null

  const count = meta.detectedEntities?.length ?? 0

  return (
    <div className={styles.wrapper}>
      <button className={styles.toggle} onClick={() => setOpen(o => !o)}>
        <span className={styles.shield}>⚿</span>
        <span className={styles.summary}>
          <span className={styles.count}>{count}</span> field{count !== 1 ? 's' : ''} masked
        </span>
        <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.panel}>
          {/* Masked prompt */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>SANITIZED PROMPT</p>
            <pre className={styles.maskedText}>{meta.maskedPrompt}</pre>
          </div>

          {/* Entity list */}
          {meta.detectedEntities?.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>DETECTED ENTITIES</p>
              <div className={styles.entities}>
                {meta.detectedEntities.map((e, i) => (
                  <EntityBadge key={i} entity={e} />
                ))}
              </div>
            </div>
          )}

          {/* Unresolved warning */}
          {meta.unresolved?.length > 0 && (
            <div className={styles.warning}>
              ⚠ {meta.unresolved.length} placeholder(s) unresolved in response
            </div>
          )}
        </div>
      )}
    </div>
  )
}
