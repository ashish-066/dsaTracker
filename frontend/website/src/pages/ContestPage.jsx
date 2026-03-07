import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../services/api'

const DIFF_COLOR = { easy: '#22C55E', medium: '#F59E0B', hard: '#EF4444' }
const CONTEST_CONFIG = {
    BEGINNER: { label: 'Beginner', color: '#22C55E', icon: '🟢' },
    MEDIUM: { label: 'Medium', color: '#F59E0B', icon: '🟡' },
    HARD: { label: 'Hard', color: '#EF4444', icon: '🔴' },
}

function fmtTime(secs) {
    const s = Math.max(0, Math.floor(secs))
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function ContestPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [challenge, setChallenge] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [secsLeft, setSecsLeft] = useState(0)
    const [finishing, setFinishing] = useState(false)
    const [fsWarning, setFsWarning] = useState(false)
    const containerRef = useRef(null)
    const pollRef = useRef(null)
    const timerRef = useRef(null)
    const myEmail = api.getUserEmail()

    const load = useCallback(async () => {
        const r = await api.fetchLeaderboard(id)
        if (r.success) {
            setChallenge(r.data)
            setSecsLeft(r.data.secondsRemaining || 0)
            setError(null)
        } else setError(r.error)
        setLoading(false)
    }, [id])

    useEffect(() => {
        if (!api.isAuthenticated()) { navigate('/login'); return }
        load()
        // Poll leaderboard every 10s
        pollRef.current = setInterval(load, 10_000)
        return () => { clearInterval(pollRef.current); clearInterval(timerRef.current) }
    }, [load])

    // Client-side countdown (syncs with server every 10s)
    useEffect(() => {
        clearInterval(timerRef.current)
        if (secsLeft <= 0 || challenge?.status !== 'ACTIVE') return
        timerRef.current = setInterval(() => setSecsLeft(s => Math.max(0, s - 1)), 1_000)
        return () => clearInterval(timerRef.current)
    }, [secsLeft, challenge?.status])

    // Fullscreen
    function enterFullscreen() {
        containerRef.current?.requestFullscreen?.().catch(() => { })
    }
    useEffect(() => {
        function onFsChange() {
            if (!document.fullscreenElement && challenge?.status === 'ACTIVE') setFsWarning(true)
        }
        document.addEventListener('fullscreenchange', onFsChange)
        return () => document.removeEventListener('fullscreenchange', onFsChange)
    }, [challenge?.status])

    async function handleFinish() {
        setFinishing(true)
        await api.finishChallenge(id)
        await load()
        setFinishing(false)
    }

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c1a' }}>
            <div style={{ textAlign: 'center', color: '#64748B' }}>
                <div style={{ width: 44, height: 44, border: '3px solid rgba(99,102,241,.2)', borderTop: '3px solid #6366F1', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
                Loading contest…
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    if (error || !challenge) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080c1a', color: '#EF4444', gap: 16 }}>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <div>{error || 'Challenge not found'}</div>
            <button onClick={() => navigate('/challenges')} style={{ background: 'rgba(99,102,241,.2)', border: '1px solid rgba(99,102,241,.4)', color: '#818CF8', padding: '9px 18px', borderRadius: 10, cursor: 'pointer' }}>← Back</button>
        </div>
    )

    const cfg = CONTEST_CONFIG[challenge.contestType] || {}
    const isActive = challenge.status === 'ACTIVE'
    const isCompleted = challenge.status === 'COMPLETED'
    const isPending = challenge.status === 'PENDING'
    const isMyChallenge = challenge.challengerId === myEmail
    const isOpponent = challenge.opponentId === myEmail

    const cp = challenge.challengerProgress || {}
    const op = challenge.opponentProgress || {}
    const myProgress = isMyChallenge ? cp : op
    const theirProgress = isMyChallenge ? op : cp

    const totalProblems = challenge.problems?.length || 0
    const urgentColor = secsLeft < 120 ? '#EF4444' : secsLeft < 300 ? '#F59E0B' : '#22C55E'

    const winner = challenge.winnerId
    const iWon = winner === myEmail

    return (
        <div ref={containerRef} style={{ minHeight: '100vh', background: 'linear-gradient(140deg,#07091a,#0d1327 50%,#080c1a)', fontFamily: 'Inter,system-ui,sans-serif', color: '#F1F5F9', position: 'relative' }}>
            {/* ambient orbs */}
            <div style={{ position: 'fixed', top: -150, right: -150, width: 400, height: 400, background: 'radial-gradient(circle,rgba(99,102,241,.08),transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: -100, left: 0, width: 400, height: 400, background: 'radial-gradient(circle,rgba(139,92,246,.06),transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />

            {/* Fullscreen warning */}
            {fsWarning && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <div style={{ fontSize: 48 }}>⚠️</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>You exited fullscreen!</div>
                    <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 8 }}>Stay in fullscreen during the contest. The timer keeps running.</div>
                    <button onClick={() => { enterFullscreen(); setFsWarning(false) }} style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>↩ Return to Contest</button>
                </div>
            )}

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px', position: 'relative', zIndex: 1 }}>

                {/* ── TOP BAR ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <button onClick={() => navigate('/challenges')} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 12 }}>← Back</button>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                                <span style={{ fontSize: 17, fontWeight: 800 }}>{cfg.label} Challenge #{challenge.id}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: isActive ? 'rgba(34,197,94,.15)' : isCompleted ? 'rgba(99,102,241,.15)' : isPending ? 'rgba(245,158,11,.15)' : 'rgba(100,116,139,.15)', color: isActive ? '#22C55E' : isCompleted ? '#6366F1' : isPending ? '#F59E0B' : '#64748B', border: `1px solid ${isActive ? 'rgba(34,197,94,.3)' : isCompleted ? 'rgba(99,102,241,.3)' : isPending ? 'rgba(245,158,11,.3)' : 'rgba(100,116,139,.3)'}` }}>{challenge.status}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>{challenge.challengerName} vs {challenge.opponentName}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isActive && !document.fullscreenElement && (
                            <button onClick={enterFullscreen} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#94A3B8', padding: '8px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 12 }}>⛶ Fullscreen</button>
                        )}
                        {/* TIMER */}
                        {isActive && (
                            <div style={{ padding: '8px 20px', borderRadius: 12, background: `${urgentColor}15`, border: `1px solid ${urgentColor}40`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ fontSize: 24, fontWeight: 900, color: urgentColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}>{fmtTime(secsLeft)}</div>
                                <div style={{ fontSize: 9, color: '#64748B', marginTop: 1 }}>REMAINING</div>
                            </div>
                        )}
                        {isPending && isOpponent && (
                            <button onClick={async () => { const r = await api.acceptChallenge(id); if (r.success) load() }} style={{ background: 'linear-gradient(135deg,#22C55E,#10B981)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>⚔️ Accept Challenge</button>
                        )}
                        {isPending && isMyChallenge && (
                            <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', fontSize: 12, color: '#F59E0B' }}>⏳ Waiting for opponent to accept…</div>
                        )}
                        {isActive && (
                            <button onClick={handleFinish} disabled={finishing} style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', color: '#EF4444', padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>{finishing ? 'Finishing…' : '🏁 Finish Early'}</button>
                        )}
                    </div>
                </div>

                {/* ── RESULT BANNER ── */}
                {isCompleted && (
                    <div style={{ background: iWon ? 'linear-gradient(135deg,rgba(34,197,94,.12),rgba(16,185,129,.06))' : 'linear-gradient(135deg,rgba(239,68,68,.1),rgba(168,85,247,.06))', border: `1px solid ${iWon ? 'rgba(34,197,94,.35)' : 'rgba(239,68,68,.35)'}`, borderRadius: 18, padding: '24px 28px', marginBottom: 22, textAlign: 'center' }}>
                        <div style={{ fontSize: 44, marginBottom: 8 }}>{winner ? (iWon ? '🏆' : '😔') : '🤝'}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: iWon ? '#22C55E' : '#EF4444' }}>
                            {winner ? (iWon ? 'You Won!' : 'You Lost') : 'It\'s a Draw!'}
                        </div>
                        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>
                            {winner ? `${winner === challenge.challengerId ? challenge.challengerName : challenge.opponentName} wins this contest` : 'Both players tied — no winner'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
                            <span style={{ fontSize: 13, color: '#94A3B8' }}>You solved <strong style={{ color: iWon ? '#22C55E' : '#F1F5F9' }}>{myProgress.solved || 0}</strong> / {totalProblems}</span>
                            <span style={{ fontSize: 13, color: '#94A3B8' }}>Opponent: <strong style={{ color: '#F1F5F9' }}>{theirProgress.solved || 0}</strong> / {totalProblems}</span>
                        </div>
                    </div>
                )}

                {/* ── SCOREBOARD ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 14, marginBottom: 22, alignItems: 'center' }}>
                    {[
                        { prog: challenge.challengerProgress, isMe: challenge.challengerId === myEmail, side: 'left' },
                        null,
                        { prog: challenge.opponentProgress, isMe: challenge.opponentId === myEmail, side: 'right' },
                    ].map((item, i) => {
                        if (item === null) return <div key="vs" style={{ textAlign: 'center', fontSize: 18, fontWeight: 900, color: '#475569' }}>VS</div>
                        const { prog, isMe } = item
                        const pct = totalProblems > 0 ? ((prog?.solved || 0) / totalProblems * 100) : 0
                        const isWinner = challenge.winnerId && prog?.userId === challenge.winnerId
                        return (
                            <div key={i} style={{ background: isWinner ? 'rgba(34,197,94,.08)' : 'rgba(255,255,255,.025)', border: `1px solid ${isWinner ? 'rgba(34,197,94,.3)' : isMe ? 'rgba(99,102,241,.3)' : 'rgba(255,255,255,.06)'}`, borderRadius: 14, padding: '18px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>{prog?.name || '—'} {isMe && <span style={{ fontSize: 10, color: '#6366F1', background: 'rgba(99,102,241,.15)', padding: '1px 7px', borderRadius: 10 }}>You</span>}</div>
                                        <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{prog?.userId}</div>
                                    </div>
                                    {isWinner && <span style={{ fontSize: 18 }}>🏆</span>}
                                </div>
                                <div style={{ fontSize: 30, fontWeight: 900, color: isWinner ? '#22C55E' : isMe ? '#6366F1' : '#F1F5F9', lineHeight: 1, marginBottom: 10 }}>{prog?.solved || 0}<span style={{ fontSize: 14, color: '#475569', fontWeight: 400 }}> / {totalProblems}</span></div>
                                <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 6, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: isWinner ? '#22C55E' : isMe ? 'linear-gradient(90deg,#6366F1,#8B5CF6)' : '#475569', borderRadius: 6, transition: 'width .8s ease' }} />
                                </div>
                                {prog?.lastSolvedAt && <div style={{ fontSize: 10, color: '#64748B', marginTop: 6 }}>Last solve: {new Date(prog.lastSolvedAt).toLocaleTimeString()}</div>}
                            </div>
                        )
                    })}
                </div>

                {/* ── PROBLEMS LIST ── */}
                <div style={{ background: 'rgba(255,255,255,.024)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.065)', borderRadius: 18, padding: 22 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Contest Problems</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 18 }}>
                        {isActive ? 'Solve these problems on LeetCode. Solves are detected automatically after syncing.' : 'Problem set for this contest.'}
                    </div>

                    {!challenge.problems?.length ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B', fontSize: 13 }}>
                            {isPending ? 'Problems are locked until the contest starts.' : 'No problems assigned.'}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {challenge.problems.map((p, i) => {
                                const dc = DIFF_COLOR[p.difficulty?.toLowerCase()] || '#94A3B8'
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,.3)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)'}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(99,102,241,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#6366F1', flexShrink: 0 }}>#{i + 1}</div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.title || p.titleSlug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                                                <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 600, color: dc, background: `${dc}15`, padding: '1px 8px', borderRadius: 20, border: `1px solid ${dc}30` }}>{p.difficulty}</span>
                                                    {p.platform && <span style={{ fontSize: 10, color: '#64748B', background: 'rgba(255,255,255,.05)', padding: '1px 8px', borderRadius: 20 }}>{p.platform}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {p.problemUrl && (
                                            <a href={p.problemUrl} target="_blank" rel="noopener noreferrer" style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', padding: '7px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 3px 12px rgba(99,102,241,.35)', transition: 'opacity .2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Solve →</a>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {isActive && (
                        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(56,189,248,.06)', border: '1px solid rgba(56,189,248,.18)', borderRadius: 12, fontSize: 11, color: '#94A3B8', lineHeight: 1.7 }}>
                            💡 <strong style={{ color: '#38BDF8' }}>How scoring works:</strong> Solve problems on LeetCode. After syncing (<em>Sync Now</em> on the dashboard), your solves are automatically detected and recorded. The leaderboard updates every 10 seconds.
                        </div>
                    )}
                </div>

            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{font-family:Inter,system-ui,sans-serif}`}</style>
        </div>
    )
}
