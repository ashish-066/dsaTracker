import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getUserName, getUserEmail, fetchDashboardData } from '../services/api'
import { useProfilePic } from '../utils/profilePic'

const NAV_SECTIONS = [
    {
        label: 'MAIN',
        items: [
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                ),
                label: 'Dashboard',
                path: '/dashboard',
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                    </svg>
                ),
                label: 'Problems',
                path: '/problems',
                badge: '1347',
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                    </svg>
                ),
                label: 'Topics',
                path: '/problems',
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                ),
                label: 'Sheets',
                path: '/problems',
            },
        ],
    },
    {
        label: 'COMPETE',
        items: [
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                ),
                label: 'Contests',
                path: '/challenges',
                notif: true,
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                ),
                label: 'Arena',
                path: '/challenges',
            },
        ],
    },
    {
        label: 'SOCIAL',
        items: [
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                        <path d="M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                ),
                label: 'Community',
                path: '/community',
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                ),
                label: 'Friends',
                path: '/community',
            },
        ],
    },
]

export default function Sidebar() {
    const navigate = useNavigate()
    const { pathname } = useLocation()

    const rawName    = getUserName() || getUserEmail() || ''
    const initial    = rawName ? rawName[0].toUpperCase() : '?'
    const shortName  = rawName.includes('@')
        ? rawName.split('@')[0]
        : (rawName.split(' ')[0] || 'User')
    const profilePic = useProfilePic()

    const [streak, setStreak] = useState(null)

    useEffect(() => {
        fetchDashboardData()
            .then(r => setStreak(r?.data?.currentStreak ?? 0))
            .catch(() => setStreak(0))
    }, [])

    const streakColor =
        streak === null ? '#6B7280' :
        streak > 14     ? '#a78bfa' :
        streak > 6      ? '#fb923c' :
        streak > 0      ? '#fbbf24' :
                          '#6B7280'

    const streakText =
        streak === null ? '…'              :
        streak === 0    ? 'No streak yet'  :
        streak === 1    ? '🔥 1 day'       :
                          `🔥 ${streak} days`

    return (
        <aside className="sidebar">

            {/* ── Logo ── */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                            stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                <div>
                    <div className="sidebar-logo-text">
                        DSA<span>Forge</span>
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
                        Tracker v2
                    </div>
                </div>
            </div>

            {/* ── User mini-profile ── */}
            <div className="sidebar-user">
                <div
                    className="sidebar-user-avatar"
                    style={profilePic ? {
                        backgroundImage: `url(${profilePic})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: 'transparent',
                    } : undefined}
                >
                    {profilePic ? '' : initial}
                </div>
                <div className="sidebar-user-info">
                    <div className="sidebar-user-name">{shortName}</div>
                    <div className="sidebar-user-rank" style={{ color: streakColor }}>
                        {streakText}
                    </div>
                </div>
            </div>

            {/* ── Navigation ── */}
            <nav className="sidebar-nav">
                {NAV_SECTIONS.map(section => (
                    <div key={section.label} style={{ marginBottom: '18px' }}>
                        <span className="sidebar-section-label">{section.label}</span>

                        {section.items.map(item => {
                            const isActive = pathname === item.path
                            return (
                                <button
                                    key={item.label}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => navigate(item.path)}
                                    style={isActive ? { '--nav-color': '#a78bfa' } : {}}
                                >
                                    <span className="nav-icon" style={{ color: isActive ? '#a78bfa' : undefined }}>
                                        {item.icon}
                                    </span>
                                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>

                                    {item.badge && (
                                        <span style={{
                                            background: 'rgba(167,139,250,0.15)',
                                            color: '#a78bfa',
                                            fontSize: '10px',
                                            padding: '1px 7px',
                                            borderRadius: '10px',
                                            fontFamily: "'JetBrains Mono', monospace",
                                        }}>
                                            {item.badge}
                                        </span>
                                    )}
                                    {item.notif && !item.badge && (
                                        <span style={{
                                            width: '7px',
                                            height: '7px',
                                            background: '#f87171',
                                            borderRadius: '50%',
                                            flexShrink: 0,
                                        }} />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                ))}
            </nav>

            {/* ── Bottom: streak + logout ── */}
            <div className="sidebar-bottom">
                <div className="sidebar-xp-bar">
                    <div className="sidebar-xp-header">
                        <span className="sidebar-xp-label">Streak</span>
                        <span className="sidebar-xp-count" style={{ color: streakColor }}>
                            {streak === null ? '…' : streak > 0 ? `${streak}d` : '0d'}
                        </span>
                    </div>
                    <div className="sidebar-xp-track">
                        <div
                            className="sidebar-xp-fill"
                            style={{
                                width: `${Math.min(100, ((streak || 0) / 30) * 100)}%`,
                                background: streakColor,
                                transition: 'width 0.6s ease',
                            }}
                        />
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>
                        30-day milestone
                    </div>
                </div>

                <button
                    className="nav-item nav-item-logout"
                    onClick={() => navigate('/')}
                >
                    <span className="nav-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                    </span>
                    <span className="nav-label">Logout</span>
                </button>
            </div>
        </aside>
    )
}