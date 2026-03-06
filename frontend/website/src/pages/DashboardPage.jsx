import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import * as api from '../services/api'

/* ── Source badge ── */
function Source({ platform }) {
    const c = { leetcode: '#FFA116', codeforces: '#1890FF', combined: '#6366F1' }
    const l = { leetcode: 'LeetCode API', codeforces: 'Codeforces API', combined: 'All Platforms' }
    return (
        <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
            background: `${c[platform]}18`, color: c[platform],
        }}>↻ {l[platform]}</span>
    )
}

/* ── Bar chart tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 12px', fontSize: 12,
            }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
                <p style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{payload[0].value} solved</p>
            </div>
        )
    }
    return null
}

/* ════════════════════════════════════════════════
   DASHBOARD — data from /api/platforms/dashboard
   Stats are synced server-side from real platform APIs,
   stored in DB (user_stats, topic_stats tables), and
   served here as a single aggregated JSON response.
   ════════════════════════════════════════════════ */
export default function DashboardPage() {
    const navigate = useNavigate()
    const [dashData, setDashData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [error, setError] = useState(null)
    const [lastSynced, setLastSynced] = useState(null)

    useEffect(() => {
        if (!api.isAuthenticated()) { navigate('/login'); return }
        loadDashboard()
    }, [navigate])

    async function loadDashboard() {
        setLoading(true)
        setError(null)
        const result = await api.fetchDashboardData()
        if (result.success) {
            setDashData(result.data)
            setLastSynced(new Date())
        } else {
            setError(result.error)
        }
        setLoading(false)
    }

    async function handleSync() {
        setSyncing(true)
        setError(null)
        await api.syncAllPlatforms()
        await loadDashboard()
        setSyncing(false)
    }

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
    })

    // Derived values from backend response
    const totalSolved = dashData?.totalSolved || 0
    const easySolved = dashData?.easySolved || 0
    const mediumSolved = dashData?.mediumSolved || 0
    const hardSolved = dashData?.hardSolved || 0
    const currentStreak = dashData?.currentStreak || 0
    const platforms = dashData?.platforms || []
    const topics = dashData?.topics || []
    const linkedPlatforms = dashData?.linkedPlatforms || []

    const DIFF = [
        { name: 'Easy', value: easySolved, color: '#22C55E' },
        { name: 'Medium', value: mediumSolved, color: '#F59E0B' },
        { name: 'Hard', value: hardSolved, color: '#EF4444' },
    ]

    /* ── No linked platforms ── */
    if (!loading && linkedPlatforms.length === 0) {
        return (
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <Topbar title="Dashboard" subtitle={today} />
                    <main className="page-content">
                        <div className="card" style={{ padding: '60px 32px', textAlign: 'center' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
                            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No Platforms Linked</div>
                            <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 20px' }}>
                                Link your LeetCode account in onboarding. Stats are fetched from the real API
                                and stored in your profile database.
                            </div>
                            <a href="/onboarding" className="btn btn-primary">Get Started →</a>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Dashboard" subtitle={today} />
                <main className="page-content">

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: 'var(--danger-light)', border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16,
                            fontSize: 13, color: 'var(--danger)', fontWeight: 600,
                        }}>⚠️ {error}</div>
                    )}

                    {/* Loading spinner */}
                    {loading && (
                        <div style={{
                            background: 'var(--accent-light)', border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16,
                            fontSize: 13, color: 'var(--text-accent)', fontWeight: 600,
                        }}>⏳ Loading your stats…</div>
                    )}

                    {/* Sync bar */}
                    {!loading && dashData && (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 16px', marginBottom: 16,
                            background: 'var(--success-light)', border: '1px solid rgba(34,197,94,0.2)',
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                                ✅ Stats synced from platform APIs
                                {lastSynced && <span style={{ fontWeight: 400, marginLeft: 8 }}>
                                    · Last loaded {lastSynced.toLocaleTimeString()}
                                </span>}
                            </div>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={handleSync}
                                disabled={syncing}
                                style={{ fontSize: 12 }}
                            >{syncing ? '⏳ Syncing…' : '🔄 Refresh from API'}</button>
                        </div>
                    )}

                    {!loading && dashData && (
                        <>
                            {/* ── Welcome Banner ── */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))',
                                border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-xl)',
                                padding: '20px 28px', marginBottom: 24,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <div>
                                    <h2 style={{ fontSize: 18, fontWeight: 800 }}>Welcome back 👋</h2>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                                        {currentStreak > 0
                                            ? <>On a <strong style={{ color: 'var(--warning)' }}>{currentStreak}-day streak</strong> — keep pushing!</>
                                            : totalSolved > 0
                                                ? `You've solved ${totalSolved} problems across all platforms.`
                                                : 'Click "Refresh from API" to pull your latest stats.'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {linkedPlatforms.map(p => (
                                        <span key={p.platform} style={{
                                            fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                                            background: p.platform === 'leetcode' ? 'rgba(255,161,22,0.14)' : 'rgba(24,144,255,0.14)',
                                            color: p.platform === 'leetcode' ? '#FFA116' : '#1890FF',
                                        }}>
                                            {p.platform === 'leetcode' ? '🟡 LC' : '🔵 CF'} @{p.username}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* ── Stat Cards ── */}
                            <div className="stats-grid" style={{ marginBottom: 24 }}>
                                <StatCard glow="#6366F1" icon="📦" value={totalSolved} label="Total Solved"
                                    sub={platforms.map(p => `${p.platform === 'leetcode' ? 'LC' : 'CF'}: ${p.totalSolved}`).join('  ')}
                                    badge={<Source platform="combined" />} />

                                <StatCard glow="#EF4444" icon="💀" value={hardSolved} label="Hard Problems"
                                    badge={<Source platform="combined" />} />

                                <StatCard glow="#F59E0B" icon="🔥"
                                    value={currentStreak > 0 ? `${currentStreak}d` : '—'}
                                    label="Current Streak"
                                    badge={currentStreak > 0 ? <Source platform="leetcode" /> : <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>No streak data</span>} />

                                <StatCard glow="#22C55E" icon="🎯"
                                    value={totalSolved > 0 ? `${Math.round((hardSolved / totalSolved) * 100)}%` : '—'}
                                    label="Hard Ratio"
                                    badge={<Source platform="combined" />} />
                            </div>

                            {/* ── Charts Row ── */}
                            <div className="charts-grid" style={{ marginBottom: 24 }}>

                                {/* Difficulty Pie */}
                                {totalSolved > 0 && (
                                    <div className="card">
                                        <div className="section-header">
                                            <div>
                                                <div className="section-title">Difficulty Split</div>
                                                <div className="section-sub">{totalSolved} total problems</div>
                                            </div>
                                            <Source platform="combined" />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                            <ResponsiveContainer width={160} height={160}>
                                                <PieChart>
                                                    <Pie data={DIFF} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                                                        dataKey="value" strokeWidth={0}>
                                                        {DIFF.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                    </Pie>
                                                    <Tooltip formatter={(v, n) => [v + ' problems', n]} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {DIFF.map(d => (
                                                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                                                        <span style={{ fontSize: 13, flex: 1, color: 'var(--text-secondary)' }}>{d.name}</span>
                                                        <span style={{ fontSize: 15, fontWeight: 700 }}>{d.value}</span>
                                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                            ({Math.round((d.value / totalSolved) * 100)}%)
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Platform Breakdown */}
                                <div className="card">
                                    <div className="section-header">
                                        <div>
                                            <div className="section-title">Platform Breakdown</div>
                                            <div className="section-sub">Synced from real APIs → stored in DB</div>
                                        </div>
                                    </div>
                                    {platforms.length === 0 ? (
                                        <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                            No platform data. Click "🔄 Refresh from API" above.
                                        </div>
                                    ) : platforms.map(p => (
                                        <div key={p.platform} style={{
                                            padding: 14, background: 'var(--bg-tertiary)',
                                            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: 10,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: p.platform === 'leetcode' ? '#FFA116' : '#1890FF' }}>
                                                    {p.platform === 'leetcode' ? '🟡 LeetCode' : '🔵 Codeforces'} — @{p.username}
                                                </span>
                                                <Source platform={p.platform} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                                <MiniStat label="Total" value={p.totalSolved} />
                                                <MiniStat label="Easy" value={p.easySolved} color="#22C55E" />
                                                <MiniStat label="Medium" value={p.mediumSolved} color="#F59E0B" />
                                                <MiniStat label="Hard" value={p.hardSolved} color="#EF4444" />
                                            </div>
                                            {p.currentStreak > 0 && (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
                                                    <MiniStat label="Current Streak" value={`${p.currentStreak}d`} color="#F59E0B" />
                                                    <MiniStat label="Longest Streak" value={`${p.longestStreak}d`} />
                                                </div>
                                            )}
                                            {p.updatedAt && (
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                                                    Last synced: {new Date(p.updatedAt).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Topic Distribution ── */}
                            {topics.length > 0 && (
                                <div className="card" style={{ marginBottom: 24 }}>
                                    <div className="section-header">
                                        <div>
                                            <div className="section-title">Topic Distribution</div>
                                            <div className="section-sub">{topics.length} topics from platform tags</div>
                                        </div>
                                        <Source platform="leetcode" />
                                    </div>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={topics.slice(0, 12)} barSize={28}>
                                            <XAxis dataKey="topic" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false}
                                                tickLine={false} angle={-25} textAnchor="end" height={55} />
                                            <YAxis hide />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} name="solved" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                                        {topics.map(t => (
                                            <span key={t.topic} style={{
                                                fontSize: 11, padding: '3px 8px',
                                                background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                                                borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
                                            }}>
                                                {t.topic} <strong>{t.count}</strong>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {topics.length === 0 && totalSolved > 0 && (
                                <div className="card" style={{ marginBottom: 24 }}>
                                    <div className="section-title">Topic Distribution</div>
                                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                        No topic data yet. Click "🔄 Refresh from API" to fetch topics.
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}

function StatCard({ glow, icon, value, label, sub, badge }) {
    return (
        <div className="stat-card">
            <div className="stat-card-glow" style={{ background: glow }} />
            <div className="stat-card-icon" style={{ background: `${glow}20`, color: glow }}>{icon}</div>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
            {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
            {badge}
        </div>
    )
}

function MiniStat({ label, value, color }) {
    return (
        <div style={{ padding: '6px 8px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 1 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
        </div>
    )
}
