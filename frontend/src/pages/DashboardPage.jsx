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
  EMAIL_ADDRESS:       '#7eb8f7',
  PHONE_NUMBER:        '#f5a623',
  API_KEY:             '#ff5f5f',
  DATABASE_CREDENTIAL: '#ff5f5f',
  IP_ADDRESS:          '#c084fc',
  URL:                 '#67e8f9',
  CREDIT_CARD:         '#fb7185',
  IBAN_CODE:           '#fb7185',
  US_SSN:              '#fb7185',
  LOCATION:            '#86efac',
  DATE_TIME:           '#6b7280',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.ttType}>{payload[0].payload.entity_type}</p>
      <p className={styles.ttVal} style={{ color: payload[0].fill }}>
        {payload[0].value} <span style={{ color: 'var(--t3)' }}>detections</span>
      </p>
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

  // Pie-like percentage for each entity
  const total = stats?.total_pii_fields_masked || 1

  return (
    <div className={`${styles.page} page-enter`}>
      {/* ── Header ── */}
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

        {/* ── Stats ── */}
        <div className={styles.grid}>
          <StatCard label="Prompts processed" value={stats?.total_prompts_processed}
            loading={loading} accent />
          <StatCard label="PII fields masked" value={stats?.total_pii_fields_masked}
            loading={loading} />
          <StatCard label="Prompts with PII" value={stats?.prompts_with_pii}
            loading={loading} />
          <StatCard label="Clean prompts" value={stats?.prompts_without_pii}
            loading={loading} />
        </div>

        {/* ── Chart + Table side by side ── */}
        <div className={styles.row2}>
          {/* Bar chart */}
          <div className={styles.chartPanel}>
            <div className={styles.panelHeader}>
              <p className={styles.panelTitle}>Detection frequency</p>
              <p className={styles.panelSub}>by entity type</p>
            </div>

            {loading && (
              <div className={styles.skelChart}>
                {[90,65,50,35,25,15].map((h,i) => (
                  <div key={i} className={`${styles.skelBar} shimmer`} style={{ height: h+'%' }} />
                ))}
              </div>
            )}

            {!loading && !hasData && <NoData />}

            {!loading && hasData && (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={stats.entity_type_breakdown}
                  margin={{ top: 4, right: 4, left: -28, bottom: 48 }}
                  barSize={22}
                >
                  <XAxis
                    dataKey="entity_type"
                    tick={{ fill: '#3d3b52', fontSize: 9, fontFamily: 'IBM Plex Mono' }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--b1)' }}
                  />
                  <YAxis
                    tick={{ fill: '#3d3b52', fontSize: 9, fontFamily: 'IBM Plex Mono' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
                  <Bar dataKey="count" radius={[2,2,0,0]}>
                    {stats.entity_type_breakdown.map((e, i) => (
                      <Cell key={i} fill={TYPE_COLORS[e.entity_type] || '#444'} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Table */}
          {!loading && hasData && (
            <div className={styles.tablePanel}>
              <div className={styles.panelHeader}>
                <p className={styles.panelTitle}>Entity breakdown</p>
                <p className={styles.panelSub}>{stats.entity_type_breakdown.length} types detected</p>
              </div>
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
                    const pct = Math.round((row.count / total) * 100)
                    const color = TYPE_COLORS[row.entity_type] || '#444'
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
            </div>
          )}

          {!loading && !hasData && (
            <div className={styles.tablePanel}><NoData /></div>
          )}
        </div>
      </div>
    </div>
  )
}

function NoData() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', height:180, gap:10, color:'var(--t3)' }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" opacity="0.3">
        <rect x="2" y="18" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="12" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="16" y="6" width="4" height="20" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="23" y="2" width="4" height="24" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
      <p style={{ fontFamily:'var(--font-mono)', fontSize:11 }}>No data yet</p>
      <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--t4)' }}>
        Send prompts from the Terminal
      </p>
    </div>
  )
}