import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import styles from './Layout.module.css'

const NAV = [
  {
    to: '/chat',
    label: 'Terminal',
    sub: 'Privacy gateway',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 7l3 2-3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    to: '/dashboard',
    label: 'Monitor',
    sub: 'Activity stats',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="10" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="7" y="6" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="12" y="2" width="3" height="14" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
]

export default function Layout() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={styles.shell}>
      {/* ── Sidebar ── */}
      <aside
        className={`${styles.sidebar} ${expanded ? styles.expanded : ''}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 5.5V10c0 3.87 2.97 7.5 7 8.5 4.03-1 7-4.63 7-8.5V5.5L10 2z"
                stroke="var(--amber)" strokeWidth="1.5" fill="rgba(245,166,35,0.08)"/>
              <path d="M7 10l2 2 4-4" stroke="var(--amber)" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoName}>VAULT</span>
            <span className={styles.logoTag}>Privacy Gateway</span>
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {NAV.map(({ to, label, sub, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span className={styles.navMeta}>
                <span className={styles.navLabel}>{label}</span>
                <span className={styles.navSub}>{sub}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.statusDot} />
          <span className={styles.statusLabel}>System active</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
