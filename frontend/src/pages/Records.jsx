import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })

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

function Modal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { amount:'', type:'income', category:'', date:'', notes:'' })
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { setForm(initial || { amount:'', type:'income', category:'', date:'', notes:'' }); setErr('') }, [initial, open])

  if (!open) return null

  async function submit(e) {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      await onSave(form)
      onClose()
    } catch(e) { setErr(e.error || 'Something went wrong') }
    finally { setSaving(false) }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#0d0d14', border:'1px solid #1a1a28', borderRadius:16, padding:28, width:420 }}>
        <div style={{ fontFamily:'Syne', fontSize:16, fontWeight:700, marginBottom:20, color:'#e8e8f0' }}>
          {initial?.id ? 'Edit Record' : 'New Record'}
        </div>
        <form onSubmit={submit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div>
              <label style={labelStyle}>AMOUNT</label>
              <input style={inputStyle} type="number" step="0.01" value={form.amount} onChange={set('amount')} required placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>TYPE</label>
              <select style={inputStyle} value={form.type} onChange={set('type')}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div>
              <label style={labelStyle}>CATEGORY</label>
              <input style={inputStyle} value={form.category} onChange={set('category')} required placeholder="e.g. Salary" />
            </div>
            <div>
              <label style={labelStyle}>DATE</label>
              <input style={inputStyle} type="date" value={form.date} onChange={set('date')} required />
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>NOTES</label>
            <textarea style={{ ...inputStyle, resize:'none', height:72 }} value={form.notes} onChange={set('notes')} placeholder="Optional description" />
          </div>
          {err && <div style={{ marginBottom:12, padding:'8px 12px', background:'#ff4d4d14', border:'1px solid #ff4d4d30', borderRadius:8, fontSize:12, color:'#ff8080' }}>{err}</div>}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding:'9px 18px', background:'none', border:'1px solid #2a2a3a', borderRadius:8, color:'#6a6a9a', cursor:'pointer', fontSize:13 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding:'9px 18px', background:'#6c3fff', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:500 }}>
              {saving ? 'saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Records() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ type:'', category:'', search:'' })
  const [modal, setModal]     = useState({ open:false, data:null })
  const [page, setPage]       = useState(1)
  const [total, setTotal]     = useState(0)
  const PAGE = 10

  async function load(p = page) {
    setLoading(true)
    try {
      let qs = `?page=${p}&page_size=${PAGE}`
      if (filter.type) qs += `&type=${filter.type}`
      if (filter.category) qs += `&category=${filter.category}`
      if (filter.search) qs += `&search=${filter.search}`
      const data = await api.records(qs)
      setRecords(data.results || [])
      setTotal(data.count || 0)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(1); setPage(1) }, [filter])
  useEffect(() => { load() }, [page])

  async function handleSave(form) {
    if (modal.data?.id) {
      await api.updateRecord(modal.data.id, form)
    } else {
      await api.createRecord(form)
    }
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this record?')) return
    await api.deleteRecord(id)
    load()
  }

  const totalPages = Math.ceil(total / PAGE)

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:24, color:'#e8e8f0', letterSpacing:'-0.5px' }}>Records</div>
          <div style={{ fontSize:12, color:'#3a3a6a', marginTop:3 }}>{total} total entries</div>
        </div>
        {isAdmin && (
          <button onClick={() => setModal({ open:true, data:null })} style={{
            padding:'9px 20px', background:'#6c3fff', border:'none', borderRadius:8,
            color:'#fff', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'Syne',
          }}>+ New Record</button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <input placeholder="Search category, notes…" value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          style={{ ...inputStyle, width:220, fontSize:12 }} />
        <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
          style={{ ...inputStyle, width:130, fontSize:12 }}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input placeholder="Category filter" value={filter.category}
          onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
          style={{ ...inputStyle, width:160, fontSize:12 }} />
      </div>

      {/* Table */}
      <div style={{ background:'#0d0d14', border:'1px solid #1a1a28', borderRadius:14, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #1a1a28' }}>
              {['Date','Category','Type','Amount','Notes',''].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:10, fontFamily:'DM Mono', color:'#3a3a6a', letterSpacing:'0.1em', fontWeight:500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:'#3a3a6a', fontFamily:'DM Mono', fontSize:12 }}>loading…</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:'#3a3a6a', fontFamily:'DM Mono', fontSize:12 }}>no records found</td></tr>
            ) : records.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: i < records.length-1 ? '1px solid #111120' : 'none' }}>
                <td style={{ padding:'13px 16px', fontSize:12, fontFamily:'DM Mono', color:'#4a4a7a' }}>{r.date}</td>
                <td style={{ padding:'13px 16px', fontSize:13, color:'#c8c8e0', fontWeight:500 }}>{r.category}</td>
                <td style={{ padding:'13px 16px' }}>
                  <span style={{
                    fontSize:10, fontFamily:'DM Mono', padding:'3px 8px', borderRadius:4, fontWeight:500,
                    background: r.type === 'income' ? '#22d3ee18' : '#f9731618',
                    color: r.type === 'income' ? '#22d3ee' : '#f97316',
                  }}>{r.type}</span>
                </td>
                <td style={{ padding:'13px 16px', fontSize:14, fontFamily:'Syne', fontWeight:600, color: r.type === 'income' ? '#22d3ee' : '#f97316' }}>
                  {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
                </td>
                <td style={{ padding:'13px 16px', fontSize:12, color:'#3a3a6a', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.notes || '—'}</td>
                <td style={{ padding:'13px 16px' }}>
                  {isAdmin && (
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => setModal({ open:true, data:r })} style={{ fontSize:11, background:'none', border:'1px solid #2a2a45', borderRadius:6, color:'#6a6a9a', cursor:'pointer', padding:'3px 10px', fontFamily:'DM Mono' }}>edit</button>
                      <button onClick={() => handleDelete(r.id)} style={{ fontSize:11, background:'none', border:'1px solid #3a1a1a', borderRadius:6, color:'#f97316', cursor:'pointer', padding:'3px 10px', fontFamily:'DM Mono' }}>del</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:20 }}>
          {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              width:32, height:32, borderRadius:6, border:'1px solid',
              borderColor: p === page ? '#6c3fff' : '#2a2a3a',
              background: p === page ? '#6c3fff22' : 'none',
              color: p === page ? '#a78bfa' : '#4a4a6a',
              cursor:'pointer', fontSize:12, fontFamily:'DM Mono',
            }}>{p}</button>
          ))}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open:false, data:null })} onSave={handleSave} initial={modal.data} />
    </div>
  )
}

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
