export default function Topbar({ title, subtitle }) {
    return (
        <header className="topbar">
            <div className="topbar-left">
                <span className="topbar-title">{title}</span>
                {subtitle && <span className="topbar-sub">{subtitle}</span>}
            </div>
            <div className="topbar-right">
                {/* Streak Badge */}
                <div className="topbar-streak">
                    🔥 14 day streak
                </div>
                {/* Notification */}
                <button className="notif-btn" aria-label="Notifications">
                    🔔
                    <span className="notif-dot" />
                </button>
                {/* Avatar */}
                <div className="topbar-avatar" title="Rahul S.">R</div>
            </div>
        </header>
    )
}
