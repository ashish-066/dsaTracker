import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    BarChart, Bar, PieChart, Pie, Cell,
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
    XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import * as api from '../services/api'

/* ── Animated Counter ── */
function AnimatedNumber({ value, duration = 1200 }) {
    const [display, setDisplay] = useState(0)
    const ref = useRef(null)
    useEffect(() => {
        const target = typeof value === 'number' ? value : 0
        if (target === 0) { setDisplay(0); return }
        let start = 0
        const step = Math.ceil(target / (duration / 16))
        const id = setInterval(() => {
            start += step
            if (start >= target) { setDisplay(target); clearInterval(id) }
            else setDisplay(start)
        }, 16)
        return () => clearInterval(id)
    }, [value, duration])
    return <span ref={ref}>{display}</span>
}

/* ── Custom Tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: 'rgba(26,39,68,0.95)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12,
            padding: '10px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>
                {payload[0].value} <span style={{ fontSize: 11, fontWeight: 400, color: '#64748B' }}>solved</span>
            </div>
        </div>
    )
}

/* ── Greeting by time ── */
function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
}

/* ── Real Heatmap Generator ── */
function generateRealHeatmap(calendarMap) {
    const days = []
    const today = new Date()

    // Build map of YYYY-MM-DD to count
    const dailyCounts = {}
    if (calendarMap) {
        Object.entries(calendarMap).forEach(([timestampStr, count]) => {
            // Both platforms provide timestamps in seconds
            const date = new Date(parseInt(timestampStr) * 1000)
            // Use local format for accurate day bucketing
            const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
            dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + count
        })
    }

    // Generate last 84 days (12 weeks)
    for (let i = 83; i >= 0; i--) {
        const d = new Date()
        d.setDate(today.getDate() - i)
        const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

        days.push({
            date: d,
            count: dailyCounts[dateStr] || 0
        })
    }
    return days
}

/* ══════════════════════════════════════════════
   DASHBOARD — Premium UI
   ══════════════════════════════════════════════ */
