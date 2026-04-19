import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { fetchStats } from '../api/dashboard'
import StatCard from '../components/StatCard'
import styles from './DashboardPage.module.css'

const TYPE_COLORS = {
  PERSON:              '#3ecf8e',
  EMAIL_ADDRESS:       '#6eb4f5',
  PHONE_NUMBER:        '#e8a020',
  API_KEY:             '#f05454',
  DATABASE_CREDENTIAL: '#f05454',
  SECRET:              '#6b7280',
  IP_ADDRESS:          '#b07ef5',
  URL:                 '#67e8f9',
  CREDIT_CARD:         '#fb7185',
  IBAN_CODE:           '#fb7185',
  US_SSN:              '#fb7185',
  LOCATION:            '#86efac',
  DATE_TIME:           '#9ca3af',
  NRP:                 '#fbbf24',
}
const DEFAULT_COLOR = '#3d3b52'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.ttType}>{payload[0].payload.entity_type}</p>
      <p className={styles.ttVal} style={{ color: payload[0].fill }}>
        {payload[0].value}
        <span style={{ color: 'var(--t3)', fontSize: 11, fontWeight: 400, marginLeft: 6 }}>detections</span>
      </p>
    </div>
  )
}

function NoData() {
  return (
    <div className={styles.noData}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" opacity="0.25">
        <rect x="2" y="20" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="13" width="5" height="17" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="18" y="7" width="5" height="23" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="26" y="2" width="5" height="28" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
      <p>No data yet</p>
      <span>Send prompts from the Terminal</span>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchStats()
      .then(d  => { if (!cancelled) setStats(d) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const hasData = stats?.entity_type_breakdown?.length > 0
  const total   = stats?.total_pii_fields_masked || 1

  return (
    <div className={`${styles.page} page-enter`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>System Monitor</h1>
          <p className={styles.sub}>Aggregated activity across all sessions</p>
        </div>
        <button className={styles.refreshBtn} onClick={() => window.location.reload()}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M10 6A4 4 0 112 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M10 3v3H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Refresh
        </button>
      </header>

      <div className={styles.body}>
        {error && <div className={styles.error}>⚠ {error}</div>}

        {/* Stat cards */}
        <div className={styles.grid}>
          <StatCard label="Prompts processed" value={stats?.total_prompts_processed} loading={loading} accent />
          <StatCard label="PII fields masked"  value={stats?.total_pii_fields_masked}  loading={loading} />
          <StatCard label="Prompts with PII"   value={stats?.prompts_with_pii}          loading={loading} />
          <StatCard label="Clean prompts"       value={stats?.prompts_without_pii}       loading={loading} />
        </div>

        {/* Chart + Table */}
        <div className={styles.row2}>
          {/* Bar chart */}
          <div className={styles.chartPanel}>
            <div className={styles.panelHeader}>
              <p className={styles.panelTitle}>Detection frequency</p>
              <p className={styles.panelSub}>by entity type</p>
            </div>

            {loading && (
              <div className={styles.skelChart}>
                {[90,72,70,55,42,30,22,16,10,8].map((h,i) => (
                  <div key={i} className={`${styles.skelBar} shimmer`} style={{ height: h+'%' }} />
                ))}
              </div>
            )}

            {!loading && !hasData && <NoData />}

            {!loading && hasData && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stats.entity_type_breakdown}
                  margin={{ top: 8, right: 12, left: -16, bottom: 72 }}
                  barSize={20}
                  barCategoryGap="28%"
                >
                  <XAxis
                    dataKey="entity_type"
                    tick={{ fill: '#4a4860', fontSize: 9, fontFamily: 'IBM Plex Mono', letterSpacing: '0.04em' }}
                    angle={-42}
                    textAnchor="end"
                    interval={0}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <YAxis
                    tick={{ fill: '#4a4860', fontSize: 9, fontFamily: 'IBM Plex Mono' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="count" radius={[3,3,0,0]}>
                    {stats.entity_type_breakdown.map((e, i) => (
                      <Cell key={i}
                        fill={TYPE_COLORS[e.entity_type] || DEFAULT_COLOR}
                        fillOpacity={0.88}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Table */}
          <div className={styles.tablePanel}>
            <div className={styles.panelHeader}>
              <p className={styles.panelTitle}>Entity breakdown</p>
              {hasData && (
                <p className={styles.panelSub}>{stats.entity_type_breakdown.length} types</p>
              )}
            </div>

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="shimmer"
                    style={{ height: 32, borderRadius: 4, animationDelay: i*0.1+'s' }} />
                ))}
              </div>
            )}

            {!loading && !hasData && <NoData />}

            {!loading && hasData && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Count</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.entity_type_breakdown.map((row, i) => {
                    const pct   = Math.round((row.count / total) * 100)
                    const color = TYPE_COLORS[row.entity_type] || DEFAULT_COLOR
                    return (
                      <tr key={i}>
                        <td>
                          <span className={styles.dot} style={{ background: color }} />
                          <span className={styles.monoCell}>{row.entity_type}</span>
                        </td>
                        <td><span className={styles.monoCell}>{row.count}</span></td>
                        <td>
                          <div className={styles.barWrap}>
                            <div className={styles.barFill}
                              style={{ width: Math.max(pct, 2)+'%', background: color }} />
                            <span className={styles.pct}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
