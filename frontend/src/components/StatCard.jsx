import styles from './StatCard.module.css'

export default function StatCard({ label, value, accent, sub, loading }) {
  return (
    <div className={`${styles.card} ${accent ? styles.accent : ''}`}>
      {loading ? (
        <>
          <div className={`${styles.skelVal} shimmer`} />
          <div className={`${styles.skelLab} shimmer`} />
        </>
      ) : (
        <>
          <p className={styles.value}>{value ?? '—'}</p>
          {sub && <p className={styles.sub}>{sub}</p>}
          <p className={styles.label}>{label}</p>
        </>
      )}
    </div>
  )
}
