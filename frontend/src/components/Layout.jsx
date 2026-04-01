import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const s = {
  shell: { display:'flex', height:'100vh', background:'#0a0a0f' },
  sidebar: {
    width: 220, minWidth: 220, background: '#0d0d14',
    borderRight: '1px solid #1a1a28',
    display: 'flex', flexDirection: 'column',
    padding: '0 0 24px',
  },
  logo: {
    padding: '28px 24px 24px',
    borderBottom: '1px solid #1a1a28',
    marginBottom: 12,
  },
  logoText: {
    fontFamily: 'Syne, sans-serif', fontWeight: 800,
    fontSize: 18, color: '#e8e8f0', letterSpacing: '-0.5px',
  },
  logoSub: { fontSize: 10, color: '#3a3a55', marginTop: 2, fontFamily: 'DM Mono', letterSpacing: '0.1em' },
  nav: { flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 8,
    fontSize: 13, fontWeight: 400,
    color: '#4a4a6a', textDecoration: 'none',
    transition: 'all 0.15s',
  },
  navActive: {
    background: '#151520', color: '#c8b8ff',
    fontWeight: 500,
  },
  icon: { width: 16, height: 16, opacity: 0.7 },
  userBox: {
    margin: '0 12px',
    background: '#111120',
    border: '1px solid #1a1a2e',
    borderRadius: 10, padding: '10px 12px',
  },
  userName: { fontSize: 13, fontWeight: 500, color: '#c8c8e0' },
  userRole: {
    fontSize: 10, fontFamily: 'DM Mono',
    color: '#3a3a6a', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2,
  },
  logoutBtn: {
    marginTop: 8, width: '100%', textAlign: 'left',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 11, color: '#3a3a6a', fontFamily: 'DM Sans',
    padding: 0,
    transition: 'color 0.15s',
  },
  main: { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' },
  topbar: {
    padding: '20px 32px 0',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid #1a1a28', paddingBottom: 20,
  },
  content: { flex: 1, padding: '28px 32px', overflowY: 'auto' },
}

const navLinks = [
  { to: '/', label: 'Overview', exact: true, icon: <GridIcon /> },
  { to: '/records', label: 'Records', icon: <RecordsIcon /> },
  { to: '/users', label: 'Users', icon: <UsersIcon /> },
]

function GridIcon() {
  return <svg style={s.icon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>
}
function RecordsIcon() {
  return <svg style={s.icon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><line x1="5" y1="6" x2="11" y2="6"/><line x1="5" y1="9" x2="9" y2="9"/></svg>
}
function UsersIcon() {
  return <svg style={s.icon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="2.5"/><path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5"/><path d="M11 7.5c1.38 0 2.5 1.12 2.5 2.5v3"/></svg>
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const roleColor = { admin: '#f97316', analyst: '#22d3ee', viewer: '#a78bfa' }[user?.role] || '#888'

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoText}>FinanceOS</div>
          <div style={s.logoSub}>DASHBOARD v1.0</div>
        </div>
        <nav style={s.nav}>
          {navLinks.map(({ to, label, icon, exact }) => (
            <NavLink
              key={to} to={to}
              end={exact}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
            >
              {icon} {label}
            </NavLink>
          ))}
        </nav>
        <div style={s.userBox}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'#1a1a2e', border:'1px solid #2a2a45', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color: roleColor }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={s.userName}>{user?.name}</div>
              <div style={{ ...s.userRole, color: roleColor }}>{user?.role}</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>sign out →</button>
        </div>
      </aside>
      <div style={s.main}>
        <div style={s.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