export default function DashboardPage() {
    const navigate = useNavigate()
    const [dashData, setDashData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [error, setError] = useState(null)
    const [lastSynced, setLastSynced] = useState(null)
    const [fadeIn, setFadeIn] = useState(false)
    const [heatmapData, setHeatmapData] = useState([])
    const [recentSubmissions, setRecentSubmissions] = useState([])
    const [loadingRecent, setLoadingRecent] = useState(false)

    useEffect(() => {
        if (!api.isAuthenticated()) { navigate('/login'); return }
        loadDashboard()
    }, [navigate])

    async function loadDashboard() {
        setLoading(true); setError(null)
        const result = await api.fetchDashboardData()
        if (result.success) {
            setDashData(result.data)
            setLastSynced(new Date())

            // Fetch true calendar history
            const calResult = await api.fetchCalendarData()
            if (calResult.success) {
                setHeatmapData(generateRealHeatmap(calResult.data))
            } else {
                setHeatmapData(generateRealHeatmap({}))
            }

            // Fetch recent submissions
            const lcPlatform = result.data.linkedPlatforms?.find(p => p.platform === 'leetcode')
            if (lcPlatform) {
                setLoadingRecent(true)
                const rec = await api.fetchLeetCodeSubmissions(lcPlatform.username)
                if (rec.success) setRecentSubmissions(rec.data)
                setLoadingRecent(false)
            }
        } else {
            setError(result.error)
        }
        setLoading(false)
        setTimeout(() => setFadeIn(true), 50)
    }

    async function handleSync() {
        setSyncing(true); setError(null)
        await api.syncAllPlatforms()
        await loadDashboard()
        setSyncing(false)
    }

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
    })

    // Derived values
    const totalSolved = dashData?.totalSolved || 0
    const easySolved = dashData?.easySolved || 0
    const mediumSolved = dashData?.mediumSolved || 0
    const hardSolved = dashData?.hardSolved || 0
    const currentStreak = dashData?.currentStreak || 0
    const longestStreak = dashData?.longestStreak || 0
    const platforms = dashData?.platforms || []
    const topics = dashData?.topics || []
    const linkedPlatforms = dashData?.linkedPlatforms || []

    const DIFF = [
        { name: 'Easy', value: easySolved, color: '#22C55E' },
        { name: 'Medium', value: mediumSolved, color: '#F59E0B' },
        { name: 'Hard', value: hardSolved, color: '#EF4444' },
    ]

    const PLATFORM_META = {
        leetcode: { label: 'LeetCode', color: '#FFA116', icon: '🟡', gradient: 'linear-gradient(135deg, rgba(255,161,22,0.12), rgba(255,161,22,0.03))' },
        codeforces: { label: 'Codeforces', color: '#1890FF', icon: '🔵', gradient: 'linear-gradient(135deg, rgba(24,144,255,0.12), rgba(24,144,255,0.03))' },
    }

    /* ── Empty state ── */
    if (!loading && linkedPlatforms.length === 0) {
        return (
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <Topbar title="Dashboard" subtitle={today} />
                    <main className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            textAlign: 'center', maxWidth: 480, padding: 48,
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))',
                            border: '1px solid rgba(99,102,241,0.15)', borderRadius: 24,
                            animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}>
                            <div style={{ fontSize: 64, marginBottom: 16, filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.3))' }}>🚀</div>
                            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Welcome to AlgoLedger</h2>
                            <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
                                Link your LeetCode or Codeforces account to see your stats, track your progress, and get personalized insights.
                            </p>
                            <a href="/onboarding" className="btn btn-primary btn-lg" style={{
                                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                            }}>
                                Get Started →
                            </a>
                        </div>
                    </main>
                    <style>{`
                        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    `}</style>
                </div>
            </div>
        )
    }

    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Dashboard" subtitle={today} />
                <main className="page-content" style={{
                    opacity: fadeIn ? 1 : 0, transition: 'opacity 0.6s ease',
                }}>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))',
                            border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14,
                            padding: '14px 20px', marginBottom: 20, fontSize: 13, color: '#EF4444', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <span style={{ fontSize: 18 }}>⚠️</span> {error}
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', padding: 120, gap: 16,
                        }}>
                            <div style={{
                                width: 48, height: 48, border: '3px solid var(--border-subtle)',
                                borderTop: '3px solid var(--accent)', borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                            }} />
                            <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Loading your stats…</div>
                        </div>
                    )}

                    {!loading && dashData && (
                        <div className="stagger-grid">
                            {/* ── 1. Hero Header ── */}
                            <div className="stagger-item" style={{
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.08) 40%, rgba(56,189,248,0.06) 100%)',
                                border: '1px solid rgba(99,102,241,0.18)', borderRadius: 24,
                                padding: '28px 36px', marginBottom: 24,
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {/* Decorative orbs */}
                                <div style={{
                                    position: 'absolute', top: -50, right: -50, width: 200, height: 200,
                                    background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',
                                    borderRadius: '50%', pointerEvents: 'none',
                                }} />
                                <div style={{
                                    position: 'absolute', bottom: -30, left: '25%', width: 120, height: 120,
                                    background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)',
                                    borderRadius: '50%', pointerEvents: 'none',
                                }} />

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 20 }}>
                                    <div>
                                        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#fff' }}>
                                            {getGreeting()} <span className="wave">👋</span>
                                        </h2>
                                        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                            {currentStreak > 0
                                                ? <>You're on a <strong style={{ color: '#F59E0B' }}>{currentStreak}-day streak</strong> — keep the momentum going!</>
                                                : totalSolved > 0
                                                    ? <>You've crushed <strong style={{ color: '#818CF8' }}>{totalSolved} problems</strong>. Ready for the next one?</>
                                                    : 'Hit "Sync" to pull your latest stats from your linked platforms.'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                        {linkedPlatforms.map(p => {
                                            const m = PLATFORM_META[p.platform] || {}
                                            return (
                                                <span key={p.platform} style={{
                                                    fontSize: 13, padding: '6px 14px', borderRadius: 20, fontWeight: 600,
                                                    background: `${m.color}15`, color: m.color, border: `1px solid ${m.color}30`,
                                                }}>
                                                    {m.icon} @{p.username}
                                                </span>
                                            )
                                        })}
                                        <button className="btn btn-sm" onClick={handleSync} disabled={syncing} style={{
                                            background: syncing ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                            color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 12,
                                            boxShadow: syncing ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
                                            transition: 'all 0.3s', fontSize: 13, fontWeight: 600, marginLeft: 4
                                        }}>
                                            {syncing ? '⏳ Syncing…' : '↻ Sync Data'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── 2. Stat Glow Cards ── */}
                            <div className="stagger-item" style={{
                                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24,
                            }}>
                                <GlowCard color="#6366F1" icon="🔥" value={currentStreak > 0 ? currentStreak : '-'} suffix={currentStreak > 0 ? 'd' : ''} label="Current Streak" sub={`Max: ${longestStreak > 0 ? longestStreak : '-'} days`} />
                                <GlowCard color="#22C55E" icon="🟢" value={easySolved} label="Easy Solved" />
                                <GlowCard color="#F59E0B" icon="🟡" value={mediumSolved} label="Medium Solved" />
                                <GlowCard color="#EF4444" icon="🔴" value={hardSolved} label="Hard Solved" />
                            </div>

                            {/* ── 3. Heatmap & Circular Progress ── */}
                            <div className="stagger-item" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>

                                {/* Activity Heatmap */}
                                <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 700 }}>Activity Heatmap</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 12 weeks of problem solving</div>
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(7, 1fr)',
                                        gap: 4, flex: 1, gridAutoFlow: 'column',
                                    }}>
                                        {heatmapData.map((d, i) => {
                                            const levels = ['var(--bg-tertiary)', 'rgba(99,102,241,0.3)', 'rgba(99,102,241,0.6)', 'rgba(99,102,241,0.85)', '#6366F1']
                                            const lv = Math.min(d.count, 4)
                                            return (
                                                <div key={i} title={`${d.date.toLocaleDateString()}: ${d.count} solves`} style={{
                                                    background: levels[lv], borderRadius: 3, width: '100%', height: '100%',
                                                    minHeight: 14, minWidth: 14, transition: 'transform 0.2s', cursor: 'pointer',
                                                }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Difficulty Ring */}
                                <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <div style={{ fontSize: 16, fontWeight: 700 }}>Difficulty Split</div>
                                    </div>
                                    {totalSolved > 0 ? (
                                        <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ResponsiveContainer width={180} height={180}>
                                                <PieChart>
                                                    <Pie data={DIFF} cx="50%" cy="50%" innerRadius={65} outerRadius={85}
                                                        dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}
                                                        paddingAngle={4}>
                                                        {DIFF.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                    </Pie>
                                                    <Tooltip content={<ChartTooltip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div style={{ position: 'absolute', textAlign: 'center' }}>
                                                <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{totalSolved}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>solved</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No data</div>
                                    )}
                                </div>
                            </div>

                            {/* ── 4. Charts Bottom Row ── */}
                            <div className="stagger-item" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

                                {/* Radar Chart for Topics */}
                                <div className="card" style={{ padding: 28 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Skill Radar</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Your top domains across platforms</div>

                                    {topics.length >= 3 ? (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={topics.slice(0, 6)}>
                                                <PolarGrid stroke="var(--border-subtle)" />
                                                <PolarAngleAxis dataKey="topic" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                                                <Radar name="Solved" dataKey="count" stroke="#6366F1" fill="#6366F1" fillOpacity={0.4} />
                                                <Tooltip content={<ChartTooltip />} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                            Solve problems across at least 3 topics to unlock radar.
                                        </div>
                                    )}
                                </div>

                                {/* Recent Questions Activity Feed */}
                                <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 700 }}>Recent Questions</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Your latest submissions from LeetCode</div>
                                        </div>
                                        <div style={{ fontSize: 24 }}>⚡</div>
                                    </div>

                                    {loadingRecent ? (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                            Loading recent activity...
                                        </div>
                                    ) : recentSubmissions.length === 0 ? (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                            No recent activity found. Look like it's time to code!
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
                                            {recentSubmissions.slice(0, 5).map((sub, i) => {
                                                const timeAgo = sub.timestamp ? new Date(sub.timestamp * 1000).toLocaleString() : 'Recently'
                                                const isAccepted = sub.statusDisplay === 'Accepted'

                                                return (
                                                    <div key={i} style={{
                                                        background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                                                        borderRadius: 14, padding: '16px 20px', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'space-between',
                                                        transition: 'all 0.2s', cursor: 'pointer'
                                                    }} onMouseEnter={e => {
                                                        e.currentTarget.style.borderColor = isAccepted ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'
                                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                                    }} onMouseLeave={e => {
                                                        e.currentTarget.style.borderColor = 'var(--border-subtle)'
                                                        e.currentTarget.style.transform = 'translateY(0)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                            <div style={{
                                                                width: 36, height: 36, borderRadius: 10,
                                                                background: isAccepted ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                color: isAccepted ? '#22C55E' : '#EF4444', fontSize: 16
                                                            }}>
                                                                {isAccepted ? '✓' : '✗'}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                                                                    {sub.titleSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                                </div>
                                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                                    {timeAgo}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                                                            background: isAccepted ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                                            color: isAccepted ? '#22C55E' : '#EF4444'
                                                        }}>
                                                            {sub.statusDisplay}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    )}
                </main>
            </div >

            {/* Animations */}
            < style > {`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes wave { 0% { transform: rotate(0deg); } 20% { transform: rotate(14deg); } 40% { transform: rotate(-8deg); } 60% { transform: rotate(14deg); } 80% { transform: rotate(-4deg); } 100% { transform: rotate(10deg); } }
                .wave { display: inline-block; transform-origin: 70% 70%; animation: wave 2.5s infinite ease-in-out; }
                
                /* Staggered Grid Animation */
                .stagger-grid { display: flex; flex-direction: column; gap: 0; }
                .stagger-item {
                    opacity: 0; animation: slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .stagger-item:nth-child(1) { animation-delay: 0.1s; }
                .stagger-item:nth-child(2) { animation-delay: 0.2s; }
                .stagger-item:nth-child(3) { animation-delay: 0.3s; }
                .stagger-item:nth-child(4) { animation-delay: 0.4s; }

                @keyframes slideUpFade {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style >
        </div >
    )
}

/* ── Glow Stat Card with 3D Tilt ── */
function GlowCard({ color, icon, value, label, sub, suffix = '' }) {
    const cardRef = useRef(null)

    const handleMouseMove = (e) => {
        if (!cardRef.current) return
        const card = cardRef.current
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        const rotateX = ((y - centerY) / centerY) * -5 // Max 5 deg
        const rotateY = ((x - centerX) / centerX) * 5

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    }

    const handleMouseLeave = () => {
        if (!cardRef.current) return
        cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
    }

    return (
        <div ref={cardRef} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 18, padding: '24px', position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s ease-out, border-color 0.3s, box-shadow 0.3s', cursor: 'default',
        }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${color}50`
                e.currentTarget.style.boxShadow = `0 12px 30px ${color}20`
            }}
        >
            <div style={{
                position: 'absolute', top: -40, right: -40, width: 120, height: 120,
                borderRadius: '50%', background: color, opacity: 0.08, pointerEvents: 'none',
                filter: 'blur(10px)',
            }} />

            <div style={{
                width: 46, height: 46, borderRadius: 12, marginBottom: 16,
                background: `${color}15`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22,
            }}>{icon}</div>

            <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>
                {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}{suffix}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>{label}</div>
            {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{sub}</div>}
        </div>
    )
}
