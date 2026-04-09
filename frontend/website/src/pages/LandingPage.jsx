import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'

const FEATURES = [
    {
        icon: '🔗',
        title: 'Unified Tracking',
        desc: 'Connect LeetCode, Codeforces, and GeeksforGeeks. All your solved problems in one place, zero manual entry.',
        color: '#6366F1',
    },
    {
        icon: '🔥',
        title: 'Streak System',
        desc: 'Stay consistent with daily streaks. Build habits that compound into interview-ready skills.',
        color: '#F59E0B',
    },
    {
        icon: '📊',
        title: 'Analytics Dashboard',
        desc: 'Visualize your progress with topic distribution, difficulty breakdown, and 30-day heatmaps.',
        color: '#22D3EE',
    },
    {
        icon: '🤖',
        title: 'Smart Recommendations',
        desc: 'AI-powered daily problem suggestions based on your weak areas and target companies.',
        color: '#A78BFA',
    },
]

const STATS = [
    { val: '12K+', label: 'Problems Tracked', icon: '📌' },
    { val: '3.2K', label: 'Active Users', icon: '👥' },
    { val: '94%', label: 'Interview Success', icon: '🎯' },
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

function FloatingOrb({ style }) {
    return <div className="lp-orb" style={style} />
}

export default function LandingPage() {
    const navigate = useNavigate()
    const heroRef = useRef(null)

    useEffect(() => {
        const hero = heroRef.current
        if (!hero) return
        const handleMouse = (e) => {
            const rect = hero.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10
            hero.style.setProperty('--rx', `${-y}deg`)
            hero.style.setProperty('--ry', `${x}deg`)
        }
        hero.addEventListener('mousemove', handleMouse)
        return () => hero.removeEventListener('mousemove', handleMouse)
    }, [])

    return (
        <div className="lp-root">
            {/* Background orbs */}
            <FloatingOrb style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', top: -200, left: -150, animationDuration: '18s' }} />
            <FloatingOrb style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)', bottom: -100, right: -100, animationDuration: '22s', animationDelay: '-8s' }} />
            <FloatingOrb style={{ width: 350, height: 350, background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)', top: '40%', left: '55%', animationDuration: '28s', animationDelay: '-14s' }} />

            {/* ── NAV ── */}
            <nav className="lp-nav">
                <div className="lp-logo">
                    <div className="lp-logo-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <span className="lp-logo-text">Algo<span>Ledger</span></span>
                </div>
                <div className="lp-nav-links">
                    <a href="#features" className="lp-nav-link">Features</a>
                    <a href="#pricing" className="lp-nav-link">Pricing</a>
                </div>
                <div className="lp-nav-actions">
                    <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Login</button>
                    <button className="lp-btn-primary" onClick={() => navigate('/signup')}>
                        Get Started →
                    </button>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="lp-hero" ref={heroRef}>
                <div className="lp-hero-badge">
                    <span className="lp-badge-dot" />
                    ✨ Now supports LeetCode · Codeforces · GFG
                </div>

                <h1 className="lp-hero-title">
                    Master DSA.<br />
                    <span className="lp-gradient-text">Track Everything.</span><br />
                    Ace Interviews.
                </h1>

                <p className="lp-hero-sub">
                    One intelligent dashboard for all your coding practice.<br />
                    Real analytics, smart streaks, and AI recommendations.
                </p>

                <div className="lp-hero-ctas">
                    <button className="lp-cta-primary" onClick={() => navigate('/signup')}>
                        <span>🚀 Start for Free</span>
                        <div className="lp-cta-shine" />
                    </button>
                    <button className="lp-cta-secondary" onClick={() => navigate('/login')}>
                        Sign In
                    </button>
                </div>

                {/* 3D floating dashboard card */}
                <div className="lp-3d-wrapper">
                    <div className="lp-3d-card">
                        <div className="lp-3d-card-header">
                            <div className="lp-3d-dots">
                                <span style={{ background: '#FF5F57' }} />
                                <span style={{ background: '#FEBC2E' }} />
                                <span style={{ background: '#28C840' }} />
                            </div>
                            <span className="lp-3d-card-title">AlgoLedger Dashboard</span>
                        </div>
                        <div className="lp-3d-stats-row">
                            {[
                                { val: '342', label: 'Solved', color: '#6366F1', icon: '✅' },
                                { val: '🔥 14', label: 'Day Streak', color: '#F59E0B', icon: '' },
                                { val: '48', label: 'Hard', color: '#EF4444', icon: '💪' },
                                { val: '87%', label: 'Readiness', color: '#22C55E', icon: '🎯' },
                            ].map(s => (
                                <div className="lp-3d-stat" key={s.label}>
                                    <div className="lp-3d-stat-val" style={{ color: s.color }}>{s.val}</div>
                                    <div className="lp-3d-stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="lp-3d-bars">
                            {[
                                { label: 'Arrays', pct: 78, color: '#6366F1' },
                                { label: 'Graphs', pct: 52, color: '#22D3EE' },
                                { label: 'DP', pct: 41, color: '#A78BFA' },
                                { label: 'Trees', pct: 65, color: '#22C55E' },
                            ].map(b => (
                                <div className="lp-3d-bar-row" key={b.label}>
                                    <span className="lp-3d-bar-label">{b.label}</span>
                                    <div className="lp-3d-bar-track">
                                        <div className="lp-3d-bar-fill" style={{ width: `${b.pct}%`, background: b.color }} />
                                    </div>
                                    <span className="lp-3d-bar-pct">{b.pct}%</span>
                                </div>
                            ))}
                        </div>
                        <div className="lp-3d-heatmap">
                            {Array.from({ length: 35 }).map((_, i) => {
                                const intensity = [0, 1, 2, 3, 4][Math.floor(Math.random() * 5)]
                                return <div key={i} className={`lp-3d-heatcell lp-heat-${intensity}`} />
                            })}
                        </div>
                        {/* Glow reflection */}
                        <div className="lp-3d-card-glow" />
                    </div>
                </div>
            </section>

            {/* ── STATS STRIP ── */}
            <div className="lp-stats-strip">
                {STATS.map(s => (
                    <div className="lp-stat-item" key={s.label}>
                        <div className="lp-stat-icon">{s.icon}</div>
                        <div className="lp-stat-val">{s.val}</div>
                        <div className="lp-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── FEATURES ── */}
            <section className="lp-features" id="features">
                <div className="lp-section-label">Features</div>
                <h2 className="lp-section-title">Everything you need to level up</h2>
                <p className="lp-section-sub">Purpose-built for competitive programmers and placement aspirants.</p>

                <div className="lp-features-grid">
                    {FEATURES.map((f, i) => (
                        <div
                            className="lp-feature-card"
                            key={f.title}
                            style={{ '--card-accent': f.color, animationDelay: `${i * 0.1}s` }}
                        >
                            <div className="lp-feature-icon-wrap" style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                                <span style={{ fontSize: 28 }}>{f.icon}</span>
                            </div>
                            <div className="lp-feature-title">{f.title}</div>
                            <div className="lp-feature-desc">{f.desc}</div>
                            <div className="lp-feature-arrow">→</div>
                            <div className="lp-feature-glow" style={{ background: `radial-gradient(circle at bottom right, ${f.color}20, transparent 70%)` }} />
                        </div>
                    ))}
                </div>
            </section>

            {/* ── PRICING ── */}
            <section className="lp-pricing" id="pricing">
                <div className="lp-section-label">Pricing</div>
                <h2 className="lp-section-title">Simple, transparent pricing</h2>
                <p className="lp-section-sub">Start free. Upgrade when you're serious about cracking interviews.</p>

                <div className="lp-pricing-grid">
                    {PRICING.map(plan => (
                        <div key={plan.name} className={`lp-pricing-card ${plan.featured ? 'lp-pricing-featured' : ''}`}>
                            {plan.badge && <div className="lp-pricing-badge">{plan.badge}</div>}
                            <div className="lp-pricing-name">{plan.name}</div>
                            <div className="lp-pricing-price">
                                {plan.price}
                                <span className="lp-pricing-cycle">/{plan.cycle}</span>
                            </div>
                            <div className="lp-pricing-divider" />
                            <ul className="lp-pricing-features">
                                {plan.features.map(f => (
                                    <li key={f} className="lp-pricing-feature">
                                        <span className="lp-check">✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                className={plan.featured ? 'lp-cta-primary w-full' : 'lp-cta-outline w-full'}
                                onClick={() => navigate('/signup')}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {plan.featured && <div className="lp-cta-shine" />}
                                {plan.cta}
                            </button>
                            {plan.featured && <div className="lp-pricing-glow" />}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section className="lp-cta-banner">
                <div className="lp-cta-banner-bg" />
                <div className="lp-cta-banner-content">
                    <h2 className="lp-cta-banner-title">Ready to crack your dream company?</h2>
                    <p className="lp-cta-banner-sub">Join thousands of developers tracking their DSA journey with AlgoLedger.</p>
                    <button className="lp-cta-primary" onClick={() => navigate('/signup')} style={{ margin: '0 auto' }}>
                        <span>🚀 Get Started for Free</span>
                        <div className="lp-cta-shine" />
                    </button>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="lp-footer">
                <div className="lp-footer-left">
                    <div className="lp-logo">
                        <div className="lp-logo-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <span className="lp-logo-text" style={{ fontSize: 14 }}>Algo<span>Ledger</span></span>
                    </div>
                    <span className="lp-footer-copy">© 2026 AlgoLedger. All rights reserved.</span>
                </div>
                <div className="lp-footer-links">
                    {['Privacy', 'Terms', 'Contact', 'Twitter', 'GitHub'].map(link => (
                        <a key={link} href="#" className="lp-footer-link">{link}</a>
                    ))}
                </div>
            </footer>
        </div>
    )
}
