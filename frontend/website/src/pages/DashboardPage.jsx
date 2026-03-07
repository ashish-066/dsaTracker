import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import * as api from '../services/api'
import {
    computeTopicStats, detectWeakTopics, computeSkillRadar,
    computeEfficiency, computeConsistency, computeWeeklyGrowth,
    computeDailyTrend, computeProgression, computeContestReadiness,
    computeRecommendations, computePrediction, computePerformanceScore,
    scoreLabel, computeAvgSolveTime, fmtMins,
} from '../utils/analytics'

/* ── Tiny helpers ── */
function buildHeatmap(calMap) {
    const counts = {}
    if (calMap) Object.entries(calMap).forEach(([ts, n]) => {
        const d = new Date(parseInt(ts) * 1000)
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        counts[k] = (counts[k] || 0) + n
    })
    const today = new Date(); const days = []
    for (let i = 111; i >= 0; i--) { const d = new Date(); d.setDate(today.getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; days.push({ date: d, count: counts[k] || 0 }) }
    return days
}
const TT = ({ active, payload, label }) => active && payload?.length ? (<div style={{ background: 'rgba(10,15,38,.97)', border: '1px solid rgba(99,102,241,.35)', borderRadius: 10, padding: '8px 14px', backdropFilter: 'blur(12px)' }}><div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>{label}</div><div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>{payload[0].value}<span style={{ fontSize: 10, color: '#64748B', marginLeft: 4 }}>{payload[0].name}</span></div></div>) : null

const CARD = { background: 'rgba(255,255,255,0.024)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.065)', boxShadow: '0 4px 28px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)', borderRadius: 18, padding: 22 }
const HM_COLORS = ['rgba(255,255,255,0.04)', 'rgba(99,102,241,0.25)', 'rgba(99,102,241,0.55)', 'rgba(99,102,241,0.82)', '#6366F1']
const P_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' }

function Section({ title, sub, right, children }) { return (<div style={CARD}><div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}><div><div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>{sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}</div>{right}</div>{children}</div>) }

