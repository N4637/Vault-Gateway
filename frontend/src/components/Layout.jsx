import { NavLink, Outlet } from 'react-router-dom'
import styles from './Layout.module.css'

const NAV = [
  { to: '/chat',      label: 'Terminal',   icon: '⌘' },
  { to: '/dashboard', label: 'Monitor',    icon: '◈' },
]

export default function Layout() {
  return (
    <div className={styles.shell}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>V</span>
          <span className={styles.logoText}>AULT</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.statusRow}>
            <span className="pulse-dot" />
            <span className={styles.statusText}>API online</span>
          </div>
          <p className={styles.version}>v0.1.0</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
