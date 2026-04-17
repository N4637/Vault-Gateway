import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { fetchStats } from '../api/dashboard'
import StatCard from '../components/StatCard'
import styles from './DashboardPage.module.css'

// Bar color per entity type — matches EntityBadge colors
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

const DEFAULT_COLOR = '#444444'

// Custom tooltip for the bar chart
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipType}>{payload[0].payload.entity_type}</p>
      <p className={styles.tooltipCount}>
        <span style={{ color: payload[0].fill }}>{payload[0].value}</span> detections
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchStats()
      .then(data => { if (!cancelled) setStats(data) })
      .catch(e  => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  const hasChart = stats?.entity_type_breakdown?.length > 0

  return (
    <div className={`${styles.page} page-enter`}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>System Monitor</h1>
          <p className={styles.subtitle}>Real-time activity across all sessions</p>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={() => window.location.reload()}
        >
          ↻ Refresh
        </button>
      </header>

      <div className={styles.body}>
        {error && (
          <div className={styles.error}>⚠ {error}</div>
        )}

        {/* ── Stat cards ── */}
        <div className={styles.statsGrid}>
          <StatCard
            label="Prompts processed"
            value={stats?.total_prompts_processed}
            loading={loading}
            accent
          />
          <StatCard
            label="PII fields masked"
            value={stats?.total_pii_fields_masked}
            loading={loading}
          />
          <StatCard
            label="Prompts with PII"
            value={stats?.prompts_with_pii}
            loading={loading}
          />
          <StatCard
            label="Clean prompts"
            value={stats?.prompts_without_pii}
            loading={loading}
          />
        </div>

        {/* ── Bar chart ── */}
        <div className={styles.chartPanel}>
          <p className={styles.chartLabel}>ENTITY TYPE BREAKDOWN</p>

          {loading && (
            <div className={styles.chartSkeleton}>
              {[80, 60, 45, 30, 20, 15].map((h, i) => (
                <div
                  key={i}
                  className={`${styles.skelBar} shimmer`}
                  style={{ height: h + '%' }}
                />
              ))}
            </div>
          )}

          {!loading && !hasChart && (
            <div className={styles.noData}>
              <span className={styles.noDataIcon}>◈</span>
              <p>No data yet — send some prompts from the Terminal</p>
            </div>
          )}

          {!loading && hasChart && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={stats.entity_type_breakdown}
                margin={{ top: 8, right: 8, left: -20, bottom: 40 }}
                barSize={28}
              >
                <XAxis
                  dataKey="entity_type"
                  tick={{ fill: '#555', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: '#242424' }}
                />
                <YAxis
                  tick={{ fill: '#444', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {stats.entity_type_breakdown.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={TYPE_COLORS[entry.entity_type] || DEFAULT_COLOR}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Entity table ── */}
        {!loading && hasChart && (
          <div className={styles.tablePanel}>
            <p className={styles.chartLabel}>DETECTION LOG</p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Entity type</th>
                  <th>Detections</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {stats.entity_type_breakdown.map((row, i) => {
                  const pct = stats.total_pii_fields_masked > 0
                    ? Math.round((row.count / stats.total_pii_fields_masked) * 100)
                    : 0
                  const color = TYPE_COLORS[row.entity_type] || DEFAULT_COLOR
                  return (
                    <tr key={i}>
                      <td>
                        <span className={styles.dot} style={{ background: color }} />
                        <span className={styles.monoCell}>{row.entity_type}</span>
                      </td>
                      <td className={styles.monoCell}>{row.count}</td>
                      <td>
                        <div className={styles.barCell}>
                          <div
                            className={styles.barFill}
                            style={{ width: pct + '%', background: color }}
                          />
                          <span className={styles.pct}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
