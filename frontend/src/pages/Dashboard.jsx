import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })
const fmtK = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${n}`

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: '#0d0d14', border: '1px solid #1a1a28', borderRadius: 14,
      padding: '20px 22px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position:'absolute', top:0, left:0, width:3, height:'100%', background: accent, borderRadius:'3px 0 0 3px' }} />
      <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: '#3a3a6a', letterSpacing: '0.1em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Syne', color: '#e8e8f0', letterSpacing: '-1px' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#3a3a6a', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function SectionHead({ title }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
      <div style={{ fontSize: 12, fontFamily: 'DM Mono', color: '#4a4a7a', letterSpacing: '0.08em' }}>{title}</div>
      <div style={{ flex:1, height:'0.5px', background:'#1a1a28' }} />
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#111120', border:'1px solid #2a2a3a', borderRadius:8, padding:'10px 14px', fontSize:12, fontFamily:'DM Mono' }}>
      <div style={{ color:'#6a6a9a', marginBottom:4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom:2 }}>
          {p.name}: {fmtK(p.value)}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary]     = useState(null)
  const [monthly, setMonthly]     = useState([])
  const [categories, setCategories] = useState([])
  const [recent, setRecent]       = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, r] = await Promise.all([api.summary(), api.recent(6)])
        setSummary(s)
        setRecent(r)
        if (user?.role !== 'viewer') {
          const [m, c] = await Promise.all([api.monthly(), api.categories()])
          setMonthly(m.map(row => ({ ...row, month: row.month.slice(0,7), income: Number(row.total_income), expense: Number(row.total_expense) })))
          setCategories(c.filter(c => c.type === 'expense').slice(0,6))
        }
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  if (loading) return (
    <div style={{ display:'flex', height:'60vh', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:'DM Mono', fontSize:12, color:'#3a3a6a', letterSpacing:'0.1em' }}>loading data…</div>
    </div>
  )

  const expenseColors = ['#6c3fff','#22d3ee','#f97316','#ec4899','#a78bfa','#34d399']

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:24, color:'#e8e8f0', letterSpacing:'-0.5px' }}>
          Overview
        </div>
        <div style={{ fontSize:13, color:'#3a3a6a', marginTop:4 }}>
          {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {/* Stat cards */}
      {summary && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:32 }}>
          <StatCard label="TOTAL INCOME"   value={fmt(summary.total_income)}   accent="#22d3ee" sub="all time" />
          <StatCard label="TOTAL EXPENSES" value={fmt(summary.total_expenses)} accent="#f97316" sub="all time" />
          <StatCard label="NET BALANCE"    value={fmt(summary.net_balance)}    accent="#6c3fff" sub={Number(summary.net_balance) >= 0 ? 'surplus' : 'deficit'} />
        </div>
      )}

      {/* Charts row */}
      {user?.role !== 'viewer' && monthly.length > 0 && (
        <>
          <SectionHead title="TREND ANALYSIS" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:14, marginBottom:32 }}>
            {/* Area chart */}
            <div style={{ background:'#0d0d14', border:'1px solid #1a1a28', borderRadius:14, padding:'20px 16px 12px' }}>
              <div style={{ fontSize:11, fontFamily:'DM Mono', color:'#3a3a6a', letterSpacing:'0.08em', marginBottom:16 }}>MONTHLY TREND</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill:'#3a3a6a', fontSize:10, fontFamily:'DM Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtK} tick={{ fill:'#3a3a6a', fontSize:10, fontFamily:'DM Mono' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income"  name="Income"  stroke="#22d3ee" strokeWidth={2} fill="url(#gi)" dot={false} />
                  <Area type="monotone" dataKey="expense" name="Expense" stroke="#f97316" strokeWidth={2} fill="url(#ge)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category bar chart */}
            {categories.length > 0 && (
              <div style={{ background:'#0d0d14', border:'1px solid #1a1a28', borderRadius:14, padding:'20px 16px 12px' }}>
                <div style={{ fontSize:11, fontFamily:'DM Mono', color:'#3a3a6a', letterSpacing:'0.08em', marginBottom:16 }}>TOP EXPENSES</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categories} layout="vertical" barCategoryGap={8}>
                    <XAxis type="number" tickFormatter={fmtK} tick={{ fill:'#3a3a6a', fontSize:9, fontFamily:'DM Mono' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="category" tick={{ fill:'#6a6a9a', fontSize:11, fontFamily:'DM Mono' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Amount" radius={[0,4,4,0]}>
                      {categories.map((_, i) => <Cell key={i} fill={expenseColors[i % expenseColors.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {/* Recent activity */}
      <SectionHead title="RECENT ACTIVITY" />
      <div style={{ background:'#0d0d14', border:'1px solid #1a1a28', borderRadius:14, overflow:'hidden' }}>
        {recent.length === 0 ? (
          <div style={{ padding:24, textAlign:'center', color:'#3a3a6a', fontFamily:'DM Mono', fontSize:12 }}>no records yet</div>
        ) : recent.map((r, i) => (
          <div key={r.id} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'14px 20px',
            borderBottom: i < recent.length-1 ? '1px solid #111120' : 'none',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{
                width:34, height:34, borderRadius:8,
                background: r.type === 'income' ? '#22d3ee18' : '#f9731618',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: 14,
              }}>
                {r.type === 'income' ? '↑' : '↓'}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'#c8c8e0' }}>{r.category}</div>
                <div style={{ fontSize:11, color:'#3a3a6a', fontFamily:'DM Mono', marginTop:2 }}>{r.date}</div>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:14, fontWeight:600, fontFamily:'Syne', color: r.type === 'income' ? '#22d3ee' : '#f97316' }}>
                {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
              </div>
              <div style={{ fontSize:10, fontFamily:'DM Mono', color:'#3a3a6a', marginTop:2 }}>{r.type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
