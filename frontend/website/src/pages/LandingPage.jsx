import { useNavigate } from 'react-router-dom'

const FEATURES = [
    {
        icon: '🔗',
        title: 'Unified Tracking',
        desc: 'Connect LeetCode, Codeforces, and GeeksforGeeks. All your solved problems in one place, zero manual entry.',
    },
    {
        icon: '🔥',
        title: 'Streak System',
        desc: 'Stay consistent with daily streaks. Build habits that compound into interview-ready skills.',
    },
    {
        icon: '📊',
        title: 'Analytics Dashboard',
        desc: 'Visualize your progress with topic distribution, difficulty breakdown, and 30-day heatmaps.',
    },
    {
        icon: '🤖',
        title: 'Smart Recommendations',
        desc: 'AI-powered daily problem suggestions based on your weak areas and target companies.',
    },
]

const PRICING = [
    {
        name: 'Free',
        price: '$0',
        cycle: 'forever',
        features: ['Up to 2 platforms', 'Basic analytics', 'Streak tracking', '5 recommendations/day'],
        cta: 'Get Started',
        featured: false,
    },
    {
        name: 'Pro',
        price: '$5',
        cycle: 'per month',
        features: ['Unlimited platforms', 'Advanced analytics', 'Smart recommendations', 'Company targeting', 'Priority support'],
        cta: 'Start Free Trial',
        featured: true,
        badge: 'Most Popular',
    },
]

export default function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="landing-page">
            {/* Nav */}
            <nav className="landing-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="sidebar-logo-icon">A</div>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>Algo<span style={{ color: 'var(--text-accent)' }}>Ledger</span></span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Login</button>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/signup')}>Get Started</button>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-badge">✨ Now supports 3 platforms</div>
                <h1 className="hero-title">
                    Track Your <span className="highlight">DSA Journey</span><br />Across Platforms
                </h1>
                <p className="hero-sub">
                    One dashboard for LeetCode, Codeforces, and GeeksforGeeks.
                    Real analytics. Smart recommendations. Daily streaks.
                </p>
                <div className="hero-ctas">
                    <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}>
                        🚀 Get Started — Free
                    </button>
                    <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
                        Login
                    </button>
                </div>

                {/* Mini stats row */}
                <div style={{
                    display: 'flex', gap: 40, marginTop: 16,
                    padding: '20px 40px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                }}>
                    {[
                        { val: '12,000+', label: 'Problems tracked' },
                        { val: '3,200+', label: 'Active users' },
                        { val: '94%', label: 'Interview success rate' },
                    ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-accent)' }}>{s.val}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="features-section">
                <h2>Everything you need to level up</h2>
                <p className="sub">Purpose-built for competitive programmers and placement aspirants.</p>
                <div className="features-grid">
                    {FEATURES.map(f => (
                        <div key={f.title} className="feature-card">
                            <div className="feature-icon">{f.icon}</div>
                            <div className="feature-title">{f.title}</div>
                            <div className="feature-desc">{f.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Dashboard preview strip */}
            <section style={{ padding: '0 80px 80px' }}>
                <div style={{
                    background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '32px',
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
                }}>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-accent)' }}>342</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Problems Solved</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--warning)' }}>🔥 14</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Day Streak</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--danger)' }}>48</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Hard Problems</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--success)' }}>87%</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Readiness Score</div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="pricing-section">
                <h2>Simple, transparent pricing</h2>
                <p className="sub">Start free. Upgrade when you're serious about cracking interviews.</p>
                <div className="pricing-grid">
                    {PRICING.map(plan => (
                        <div key={plan.name} className={`pricing-card ${plan.featured ? 'featured' : ''}`}>
                            {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
                            <div className="pricing-name">{plan.name}</div>
                            <div className="pricing-price">{plan.price}</div>
                            <div className="pricing-cycle">{plan.cycle}</div>
                            <div className="pricing-features">
                                {plan.features.map(f => (
                                    <div key={f} className="pricing-feature">
                                        <span style={{ color: 'var(--success)' }}>✓</span> {f}
                                    </div>
                                ))}
                            </div>
                            <button
                                className={`btn ${plan.featured ? 'btn-primary' : 'btn-secondary'} w-full`}
                                onClick={() => navigate('/signup')}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="sidebar-logo-icon" style={{ width: 28, height: 28, fontSize: 12 }}>A</div>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>© 2026 AlgoLedger</span>
                </div>
                <div className="footer-links">
                    {['Privacy', 'Terms', 'Contact', 'Twitter', 'GitHub'].map(link => (
                        <a key={link} className="footer-link" href="#">{link}</a>
                    ))}
                </div>
            </footer>
        </div>
    )
}