function ScorePill({ score, label, color, size = 12 }) { return (<span style={{ fontSize: size, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${color}1e`, color, border: `1px solid ${color}38`, whiteSpace: 'nowrap' }}>{label}</span>) }

/* ═══════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════ */
export default function DashboardPage() {
    const navigate = useNavigate()
    const [dash, setDash] = useState(null)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [error, setError] = useState(null)
    const [hm, setHm] = useState([])
    const [subs, setSubs] = useState([])
    const [fade, setFade] = useState(false)

    useEffect(() => { if (!api.isAuthenticated()) { navigate('/login'); return }; load() }, [])

    async function load() {
        setLoading(true); setError(null)
        const r = await api.fetchDashboardData()
        if (r.success) {
            setDash(r.data)
            const cal = await api.fetchCalendarData()
            const hmD = buildHeatmap(cal.success ? cal.data : {})
            setHm(hmD)
            const lc = r.data.linkedPlatforms?.find(p => p.platform === 'leetcode')
            if (lc) { const rec = await api.fetchLeetCodeSubmissions(lc.username); if (rec.success) setSubs(rec.data) }
        } else setError(r.error)
        setLoading(false); setTimeout(() => setFade(true), 60)
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })

    /* ── compute all analytics ── */
    const totalSolved = dash?.totalSolved || 0
    const easySolved = dash?.easySolved || 0
    const mediumSolved = dash?.mediumSolved || 0
    const hardSolved = dash?.hardSolved || 0
    const linked = dash?.linkedPlatforms || []
    const platforms = dash?.platforms || []
    const rawTopics = dash?.topics || []

    // build topic stats from available data (dashboard topics array)
    const topicStats = rawTopics.map(t => ({
        ...t, topic: t.topic, total: t.count || 0, accepted: t.count || 0,
        successRate: Math.min(100, Math.round(((t.count || 0) / Math.max(totalSolved, 1)) * 100 * 5)), avgAttempts: 1
    }))

    const weakTopics = detectWeakTopics(topicStats)
    const radarData = computeSkillRadar(topicStats, totalSolved)
    const efficiency = computeEfficiency(subs)
    const consistency = computeConsistency(hm)
    const weekly = computeWeeklyGrowth(hm, 16)
    const dailyTrend = computeDailyTrend(hm, 30)
    const progression = computeProgression(subs)
    const avgSolveTime = computeAvgSolveTime(subs)
    const accepted = subs.filter(s => s.statusDisplay === 'Accepted').length
    const accRate = subs.length ? Math.round((accepted / subs.length) * 100) : 0
    const activeWeeks = weekly.filter(w => w.solved > 0).length
    const bestWeek = Math.max(...weekly.map(w => w.solved), 0)
    const avgPerWeek = activeWeeks ? (totalSolved / activeWeeks).toFixed(1) : '0'

    const recommendation = computeRecommendations({ weakTopics, topicStats, totalSolved, mediumSolved, hardSolved })
    const contest = computeContestReadiness({ totalSolved, mediumSolved, hardSolved, easySolved, effiScore: efficiency.score, consistencyScore: consistency.score, topicStats })
    const prediction = computePrediction({ heatmapData: hm, totalSolved })
    const perfScore = computePerformanceScore({ totalSolved, longestStreak: consistency.longestStreak, acceptanceRate: accRate, activeWeeks, hardSolved, effiScore: efficiency.score })
    const { label: rankLabel, color: rankColor } = scoreLabel(perfScore)

    const PMETA = { leetcode: { label: 'LeetCode', color: '#FFA116', icon: '🟡' }, codeforces: { label: 'Codeforces', color: '#1890FF', icon: '🔵' } }
    const DIFF = [{ name: 'Easy', value: easySolved, color: '#22C55E' }, { name: 'Medium', value: mediumSolved, color: '#F59E0B' }, { name: 'Hard', value: hardSolved, color: '#EF4444' }]

    if (!loading && linked.length === 0) return (
        <div className="app-shell"><Sidebar /><div className="main-content"><Topbar title="Dashboard" subtitle={today} />
            <main className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', maxWidth: 460, padding: 48, background: 'linear-gradient(135deg,rgba(99,102,241,.1),rgba(139,92,246,.04))', border: '1px solid rgba(99,102,241,.2)', borderRadius: 24 }}>
                    <div style={{ fontSize: 60, marginBottom: 16 }}>🚀</div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Welcome to AlgoLedger</h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>Link your coding platforms to unlock your performance intelligence dashboard.</p>
                    <a href="/onboarding" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', padding: '12px 28px', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Get Started →</a>
                </div>
            </main>
        </div></div>
    )

    return (
        <div className="app-shell" style={{ background: 'linear-gradient(140deg,#07091a 0%,#0d1327 50%,#080c1a 100%)' }}>
            <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, background: 'radial-gradient(circle,rgba(99,102,241,.07),transparent 65%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: -200, left: 0, width: 500, height: 500, background: 'radial-gradient(circle,rgba(139,92,246,.05),transparent 65%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
            <Sidebar />
            <div className="main-content" style={{ position: 'relative', zIndex: 1 }}>
                <Topbar title="Dashboard" subtitle={today} />
                <main className="page-content" style={{ opacity: fade ? 1 : 0, transition: 'opacity .6s' }}>
                    {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 12, padding: '11px 16px', marginBottom: 16, color: '#EF4444', fontSize: 13, fontWeight: 600 }}>⚠️ {error}</div>}
                    {loading && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 120, gap: 14 }}><div style={{ width: 42, height: 42, border: '3px solid rgba(99,102,241,.2)', borderTop: '3px solid #6366F1', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /><div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Computing your analytics…</div></div>}

                    {!loading && dash && <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* ── HERO ── */}
                        <div style={{ ...CARD, background: 'linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.06))', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: -80, right: -80, width: 240, height: 240, background: `radial-gradient(circle,${rankColor}18,transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'} 👋</h2>
                                        <ScorePill score={perfScore} label={`${rankLabel} · ${perfScore}/100`} color={rankColor} size={11} />
                                    </div>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                                        {consistency.currentStreak > 0 ? <><strong style={{ color: '#F59E0B' }}>{consistency.currentStreak}-day streak</strong> — keep the momentum! 🔥 Best ever: <strong style={{ color: '#818CF8' }}>{consistency.longestStreak}d</strong></> : `You've solved ${totalSolved} problems. ${recommendation[0]?.action || 'Keep going!'}`}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    {linked.map(p => { const m = PMETA[p.platform] || {}; return (<span key={p.platform} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, fontWeight: 600, background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}30` }}>{m.icon} @{p.username}</span>) })}
                                    <button onClick={async () => { setSyncing(true); await api.syncAllPlatforms(); await load(); setSyncing(false) }} disabled={syncing} style={{ background: syncing ? 'rgba(99,102,241,.15)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: syncing ? '#818CF8' : '#fff', border: '1px solid rgba(99,102,241,.3)', padding: '9px 18px', borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .25s' }}>
                                        {syncing ? '⏳ Syncing…' : '↻ Sync'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── SECTION 1: PERFORMANCE OVERVIEW (5 cards) ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 13 }}>
                            {[
                                { icon: '✅', val: totalSolved, lbl: 'Total Solved', sub: `${easySolved}E / ${mediumSolved}M / ${hardSolved}H`, color: '#6366F1' },
                                { icon: '🎯', val: `${accRate}%`, lbl: 'Acceptance Rate', sub: `${accepted} of ${subs.length} attempts`, color: '#22C55E', raw: true },
                                { icon: '⚡', val: `${efficiency.score}`, lbl: 'Efficiency Score', sub: `${efficiency.firstAttemptRate}% first-try success`, color: '#38BDF8', raw: true },
                                { icon: '📅', val: `${consistency.score}`, lbl: 'Consistency', sub: `${consistency.activeDays} active days / 30`, color: '#A78BFA', raw: true },
                                { icon: '📈', val: avgPerWeek, lbl: 'Avg / Week', sub: `Best week: ${bestWeek} solved`, color: '#F59E0B', raw: true },
                            ].map((s, i) => (
                                <div key={i} style={{ ...CARD, padding: 18, transition: 'all .25s', cursor: 'default', border: `1px solid ${s.color}22` }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${s.color}55`; e.currentTarget.style.transform = 'translateY(-3px)' }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${s.color}22`; e.currentTarget.style.transform = 'translateY(0)' }}>
                                    <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: s.color, opacity: .06, filter: 'blur(8px)', pointerEvents: 'none' }} />
                                    <div style={{ fontSize: 20, marginBottom: 10 }}>{s.icon}</div>
                                    <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.raw ? s.val : s.val}</div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 5 }}>{s.lbl}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, opacity: .75 }}>{s.sub}</div>
                                </div>
                            ))}
                        </div>

                        {/* ── AVG SOLVE TIME row ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 13 }}>
                            {[['Easy', '#22C55E', avgSolveTime.easy], ['Medium', '#F59E0B', avgSolveTime.medium], ['Hard', '#EF4444', avgSolveTime.hard]].map(([d, c, t]) => (
                                <div key={d} style={{ ...CARD, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${c}22` }}>
                                    <div><div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{d} Avg Solve Time</div><div style={{ fontSize: 22, fontWeight: 800, color: c, marginTop: 4 }}>{t ? fmtMins(t) : '—'}</div></div>
                                    <div style={{ width: 42, height: 42, borderRadius: 10, background: `${c}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{d === 'Easy' ? '🟢' : d === 'Medium' ? '🟡' : '🔴'}</div>
                                </div>
                            ))}
                        </div>

                        {/* ── SECTION 2: WEAK TOPIC DETECTION ── */}
                        <Section title="⚠️ Weak Topic Detection" sub="Automatically identified from your success rate, attempts, and frequency">
                            {weakTopics.length === 0
                                ? <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 13 }}>🎉 No significant weak topics detected — great balance!</div>
                                : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                                    {weakTopics.map((t, i) => (
                                        <div key={i} style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.18)', borderRadius: 14, padding: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span style={{ fontSize: 14, fontWeight: 700 }}>{t.topic}</span>
                                                <ScorePill score={0} label={`${t.successRate}% success`} color='#EF4444' size={10} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                                                {[['Solved', t.total, '#94A3B8'], ['Avg Attempts', t.avgAttempts, '#F59E0B']].map(([l, v, c]) => (
                                                    <div key={l} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                                                        <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
                                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#F87171', fontWeight: 600 }}>
                                                💡 Practice {Math.max(5, 10 - t.total)} more {t.topic} problems to improve
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            }
                        </Section>

                        {/* ── SECTION 3+4: SKILL RADAR + EFFICIENCY ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                            <Section title="Skill Radar" sub="Proficiency across core algorithm domains — score is computed from success rate, depth & difficulty">
                                <ResponsiveContainer width="100%" height={240}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
                                        <PolarGrid stroke="rgba(99,102,241,.12)" />
                                        <PolarAngleAxis dataKey="topic" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                        <Radar name="Score" dataKey="score" stroke="#6366F1" fill="#6366F1" fillOpacity={0.45} />
                                        <Tooltip content={<TT />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginTop: 8 }}>
                                    {radarData.slice(0, 5).map(d => (
                                        <div key={d.topic} style={{ textAlign: 'center', background: 'rgba(99,102,241,.06)', borderRadius: 8, padding: '6px 4px' }}>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: '#6366F1' }}>{d.score}</div>
                                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{d.topic.split(' ').map(w => w[0]).join('')}</div>
                                        </div>
                                    ))}
                                </div>
                            </Section>

                            <Section title="Problem Solving Efficiency" sub="Computed from first-attempt rate, retry behaviour, and wrong submission ratio">
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                                    <div style={{ position: 'relative', width: 130, height: 130 }}>
                                        <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="9" />
                                            <circle cx="65" cy="65" r="52" fill="none" stroke="#38BDF8" strokeWidth="9" strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 52}`} strokeDashoffset={`${2 * Math.PI * 52 * (1 - efficiency.score / 100)}`}
                                                style={{ filter: 'drop-shadow(0 0 7px #38BDF880)', transition: 'stroke-dashoffset 1.2s ease' }} />
                                        </svg>
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ fontSize: 30, fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>{efficiency.score}</div>
                                            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>/ 100</div>
                                        </div>
                                    </div>
                                    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        {[
                                            ['First-Try Rate', `${efficiency.firstAttemptRate}%`, '#22C55E'],
                                            ['Avg Retries', `${efficiency.avgRetries}x`, '#F59E0B'],
                                            ['Wrong Ratio', `${efficiency.wrongRatio}%`, '#EF4444'],
                                            ['Unique Problems', `${efficiency.totalUnique || totalSolved}`, '#6366F1'],
                                        ].map(([l, v, c]) => (
                                            <div key={l} style={{ background: `${c}0d`, border: `1px solid ${c}25`, borderRadius: 10, padding: '10px 12px' }}>
                                                <div style={{ fontSize: 17, fontWeight: 800, color: c }}>{v}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{l}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Section>
                        </div>

                        {/* ── SECTION 5+6: CONSISTENCY + ACTIVITY HEATMAP ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
                            <Section title="Consistency Score" sub="Active days, streaks & inactivity gaps">
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                                    <div style={{ position: 'relative', width: 120, height: 120 }}>
                                        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="9" />
                                            <circle cx="60" cy="60" r="50" fill="none" stroke="#A78BFA" strokeWidth="9" strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 50}`} strokeDashoffset={`${2 * Math.PI * 50 * (1 - consistency.score / 100)}`}
                                                style={{ filter: 'drop-shadow(0 0 6px #A78BFA80)', transition: 'stroke-dashoffset 1.2s ease' }} />
                                        </svg>
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ fontSize: 26, fontWeight: 900, color: '#A78BFA' }}>{consistency.score}</div>
                                            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>/ 100</div>
                                        </div>
                                    </div>
                                    {[['Active Days / 30', `${consistency.activeDays}`, '#22C55E'], ['Current Streak', `${consistency.currentStreak}d`, '#F59E0B'], ['Longest Streak', `${consistency.longestStreak}d`, '#38BDF8'], ['Max Gap', `${consistency.inactivityGap}d`, '#EF4444']].map(([l, v, c]) => (
                                        <div key={l} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: `${c}0b`, borderRadius: 9, border: `1px solid ${c}20` }}>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l}</span><span style={{ fontSize: 14, fontWeight: 800, color: c }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </Section>

                            <Section title="Activity Heatmap" sub={`16 weeks · ${consistency.activeDays} active days`} right={<div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Less</span>{HM_COLORS.map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />)}<span style={{ fontSize: 9, color: 'var(--text-muted)' }}>More</span></div>}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16,1fr)', gridTemplateRows: 'repeat(7,1fr)', gap: 3, gridAutoFlow: 'column', minHeight: 100 }}>
                                    {hm.map((d, i) => { const lv = Math.min(d.count, 4); return (<div key={i} title={`${d.date.toLocaleDateString()}: ${d.count}`} style={{ background: HM_COLORS[lv], borderRadius: 3, minWidth: 10, minHeight: 10, transition: 'transform .15s', boxShadow: lv >= 3 ? `0 0 5px ${HM_COLORS[lv]}` : 'none' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.4)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />); })}
                                </div>
                            </Section>
                        </div>

                        {/* ── SECTION 7: GROWTH CHARTS ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
                            <Section title="Weekly Growth" sub="Problems solved per week · last 16 weeks" right={<div style={{ display: 'flex', gap: 16 }}><div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Best</div><div style={{ fontSize: 17, fontWeight: 800, color: '#6366F1' }}>{bestWeek}</div></div><div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active</div><div style={{ fontSize: 17, fontWeight: 800, color: '#38BDF8' }}>{activeWeeks}/16</div></div></div>}>
                                <ResponsiveContainer width="100%" height={150}>
                                    <BarChart data={weekly} barCategoryGap="28%">
                                        <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
                                        <YAxis hide /><Tooltip content={<TT />} />
                                        <Bar dataKey="solved" name="solved" radius={[5, 5, 0, 0]}>
                                            {weekly.map((w, i) => <Cell key={i} fill={w.solved === bestWeek ? '#6366F1' : 'rgba(99,102,241,0.5)'} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Section>
                            <Section title="30-Day Activity" sub="Daily submission volume trend">
                                <ResponsiveContainer width="100%" height={150}>
                                    <AreaChart data={dailyTrend}>
                                        <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} /><stop offset="95%" stopColor="#38BDF8" stopOpacity={0} /></linearGradient></defs>
                                        <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} interval={7} />
                                        <YAxis hide /><Tooltip content={<TT />} />
                                        <Area type="monotone" dataKey="count" name="problems" stroke="#38BDF8" strokeWidth={2} fill="url(#ag)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Section>
                        </div>

                        {/* ── SECTION 8: SMART RECOMMENDATIONS ── */}
                        <Section title="🧠 Smart Recommendations" sub="Personalized practice plan based on your weak topics, difficulty gaps, and recent patterns">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {recommendation.map((r, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: `${P_COLOR[r.priority]}08`, border: `1px solid ${P_COLOR[r.priority]}28`, borderRadius: 13, transition: 'transform .2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${P_COLOR[r.priority]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{r.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                                                <span style={{ fontSize: 13, fontWeight: 700 }}>{r.topic}</span>
                                                <ScorePill score={0} label={r.priority.toUpperCase()} color={P_COLOR[r.priority]} size={9} />
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.reason}</div>
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: P_COLOR[r.priority], textAlign: 'right', maxWidth: 200 }}>{r.action}</div>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* ── SECTION 9: CONTEST READINESS ── */}
                        <Section title="🏆 Contest Readiness" sub="Estimated readiness based on M/H solve ratio, efficiency, consistency, and topic coverage">
                            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                    <div style={{ position: 'relative', width: 140, height: 140 }}>
                                        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="10" />
                                            <circle cx="70" cy="70" r="58" fill="none" stroke={contest.score >= 60 ? '#22C55E' : contest.score >= 40 ? '#F59E0B' : '#EF4444'} strokeWidth="10" strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 58}`} strokeDashoffset={`${2 * Math.PI * 58 * (1 - contest.score / 100)}`}
                                                style={{ filter: `drop-shadow(0 0 8px ${contest.score >= 60 ? '#22C55E80' : contest.score >= 40 ? '#F59E0B80' : '#EF444480'})`, transition: 'stroke-dashoffset 1.2s ease' }} />
                                        </svg>
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ fontSize: 34, fontWeight: 900, color: contest.score >= 60 ? '#22C55E' : contest.score >= 40 ? '#F59E0B' : '#EF4444' }}>{contest.score}</div>
                                            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>/ 100</div>
                                        </div>
                                    </div>
                                    <ScorePill score={0} label={contest.score >= 70 ? 'Contest Ready' : contest.score >= 45 ? 'Getting There' : 'Needs Work'} color={contest.score >= 70 ? '#22C55E' : contest.score >= 45 ? '#F59E0B' : '#EF4444'} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)', borderRadius: 12, padding: 14 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', marginBottom: 10 }}>✓ Strengths</div>
                                        {contest.strengths.length ? contest.strengths.map((s, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5, display: 'flex', gap: 6 }}><span>•</span>{s}</div>) : <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Keep solving to build strengths</div>}
                                    </div>
                                    <div style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 12, padding: 14 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', marginBottom: 10 }}>✗ Weaknesses</div>
                                        {contest.weaknesses.length ? contest.weaknesses.map((w, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5, display: 'flex', gap: 6 }}><span>•</span>{w}</div>) : <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No major weaknesses found!</div>}
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* ── SECTION 10: PREDICTIVE PROGRESS ── */}
                        <Section title="📊 Predictive Progress" sub={`Based on your avg of ${prediction.avgPerDay} problems/day — statistical trend projection`}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
                                {[['In 30 Days', prediction.in30, '#38BDF8'], ['In 90 Days', prediction.in90, '#6366F1'], ['In 180 Days', prediction.in180, '#A78BFA']].map(([l, v, c]) => (
                                    <div key={l} style={{ background: `${c}0d`, border: `1px solid ${c}22`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{l}</div>
                                        <div style={{ fontSize: 26, fontWeight: 900, color: c }}>{v}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>est. problems solved</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Milestone Projections</div>
                                {prediction.milestones.map((m, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: m.reached ? 'rgba(34,197,94,.07)' : 'rgba(255,255,255,.02)', border: `1px solid ${m.reached ? 'rgba(34,197,94,.2)' : 'rgba(255,255,255,.05)'}`, borderRadius: 10 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: m.reached ? '#22C55E' : 'var(--text-muted)', width: 50 }}>{m.target}</div>
                                        <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.05)', borderRadius: 5, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.min((totalSolved / m.target) * 100, 100)}%`, background: m.reached ? '#22C55E' : 'linear-gradient(90deg,#6366F1,#8B5CF6)', borderRadius: 5, transition: 'width 1.2s ease' }} />
                                        </div>
                                        <div style={{ fontSize: 11, color: m.reached ? '#22C55E' : 'var(--text-muted)', width: 90, textAlign: 'right' }}>
                                            {m.reached ? '✓ Reached' : m.eta ? `~${m.eta}` : 'Need data'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* ── PLATFORM BREAKDOWN + TOPIC MASTERY ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <Section title="Platform Breakdown" sub="Per-platform difficulty split and contribution">
                                {linked.map(lp => {
                                    const m = PMETA[lp.platform] || { label: lp.platform, color: '#6366F1', icon: '🔷' }
                                    const ps = platforms.find(p => p.platform === lp.platform) || {}
                                    const sv = ps.totalSolved || 0; const e = ps.easySolved || 0; const md = ps.mediumSolved || 0; const h = ps.hardSolved || 0; const tot = Math.max(e + md + h, sv, 1)
                                    return (<div key={lp.platform} style={{ background: `${m.color}0a`, border: `1px solid ${m.color}22`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 22 }}>{m.icon}</span><div><div style={{ fontSize: 13, fontWeight: 700 }}>{m.label}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>@{lp.username}</div></div></div>
                                            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 24, fontWeight: 900, color: m.color }}>{sv}</div><div style={{ fontSize: 9, color: 'var(--text-muted)' }}>solved</div></div>
                                        </div>
                                        {[['Easy', e, '#22C55E'], ['Medium', md, '#F59E0B'], ['Hard', h, '#EF4444']].map(([l, v, c]) => (
                                            <div key={l} style={{ marginBottom: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l}</span><span style={{ fontSize: 10, fontWeight: 700, color: c }}>{v}</span></div><div style={{ height: 5, background: 'rgba(255,255,255,.04)', borderRadius: 6, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(v / tot) * 100}%`, background: c, borderRadius: 6, transition: 'width 1.2s ease' }} /></div></div>
                                        ))}
                                        {ps.rating && <div style={{ marginTop: 10, padding: '8px 12px', background: `${m.color}10`, borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Rating</span><span style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{ps.rating}</span></div>}
                                    </div>)
                                })}
                            </Section>

                            <Section title="Topic Mastery" sub="Algorithm depth ranked by solved count and relative performance">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {rawTopics.slice(0, 7).map((t, i) => {
                                        const ranks = [{ l: 'Novice', c: '#64748B', p: 15 }, { l: 'Beginner', c: '#F59E0B', p: 28 }, { l: 'Intermediate', c: '#22C55E', p: 45 }, { l: 'Advanced', c: '#6366F1', p: 65 }, { l: 'Expert', c: '#38BDF8', p: 82 }, { l: 'Master', c: '#A855F7', p: 100 }]
                                        const idx = Math.min(Math.floor(t.count / 8), 5); const rank = ranks[idx]
                                        return (<div key={i}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: rank.c, boxShadow: `0 0 5px ${rank.c}` }} /><span style={{ fontSize: 12, fontWeight: 600 }}>{t.topic}</span></div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.count} solved</span><ScorePill score={0} label={rank.l} color={rank.c} size={9} /></div>
                                            </div>
                                            <div style={{ height: 5, background: 'rgba(255,255,255,.04)', borderRadius: 8, overflow: 'hidden' }}><div style={{ height: '100%', width: `${rank.p}%`, background: `linear-gradient(90deg,${rank.c},${rank.c}70)`, borderRadius: 8, transition: 'width 1.2s ease', boxShadow: `0 0 6px ${rank.c}40` }} /></div>
                                        </div>)
                                    })}
                                </div>
                            </Section>
                        </div>

                        {/* ── DIFFICULTY SPLIT + SUBMISSION TIMELINE ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
                            <Section title="Difficulty Split" sub="Overall solved distribution">
                                {totalSolved > 0 ? (<>
                                    <div style={{ position: 'relative', width: '100%', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ResponsiveContainer width={180} height={180}>
                                            <PieChart><Pie data={DIFF} cx="50%" cy="50%" innerRadius={58} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270} paddingAngle={5} strokeWidth={0}>{DIFF.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip content={<TT />} /></PieChart>
                                        </ResponsiveContainer>
                                        <div style={{ position: 'absolute', textAlign: 'center' }}><div style={{ fontSize: 26, fontWeight: 900 }}>{totalSolved}</div><div style={{ fontSize: 9, color: 'var(--text-muted)' }}>total</div></div>
                                    </div>
                                    {DIFF.map(d => <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} /><span style={{ fontSize: 12 }}>{d.name}</span></div><span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.value} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({totalSolved ? Math.round(d.value / totalSolved * 100) : 0}%)</span></span></div>)}
                                </>) : <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 40 }}>No data yet</div>}
                            </Section>

                            <Section title="Submission Timeline" sub="Latest 8 submissions with status, timestamp and context" right={<div style={{ display: 'flex', gap: 8 }}><span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(34,197,94,.1)', color: '#22C55E', fontSize: 11, fontWeight: 700 }}>{accepted} AC</span><span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,.1)', color: '#EF4444', fontSize: 11, fontWeight: 700 }}>{subs.length - accepted} WA</span><span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(99,102,241,.1)', color: '#6366F1', fontSize: 11, fontWeight: 700 }}>{accRate}%</span></div>}>
                                <div style={{ position: 'relative', paddingLeft: 20 }}>
                                    <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg,rgba(99,102,241,.5),transparent)', borderRadius: 2 }} />
                                    {subs.length === 0 ? <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24, fontSize: 13 }}>No recent submissions found.</div> :
                                        subs.slice(0, 8).map((s, i) => {
                                            const ok = s.statusDisplay === 'Accepted'; const ts = s.timestamp ? new Date(s.timestamp * 1000) : null; const tsStr = ts ? ts.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' · ' + ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Recent'
                                            return (<div key={i} style={{ position: 'relative', marginBottom: 10, paddingLeft: 14 }}>
                                                <div style={{ position: 'absolute', left: -13, top: 11, width: 9, height: 9, borderRadius: '50%', background: ok ? '#22C55E' : '#EF4444', border: '2px solid rgba(10,15,38,.9)', boxShadow: `0 0 6px ${ok ? '#22C55E' : '#EF4444'}60` }} />
                                                <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${ok ? 'rgba(34,197,94,.14)' : 'rgba(239,68,68,.1)'}`, borderRadius: 11, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.transform = 'translateX(3px)' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.02)'; e.currentTarget.style.transform = 'translateX(0)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 28, height: 28, borderRadius: 7, background: ok ? 'rgba(34,197,94,.14)' : 'rgba(239,68,68,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: ok ? '#22C55E' : '#EF4444', flexShrink: 0 }}>{ok ? '✓' : '✗'}</div><div><div style={{ fontSize: 12, fontWeight: 600 }}>{s.titleSlug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div><div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{tsStr}</div></div></div>
                                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 16, background: ok ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)', color: ok ? '#22C55E' : '#EF4444', whiteSpace: 'nowrap' }}>{s.statusDisplay}</span>
                                                </div>
                                            </div>)
                                        })}
                                </div>
                            </Section>
                        </div>

                        {/* ── MILESTONES ── */}
                        <Section title="🏅 Milestone Tracker" sub="Achievement progression — unlocked automatically from your data">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                                {[
                                    { title: 'First Blood', desc: 'Solve 1 problem', cur: totalSolved, tgt: 1, icon: '🩸', color: '#EF4444' },
                                    { title: 'Warm Up', desc: 'Solve 10 problems', cur: totalSolved, tgt: 10, icon: '🔥', color: '#F59E0B' },
                                    { title: 'Half Century', desc: 'Solve 50 problems', cur: totalSolved, tgt: 50, icon: '🌟', color: '#8B5CF6' },
                                    { title: 'Century', desc: 'Solve 100 problems', cur: totalSolved, tgt: 100, icon: '👑', color: '#38BDF8' },
                                    { title: 'Grinder', desc: 'Solve 200 problems', cur: totalSolved, tgt: 200, icon: '⚡', color: '#6366F1' },
                                    { title: 'Streak Master', desc: '14-day streak', cur: consistency.longestStreak, tgt: 14, icon: '🔥', color: '#10B981' },
                                    { title: 'Efficiency Pro', desc: 'Efficiency ≥ 70', cur: efficiency.score, tgt: 70, icon: '🎯', color: '#F59E0B' },
                                    { title: 'Contest Ready', desc: 'Contest score ≥ 60', cur: contest.score, tgt: 60, icon: '🏆', color: '#22C55E' },
                                    { title: 'Topic Explorer', desc: '8+ topics solved', cur: rawTopics.length, tgt: 8, icon: '🗺️', color: '#E879F9' },
                                ].map((m, i) => {
                                    const pct = Math.min((m.cur / m.tgt) * 100, 100); const done = pct >= 100; return (
                                        <div key={i} style={{ padding: '13px 15px', background: done ? `${m.color}10` : 'rgba(255,255,255,.02)', border: `1px solid ${done ? m.color + '38' : 'rgba(255,255,255,.04)'}`, borderRadius: 13, display: 'flex', alignItems: 'center', gap: 13, opacity: done ? 1 : 0.6, transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                            <div style={{ fontSize: 22, filter: done ? 'none' : 'grayscale(1) opacity(.4)', flexShrink: 0 }}>{m.icon}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: done ? m.color : 'var(--text-primary)' }}>{m.title}</span>
                                                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{Math.min(m.cur, m.tgt)}/{m.tgt}</span>
                                                </div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5 }}>{m.desc}</div>
                                                <div style={{ height: 3, background: 'rgba(255,255,255,.05)', borderRadius: 5, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: done ? m.color : 'rgba(148,163,184,.3)', borderRadius: 5, transition: 'width 1.2s ease', boxShadow: done ? `0 0 6px ${m.color}60` : undefined }} /></div>
                                            </div>
                                            {done && <div style={{ fontSize: 10, fontWeight: 700, color: m.color, background: `${m.color}15`, padding: '2px 6px', borderRadius: 5, flexShrink: 0 }}>✓</div>}
                                        </div>
                                    )
                                })}
                            </div>
                        </Section>

                    </div>}
                </main>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}div[style*="position: relative"]{position:relative}`}</style>
        </div>
    )
}
