import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

const inputStyle = {
  width: '100%', padding: '9px 12px',
  background: '#111120', border: '1px solid #1a1a2e',
  borderRadius: 8, color: '#e8e8f0', fontSize: 13,
  fontFamily: 'DM Sans', outline: 'none',
}
const labelStyle = {
  display: 'block', fontSize: 10, fontFamily: 'DM Mono',
  color: '#3a3a6a', letterSpacing: '0.1em', marginBottom: 6,
}

const roleColor = { admin: '#f97316', analyst: '#22d3ee', viewer: '#a78bfa' }

function UserModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ email:'', name:'', role:'viewer', password:'' })
  const [err, setErr]   = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { setForm({ email:'', name:'', role:'viewer', password:'' }); setErr('') }, [open])
  if (!open) return null

  async function submit(e) {
    e.preventDefault(); setSaving(true); setErr('')
    try { await onSave(form); onClose() }
    catch(e) { setErr(e.error || 'Error creating user') }
    finally { setSaving(false) }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#0d0d14', border:'1px solid #1a1a28', borderRadius:16, padding:28, width:380 }}>
        <div style={{ fontFamily:'Syne', fontSize:16, fontWeight:700, marginBottom:20, color:'#e8e8f0' }}>New User</div>
        <form onSubmit={submit}>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>NAME</label>
            <input style={inputStyle} value={form.name} onChange={set('name')} required placeholder="Full name" />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>EMAIL</label>
            <input style={inputStyle} type="email" value={form.email} onChange={set('email')} required placeholder="user@example.com" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div>
              <label style={labelStyle}>ROLE</label>
              <select style={inputStyle} value={form.role} onChange={set('role')}>
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>PASSWORD</label>
              <input style={inputStyle} type="password" value={form.password} onChange={set('password')} required placeholder="min 8 chars" />
            </div>
          </div>
          {err && <div style={{ marginBottom:12, padding:'8px 12px', background:'#ff4d4d14', border:'1px solid #ff4d4d30', borderRadius:8, fontSize:12, color:'#ff8080' }}>{err}</div>}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding:'9px 18px', background:'none', border:'1px solid #2a2a3a', borderRadius:8, color:'#6a6a9a', cursor:'pointer', fontSize:13 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding:'9px 18px', background:'#6c3fff', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:500 }}>
              {saving ? 'creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)

  if (me?.role !== 'admin') {
    return (
      <div style={{ display:'flex', height:'60vh', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
        <div style={{ fontSize:32, opacity:0.3 }}>⛔</div>
        <div style={{ fontFamily:'DM Mono', fontSize:13, color:'#3a3a6a' }}>admin access required</div>
      </div>
    )
  }

  async function load() {
    setLoading(true)
    try { const d = await api.users(); setUsers(d.results || []) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(form) {
    await api.createUser(form); load()
  }

  async function handleToggle(u) {
    await api.updateUser(u.id, { is_active: !u.is_active }); load()
  }

  async function handleDelete(id) {
    if (!confirm('Deactivate this user?')) return
    await api.deleteUser(id); load()
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:24, color:'#e8e8f0', letterSpacing:'-0.5px' }}>Users</div>
          <div style={{ fontSize:12, color:'#3a3a6a', marginTop:3 }}>{users.length} accounts</div>
        </div>
        <button onClick={() => setModal(true)} style={{
          padding:'9px 20px', background:'#6c3fff', border:'none', borderRadius:8,
          color:'#fff', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'Syne',
        }}>+ New User</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
        {loading ? (
          <div style={{ padding:32, color:'#3a3a6a', fontFamily:'DM Mono', fontSize:12 }}>loading…</div>
        ) : users.map(u => (
          <div key={u.id} style={{
            background:'#0d0d14', border:'1px solid #1a1a28', borderRadius:14, padding:'18px 20px',
            opacity: u.is_active ? 1 : 0.5,
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{
                  width:36, height:36, borderRadius:'50%',
                  background: roleColor[u.role] + '22',
                  border: `1px solid ${roleColor[u.role]}44`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:600, color: roleColor[u.role],
                }}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'#c8c8e0' }}>{u.name}</div>
                  <div style={{ fontSize:10, fontFamily:'DM Mono', color: roleColor[u.role], marginTop:1 }}>{u.role}</div>
                </div>
              </div>
              <div style={{
                fontSize:9, fontFamily:'DM Mono', padding:'2px 8px', borderRadius:4,
                background: u.is_active ? '#22d3ee14' : '#ff4d4d14',
                color: u.is_active ? '#22d3ee' : '#ff8080',
              }}>
                {u.is_active ? 'ACTIVE' : 'INACTIVE'}
              </div>
            </div>

            <div style={{ fontSize:12, color:'#3a3a6a', fontFamily:'DM Mono', marginBottom:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {u.email}
            </div>

            <div style={{ display:'flex', gap:8 }}>
              {u.id !== me.id && (
                <>
                  <button onClick={() => handleToggle(u)} style={{
                    flex:1, padding:'6px', background:'none', border:'1px solid #2a2a3a', borderRadius:6,
                    color:'#6a6a9a', cursor:'pointer', fontSize:11, fontFamily:'DM Mono',
                  }}>
                    {u.is_active ? 'deactivate' : 'activate'}
                  </button>
                  <button onClick={() => handleDelete(u.id)} style={{
                    padding:'6px 12px', background:'none', border:'1px solid #3a1a1a', borderRadius:6,
                    color:'#f97316', cursor:'pointer', fontSize:11, fontFamily:'DM Mono',
                  }}>del</button>
                </>
              )}
              {u.id === me.id && (
                <div style={{ fontSize:11, fontFamily:'DM Mono', color:'#2a2a4a' }}>← you</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <UserModal open={modal} onClose={() => setModal(false)} onSave={handleCreate} />
    </div>
  )
}
