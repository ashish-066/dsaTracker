import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

const SECONDARY_RECS = [
    { name: 'Coin Change', platform: 'lc', difficulty: 'Medium', topic: 'Dynamic Programming', reason: 'DP weak area' },
    { name: 'Longest Common Subsequence', platform: 'lc', difficulty: 'Medium', topic: 'Dynamic Programming', reason: 'DP weak area' },
    { name: 'Number of Islands', platform: 'lc', difficulty: 'Medium', topic: 'Graphs', reason: 'Graph coverage low' },
    { name: 'Redundant Connection', platform: 'lc', difficulty: 'Medium', topic: 'Graphs', reason: 'Union-Find practice' },
    { name: 'Kth Largest Element', platform: 'gfg', difficulty: 'Medium', topic: 'Sorting', reason: 'QuickSelect pattern' },
]

const PlatformChip = ({ p }) => {
    const map = { lc: ['platform-lc', 'LeetCode'], cf: ['platform-cf', 'Codeforces'], gfg: ['platform-gfg', 'GFG'] }
    const [cls, label] = map[p] || ['', p]
    return <span className={`platform-chip ${cls}`}>{label}</span>
}

const DiffBadge = ({ d }) => {
    const map = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' }
    return <span className={`badge ${map[d]}`}>{d}</span>
}

export default function RecommendationsPage() {
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Recommendations" subtitle="Personalised for your weak spots" />
                <main className="page-content">

                    {/* Section title */}
                    <div style={{ marginBottom: 20 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Today's Recommendation</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                            Based on your recent activity and skill gaps — updated daily at midnight.
                        </p>
                    </div>

                    {/* Featured Problem */}
                    <div className="rec-featured" style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                                    <PlatformChip p="lc" />
                                    <DiffBadge d="Hard" />
                                    <span className="badge badge-accent">Dynamic Programming</span>
                                    <span className="badge badge-accent">String</span>
                                </div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Word Break II</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                                    LeetCode #140 · Given a string <code style={{ background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: 4 }}>s</code> and a dictionary of strings,
                                    return all possible ways to segment <code style={{ background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: 4 }}>s</code> such that every segment is in the dictionary.
                                </p>
                                <div className="rec-reason">
                                    <span>💡</span>
                                    <span>
                                        Recommended because <strong style={{ color: 'var(--text-primary)' }}>Dynamic Programming</strong> is your weakest topic —
                                        only 46% coverage. Builds backtracking + memoisation skills.
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                                <button className="btn btn-primary" style={{ minWidth: 160 }}>Solve Now →</button>
                                <button className="btn btn-secondary" style={{ minWidth: 160 }}>See Hints</button>
                            </div>
                        </div>

                        {/* Stats row */}
                        <div style={{
                            display: 'flex', gap: 24, marginTop: 20, paddingTop: 20,
                            borderTop: '1px solid var(--border-subtle)',
                        }}>
                            {[
                                { label: 'Acceptance', val: '38.4%' },
                                { label: 'Submissions', val: '1.2M' },
                                { label: 'Avg Time', val: '~40 min' },
                                { label: 'Similar to', val: 'Word Break I' },
                            ].map(s => (
                                <div key={s.label}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{s.label}</div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{s.val}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Secondary Recommendations */}
                    <div style={{ marginBottom: 16 }}>
                        <div className="section-header">
                            <div>
                                <div className="section-title">More for Today</div>
                                <div className="section-sub">Based on your profile — sorted by impact</div>
                            </div>
                            <button className="btn btn-ghost btn-sm">Refresh ↻</button>
                        </div>
                    </div>

                    <div className="rec-list">
                        {SECONDARY_RECS.map((rec, i) => (
                            <div key={i} className="rec-item">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {rec.name}
                                        </span>
                                        <PlatformChip p={rec.platform} />
                                        <DiffBadge d={rec.difficulty} />
                                        <span className="badge badge-accent">{rec.topic}</span>
                                    </div>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        💡 {rec.reason}
                                    </span>
                                </div>
                                <button className="btn btn-secondary btn-sm">Solve →</button>
                            </div>
                        ))}
                    </div>

                    {/* Empty state example */}
                    <div style={{ marginTop: 36 }}>
                        <div className="section-header">
                            <div className="section-title">Completed Today</div>
                        </div>
                        <div className="card">
                            <div className="empty-state" style={{ padding: '40px 32px' }}>
                                <div className="empty-icon">🎯</div>
                                <div className="empty-title">Nothing completed yet today</div>
                                <div className="empty-desc">
                                    Solve your recommended problems to start building today's progress.
                                    Consistency beats intensity every time.
                                </div>
                            </div>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    )
}
