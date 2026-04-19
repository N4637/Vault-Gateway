import { useState } from 'react'
import EntityBadge from './EntityBadge'
import styles from './MaskViewer.module.css'

export default function MaskViewer({ meta }) {
  const [open, setOpen] = useState(false)
  if (!meta?.piiDetected) return null

  const count = meta.detectedEntities?.length ?? 0
  const types = Object.keys(meta.entitySummary ?? {})

  return (
    <div className={`${styles.wrap} ${open ? styles.open : ''}`}>
      <button className={styles.bar} onClick={() => setOpen(o => !o)}>
        <div className={styles.barLeft}>
          <svg className={styles.shieldIcon} width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1.5L2 3.5V6.5c0 2.7 2 4.8 4.5 5.5 2.5-.7 4.5-2.8 4.5-5.5V3.5L6.5 1.5z"
              stroke="var(--amber)" strokeWidth="1.2" fill="var(--amber-dim)"/>
            <path d="M4.5 6.5l1.5 1.5 2.5-2.5" stroke="var(--amber)" strokeWidth="1.2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className={styles.barCount}>{count} field{count !== 1 ? 's' : ''} masked</span>
          <div className={styles.typeChips}>
            {types.slice(0, 3).map(t => (
              <span key={t} className={styles.typeChip}>{t.replace('_', ' ')}</span>
            ))}
            {types.length > 3 && <span className={styles.typeChip}>+{types.length - 3}</span>}
          </div>
        </div>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          width="12" height="12" viewBox="0 0 12 12" fill="none"
        >
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.section}>
            <p className={styles.sLabel}>SANITIZED PROMPT SENT TO AI</p>
            <pre className={styles.masked}>{meta.maskedPrompt}</pre>
          </div>

          {meta.detectedEntities?.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sLabel}>DETECTED & MASKED ENTITIES</p>
              <div className={styles.entities}>
                {meta.detectedEntities.map((e, i) => (
                  <EntityBadge key={i} entity={e} />
                ))}
              </div>
            </div>
          )}

          {meta.unresolved?.length > 0 && (
            <div className={styles.warn}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L11 10H1L6 1z" stroke="var(--amber)" strokeWidth="1.2"/>
                <path d="M6 5v2.5M6 9v.5" stroke="var(--amber)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {meta.unresolved.length} token(s) could not be rehydrated
            </div>
          )}
        </div>
      )}
    </div>
  )
}