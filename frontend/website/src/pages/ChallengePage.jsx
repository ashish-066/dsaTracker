import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import * as api from '../services/api'

const CARD = {
    background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 22,
}
const CONTEST_CONFIG = {
    BEGINNER: { label: 'Beginner', color: '#22C55E', icon: '🟢', problems: '2 Easy + 1 Medium', time: '30 min', desc: 'Perfect for warming up.' },
    MEDIUM: { label: 'Medium', color: '#F59E0B', icon: '🟡', problems: '1 Easy + 3 Medium + 1 Hard', time: '45 min', desc: 'A balanced challenge.' },
    HARD: { label: 'Hard', color: '#EF4444', icon: '🔴', problems: '2 Medium + 3 Hard', time: '60 min', desc: 'Only for the brave.' },
}

const STATUS_COLOR = { PENDING: '#F59E0B', ACTIVE: '#22C55E', COMPLETED: '#6366F1', EXPIRED: '#64748B', DECLINED: '#EF4444' }

function Badge({ status }) {
    const c = STATUS_COLOR[status] || '#94A3B8'
    return <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: `${c}18`, color: c, border: `1px solid ${c}30` }}>{status}</span>
}

export default function ChallengePage() {
    const navigate = useNavigate()
    const [tab, setTab] = useState('create')         // create | mine | invitations
    const [contestType, setContestType] = useState('BEGINNER')
    const [opponentEmail, setOpponentEmail] = useState('')
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')
    const [createSuccess, setCreateSuccess] = useState(null)
    const [myChallenges, setMyChallenges] = useState([])
    const [invitations, setInvitations] = useState([])
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(null)

    const myEmail = api.getUserEmail()

    useEffect(() => { if (!api.isAuthenticated()) { navigate('/login'); return }; loadData() }, [tab])

    async function loadData() {
        setLoading(true)
        if (tab === 'mine') {
            const r = await api.fetchMyChallenges()
            if (r.success) setMyChallenges(r.data)
        } else if (tab === 'invitations') {
            const r = await api.fetchInvitations()
            if (r.success) setInvitations(r.data)
        }
        setLoading(false)
    }

    async function handleCreate(e) {
        e.preventDefault()
        if (!opponentEmail.trim()) return
        setCreating(true); setCreateError(''); setCreateSuccess(null)
        const r = await api.createChallenge(opponentEmail.trim(), contestType)
        if (r.success) { setCreateSuccess(r.data); setOpponentEmail('') }
        else setCreateError(r.error)
        setCreating(false)
    }

    async function handleAccept(id) {
        setActionLoading(id + '-accept')
        await api.acceptChallenge(id)
        navigate(`/contest/${id}`)
        setActionLoading(null)
    }

    async function handleDecline(id) {
        setActionLoading(id + '-decline')
        await api.declineChallenge(id)
        await loadData()
        setActionLoading(null)
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })

    return (
        <div className="app-shell" style={{ background: 'linear-gradient(140deg,#07091a,#0d1327 50%,#080c1a)' }}>
            <div style={{ position: 'fixed', top: -200, right: -200, width: 500, height: 500, background: 'radial-gradient(circle,rgba(99,102,241,.07),transparent 65%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
            <Sidebar />
            <div className="main-content" style={{ position: 'relative', zIndex: 1 }}>
                <Topbar title="Challenges" subtitle={today} />
                <main className="page-content">

                    {/* Tab bar */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                        {[['create', '⚔️ New Challenge'], ['mine', '📋 My Challenges'], ['invitations', '📬 Invitations']].map(([k, l]) => (
                            <button key={k} onClick={() => setTab(k)} style={{
                                padding: '9px 18px', borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: '1px solid', transition: 'all .2s',
                                background: tab === k ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,.03)',
                                color: tab === k ? '#fff' : 'var(--text-muted)', borderColor: tab === k ? 'transparent' : 'rgba(255,255,255,.08)',
                            }}>{l}</button>
                        ))}
                    </div>

                    {/* ══ CREATE TAB ══ */}
                    {tab === 'create' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
                            {/* Form */}
                            <div style={CARD}>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Challenge a Friend</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Enter their email and pick a contest mode. All rules are enforced server-side.</div>

                                {createError && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, padding: '10px 14px', color: '#EF4444', fontSize: 12, marginBottom: 14 }}>{createError}</div>}
                                {createSuccess && (
                                    <div style={{ background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#22C55E', marginBottom: 6 }}>✅ Challenge Sent!</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Challenge #{createSuccess.id} sent to <strong style={{ color: '#F1F5F9' }}>{createSuccess.opponentName}</strong>. They must accept to start.</div>
                                        <button onClick={() => navigate(`/contest/${createSuccess.id}`)} style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>View Challenge →</button>
                                    </div>
                                )}

                                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Opponent Email</label>
                                        <input value={opponentEmail} onChange={e => setOpponentEmail(e.target.value)}
                                            placeholder="friend@example.com" type="email" required
                                            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contest Type</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {Object.entries(CONTEST_CONFIG).map(([k, v]) => (
                                                <div key={k} onClick={() => setContestType(k)} style={{
                                                    border: `1px solid ${contestType === k ? v.color + '60' : 'rgba(255,255,255,.07)'}`,
                                                    background: contestType === k ? `${v.color}0d` : 'rgba(255,255,255,.02)',
                                                    borderRadius: 11, padding: '12px 16px', cursor: 'pointer', transition: 'all .2s',
                                                    display: 'flex', alignItems: 'center', gap: 14,
                                                }}>
                                                    <span style={{ fontSize: 20 }}>{v.icon}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: contestType === k ? v.color : 'var(--text-primary)' }}>{v.label}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{v.problems} · {v.time}</div>
                                                    </div>
                                                    {contestType === k && <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.color }} />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button type="submit" disabled={creating} style={{
                                        background: creating ? 'rgba(99,102,241,.3)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                                        color: '#fff', border: 'none', padding: '13px', borderRadius: 11, fontWeight: 700, fontSize: 14,
                                        cursor: creating ? 'not-allowed' : 'pointer', boxShadow: creating ? 'none' : '0 4px 16px rgba(99,102,241,.35)', transition: 'all .25s', marginTop: 4,
                                    }}>{creating ? 'Sending…' : '⚔️ Send Challenge'}</button>
                                </form>
                            </div>

                            {/* Contest type info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {Object.entries(CONTEST_CONFIG).map(([k, v]) => (
                                    <div key={k} style={{ ...CARD, border: `1px solid ${v.color}25`, background: `${v.color}07`, padding: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${v.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{v.icon}</div>
                                            <div><div style={{ fontSize: 14, fontWeight: 700, color: v.color }}>{v.label} Mode</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.time}</div></div>
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{v.desc}</div>
                                        <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{v.problems}</div>
                                    </div>
                                ))}
                                <div style={{ ...CARD, padding: 16, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>ℹ️ How it works</div>
                                    1. You send a challenge → opponent gets an invitation<br />
                                    2. Opponent accepts → contest starts immediately<br />
                                    3. Solve problems on LeetCode during the timer<br />
                                    4. More solved = win · Tie → faster total time wins<br />
                                    5. Timer enforced by backend — no frontend tricks
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══ MY CHALLENGES TAB ══ */}
                    {tab === 'mine' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {loading && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading…</div>}
                            {!loading && myChallenges.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>⚔️</div>
                                    <div>No challenges yet. Create one to get started!</div>
                                </div>
                            )}
                            {myChallenges.map(c => {
                                const cfg = CONTEST_CONFIG[c.contestType] || {}
                                const isChallenger = c.challengerId === myEmail
                                const opponent = isChallenger ? c.opponentName : c.challengerName
                                const opponentLabel = isChallenger ? 'vs' : 'from'
                                return (
                                    <div key={c.id} style={{ ...CARD, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ width: 42, height: 42, borderRadius: 10, background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{cfg.icon}</div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700 }}>
                                                    Challenge #{c.id} · {opponentLabel} <span style={{ color: cfg.color }}>{opponent}</span>
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{cfg.label} · {cfg.time} · {new Date(c.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Badge status={c.status} />
                                            {c.winnerId && <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>{c.winnerId === myEmail ? '🏆 You won!' : '😔 You lost'}</span>}
                                            <button onClick={() => navigate(`/contest/${c.id}`)} style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.3)', color: '#818CF8', padding: '7px 14px', borderRadius: 9, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                                                {c.status === 'ACTIVE' ? '▶ Join Contest' : 'View →'}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* ══ INVITATIONS TAB ══ */}
                    {tab === 'invitations' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {loading && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading…</div>}
                            {!loading && invitations.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
                                    <div>No pending invitations right now.</div>
                                </div>
                            )}
                            {invitations.map(c => {
                                const cfg = CONTEST_CONFIG[c.contestType] || {}
                                return (
                                    <div key={c.id} style={{ ...CARD, border: `1px solid ${cfg.color}25`, background: `${cfg.color}05` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 11, background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{cfg.icon}</div>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 700 }}><span style={{ color: cfg.color }}>{c.challengerName}</span> challenged you!</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{cfg.label} Mode · {cfg.problems} · {cfg.time}</div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Sent {new Date(c.createdAt).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button onClick={() => handleDecline(c.id)} disabled={actionLoading === c.id + '-decline'} style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#EF4444', padding: '9px 16px', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                                    {actionLoading === c.id + '-decline' ? '…' : '✗ Decline'}
                                                </button>
                                                <button onClick={() => handleAccept(c.id)} disabled={actionLoading === c.id + '-accept'} style={{ background: 'linear-gradient(135deg,#22C55E,#10B981)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 14px rgba(34,197,94,.3)' }}>
                                                    {actionLoading === c.id + '-accept' ? 'Starting…' : '⚔️ Accept & Start'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                </main>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
