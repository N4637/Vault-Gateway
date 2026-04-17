import styles from './StatCard.module.css'

export default function StatCard({ label, value, accent = false, loading = false }) {
  return (
    <div className={`${styles.card} ${accent ? styles.accent : ''}`}>
      {loading ? (
        <div className={`${styles.valueSkeleton} shimmer`} />
      ) : (
        <p className={styles.value}>{value ?? '—'}</p>
      )}
      <p className={styles.label}>{label}</p>
    </div>
  )
}
