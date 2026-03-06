import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
    { icon: '⊞', label: 'Dashboard', path: '/dashboard' },
    { icon: '📋', label: 'Problems', path: '/problems' },
    { icon: '💡', label: 'Recommendations', path: '/recommendations' },
    { icon: '👤', label: 'Profile', path: '/profile' },
]

export default function Sidebar() {
    const navigate = useNavigate()
    const { pathname } = useLocation()

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">A</div>
                <span className="sidebar-logo-text">Algo<span>Ledger</span></span>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <span className="sidebar-section-label">Main</span>
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.path}
                        className={`nav-item ${pathname === item.path ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* Bottom */}
            <div className="sidebar-bottom">
                <button
                    className="nav-item w-full"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => navigate('/')}
                >
                    <span className="nav-icon">→</span>
                    Logout
                </button>
            </div>
        </aside>
    )
}
