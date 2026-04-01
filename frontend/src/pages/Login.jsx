import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0f', position: 'relative', overflow: 'hidden',
    }}>
      {/* background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(#1a1a2810 1px, transparent 1px), linear-gradient(90deg, #1a1a2810 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />
      {/* glow */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, #6c3fff18 0%, transparent 70%)',
        top: '10%', left: '50%', transform: 'translateX(-50%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', width: 380 }}>
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: '#e8e8f0', letterSpacing: '-1px' }}>
            FinanceOS
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: '#3a3a6a', letterSpacing: '0.15em', marginTop: 6 }}>
            SECURE ACCESS PORTAL
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: '#0d0d14', border: '1px solid #1a1a28',
          borderRadius: 16, padding: 32,
        }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontFamily: 'DM Mono', color: '#3a3a6a', letterSpacing: '0.1em', marginBottom: 8 }}>
              EMAIL
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="admin@finance.dev"
              style={{
                width: '100%', padding: '11px 14px',
                background: '#111120', border: '1px solid #1a1a2e',
                borderRadius: 8, color: '#e8e8f0', fontSize: 14,
                fontFamily: 'DM Sans', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#6c3fff55'}
              onBlur={e => e.target.style.borderColor = '#1a1a2e'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontFamily: 'DM Mono', color: '#3a3a6a', letterSpacing: '0.1em', marginBottom: 8 }}>
              PASSWORD
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••"
              style={{
                width: '100%', padding: '11px 14px',
                background: '#111120', border: '1px solid #1a1a2e',
                borderRadius: 8, color: '#e8e8f0', fontSize: 14,
                fontFamily: 'DM Sans', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#6c3fff55'}
              onBlur={e => e.target.style.borderColor = '#1a1a2e'}
            />
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: '#ff4d4d14', border: '1px solid #ff4d4d30', borderRadius: 8, fontSize: 13, color: '#ff8080' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px',
            background: loading ? '#2a1a5a' : '#6c3fff',
            border: 'none', borderRadius: 8, color: '#fff',
            fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Syne', letterSpacing: '0.5px',
            transition: 'background 0.15s',
          }}>
            {loading ? 'authenticating…' : 'Sign in'}
          </button>

          <div style={{ marginTop: 20, padding: '12px 14px', background: '#111120', borderRadius: 8, border: '1px solid #1a1a28' }}>
            <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: '#3a3a6a', marginBottom: 6, letterSpacing: '0.08em' }}>DEMO ACCOUNTS</div>
            {[['admin@finance.dev','Admin@1234','admin'],['analyst@finance.dev','Analyst@1234','analyst'],['viewer@finance.dev','Viewer@1234','viewer']].map(([em, pw, role]) => (
              <div key={role} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize: 11, color: '#4a4a6a', fontFamily: 'DM Mono' }}>{em}</span>
                <button type="button" onClick={() => { setEmail(em); setPassword(pw) }}
                  style={{ fontSize: 10, background: 'none', border: '1px solid #2a2a45', borderRadius: 4, color: '#6a6a9a', cursor: 'pointer', padding: '2px 8px', fontFamily: 'DM Mono' }}>
                  use
                </button>
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  )
}
