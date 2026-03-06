import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { getLinkedPlatforms, fetchDashboardData, syncAllPlatforms, getUserEmail } from '../services/api'


export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [dashData, setDashData] = useState(null)
    const [syncing, setSyncing] = useState(false)
    const email = getUserEmail() || ''

    useEffect(() => {
        fetchDashboardData().then(r => {
            if (r.success) setDashData(r.data)
        }).catch(() => { })
    }, [])

    const handleSync = useCallback(async () => {
        setSyncing(true)
        try {
            await syncAllPlatforms()
            const r = await fetchDashboardData()
            if (r.success) setDashData(r.data)
        } catch (e) { console.error('Sync failed:', e) }
        setSyncing(false)
    }, [])

    // Derive stats from backend response
    const totalSolved = dashData?.totalSolved || 0
    const streak = dashData?.currentStreak || 0
    const hardSolved = dashData?.hardSolved || 0
    const platforms = dashData?.platforms || []
    const linkedPlats = dashData?.linkedPlatforms || []
    const platformCount = linkedPlats.length

    const activityStats = [
        { label: 'Total Solved', value: totalSolved || '—' },
        { label: 'Current Streak', value: streak > 0 ? `${streak} days` : '—' },
        { label: 'Hard Problems', value: hardSolved || '—' },
        { label: 'Platforms Linked', value: platformCount || '—' },
    ]

    // Build connected platforms from DB-backed data
    const connectedPlatforms = platforms.map(p => ({
        key: p.platform,
        label: p.platform === 'leetcode' ? 'LeetCode' : 'Codeforces',
        color: p.platform === 'leetcode' ? '#FFA116' : '#1890FF',
        abbr: p.platform === 'leetcode' ? 'LC' : 'CF',
        username: p.username,
        problems: p.totalSolved,
        easySolved: p.easySolved,
        mediumSolved: p.mediumSolved,
        hardSolved: p.hardSolved,
        currentStreak: p.currentStreak,
        updatedAt: p.updatedAt,
        hasData: p.totalSolved > 0,
    }))

    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Profile" subtitle="Manage your account and platforms" />
                <main className="page-content">

                    {/* Profile Header */}
                    <div className="profile-header" style={{ marginBottom: 20 }}>
                        <div className="profile-avatar-lg">R</div>
                        <div style={{ flex: 1 }}>
                            <div className="profile-name">Rahul Sharma</div>
                            <div className="profile-email">rahul@example.com</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                <span style={{
                                    padding: '3px 10px', borderRadius: 'var(--radius-full)',
                                    background: 'var(--success-light)', color: 'var(--success)',
                                    fontSize: 12, fontWeight: 600,
                                }}>⚡ Intermediate</span>
                                <span style={{
                                    padding: '3px 10px', borderRadius: 'var(--radius-full)',
                                    background: 'var(--accent-light)', color: 'var(--text-accent)',
                                    fontSize: 12, fontWeight: 600,
                                }}>🔗 {platformCount} platform{platformCount !== 1 ? 's' : ''} linked</span>
                                {streak > 0 && (
                                    <span style={{
                                        padding: '3px 10px', borderRadius: 'var(--radius-full)',
                                        background: 'var(--warning-light)', color: 'var(--warning)',
                                        fontSize: 12, fontWeight: 600,
                                    }}>🔥 {streak}-day streak</span>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
                            <button className="btn btn-secondary btn-sm">✏️ Edit Profile</button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{
                        display: 'flex', gap: 4, marginBottom: 20,
                        background: 'var(--bg-card)', padding: 4,
                        borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)',
                        width: 'fit-content',
                    }}>
                        {['overview', 'platforms', 'security'].map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                style={{
                                    padding: '8px 18px', borderRadius: 'var(--radius-md)',
                                    fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                                    background: activeTab === t ? 'var(--accent)' : 'transparent',
                                    color: activeTab === t ? '#fff' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                }}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid-2">
                            {/* Stats */}
                            <div className="card">
                                <div className="section-title" style={{ marginBottom: 20 }}>📊 Activity Summary</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {activityStats.map(s => (
                                        <div key={s.label} style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)',
                                        }}>
                                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</span>
                                            <span style={{ fontSize: 14, fontWeight: 700 }}>{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: 8 }}>
                                    <span style={{
                                        fontSize: 10, fontWeight: 600, padding: '2px 6px',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'rgba(99,102,241,0.12)', color: '#6366F1',
                                    }}>↻ Fetched from All Linked Platforms</span>
                                </div>
                            </div>

                            {/* Account info */}
                            <div className="card">
                                <div className="section-title" style={{ marginBottom: 20 }}>👤 Account Info</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {[
                                        { label: 'Full Name', val: 'Rahul Sharma' },
                                        { label: 'Email', val: 'rahul@example.com' },
                                        { label: 'Member Since', val: 'January 2026' },
                                        { label: 'Plan', val: 'Pro ✨' },
                                    ].map(r => (
                                        <div key={r.label} style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)',
                                        }}>
                                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.label}</span>
                                            <span style={{ fontSize: 14, fontWeight: 600 }}>{r.val}</span>
                                        </div>
                                    ))}
                                    <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
                                        ✏️ Edit Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Platforms Tab */}
                    {activeTab === 'platforms' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {connectedPlatforms.length === 0 && (
                                <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
                                    <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                                        No platforms linked. <a href="/onboarding" style={{ color: 'var(--accent)' }}>Complete onboarding</a> to add your accounts.
                                    </div>
                                </div>
                            )}

                            {connectedPlatforms.map(p => (
                                <div key={p.key} className="card" style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                                                background: `${p.color}18`, border: `1px solid ${p.color}30`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 13, fontWeight: 800, color: p.color,
                                            }}>
                                                {p.abbr}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700 }}>{p.label}</div>
                                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                                                    @{p.username} · {p.hasData ? `${p.problems} problems solved` : 'Click Sync to fetch data'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: 'var(--radius-full)',
                                                background: 'var(--success-light)', color: 'var(--success)',
                                                fontSize: 12, fontWeight: 600,
                                            }}>● Connected</span>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={handleSync}
                                                disabled={syncing}
                                            >
                                                {syncing ? '⏳ Syncing...' : 'Sync ↻'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Platform detailed stats (from DB) */}
                                    {p.hasData && (
                                        <div style={{
                                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
                                            marginTop: 14, padding: 14, background: 'var(--bg-tertiary)',
                                            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
                                        }}>
                                            <PStat label="Total" value={p.problems} />
                                            <PStat label="Easy" value={p.easySolved} color="#22C55E" />
                                            <PStat label="Medium" value={p.mediumSolved} color="#F59E0B" />
                                            <PStat label="Hard" value={p.hardSolved} color="#EF4444" />
                                            {p.currentStreak > 0 && <PStat label="Streak" value={`${p.currentStreak}d`} color="#F59E0B" />}
                                        </div>
                                    )}
                                    {p.updatedAt && (
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                                            Last synced: {new Date(p.updatedAt).toLocaleString()}
                                        </div>
                                    )}

                                    {/* Source label */}
                                    {p.hasData && (
                                        <div style={{ marginTop: 8 }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 600, padding: '2px 6px',
                                                borderRadius: 'var(--radius-sm)',
                                                background: `${p.color}15`, color: p.color,
                                            }}>↻ Fetched from {p.label} API</span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add platform */}
                            <div className="card" style={{
                                padding: '20px 24px', border: '1px dashed var(--border)',
                                textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                            }}>
                                <div style={{ fontSize: 24, marginBottom: 8 }}>+</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    Add Another Platform
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                    Go to <a href="/onboarding" style={{ color: 'var(--accent)' }}>onboarding</a> to link more accounts
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
                            {/* Change password */}
                            <div className="card">
                                <div className="section-title" style={{ marginBottom: 16 }}>🔒 Change Password</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div className="input-group">
                                        <label className="input-label">Current Password</label>
                                        <input id="current-password" type="password" className="input-field" placeholder="••••••••" />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">New Password</label>
                                        <input id="new-password" type="password" className="input-field" placeholder="Min. 8 characters" />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Confirm New Password</label>
                                        <input id="confirm-new-password" type="password" className="input-field" placeholder="Repeat new password" />
                                    </div>
                                    <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                                        Update Password
                                    </button>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="card" style={{ border: '1px solid rgba(239,68,68,0.25)' }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
                                    ⚠️ Danger Zone
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                                    Deleting your account is permanent and cannot be undone. All your problem history,
                                    streaks, and analytics will be lost forever.
                                </p>
                                {!showDeleteConfirm ? (
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        Delete Account
                                    </button>
                                ) : (
                                    <div style={{
                                        background: 'var(--danger-light)', border: '1px solid rgba(239,68,68,0.25)',
                                        borderRadius: 'var(--radius-md)', padding: '14px 16px',
                                    }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                                            Are you absolutely sure? This cannot be undone.
                                        </p>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-danger btn-sm">Yes, delete everything</button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => setShowDeleteConfirm(false)}
                                            >Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    )
}

/** Small stat display for platform cards */
function PStat({ label, value, color }) {
    return (
        <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
        </div>
    )
}
