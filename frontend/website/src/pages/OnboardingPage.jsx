/**
 * OnboardingPage.jsx
 * ──────────────────
 * Multi-step onboarding with submission-based account verification.
 *
 * LeetCode: User submits "Create Hello World Function" to prove ownership.
 * Codeforces: User submits "4A - Watermelon" to prove ownership.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../services/api'

const STEPS = ['Skill Level', 'Platforms', 'Companies']

const SKILLS = [
    { id: 'beginner', icon: '🌱', name: 'Beginner', desc: '0–100 problems' },
    { id: 'intermediate', icon: '⚡', name: 'Intermediate', desc: '100–400 problems' },
    { id: 'advanced', icon: '🔥', name: 'Advanced', desc: '400+ problems' },
]

const COMPANIES = [
    'Google', 'Amazon', 'Microsoft', 'Meta', 'Adobe',
    'Flipkart', 'Infosys', 'TCS', 'Wipro', 'Uber',
    'Goldman Sachs', 'DE Shaw',
]

const PLATFORM_CONFIG = [
    { key: 'leetcode', label: 'LeetCode', color: '#FFA116', placeholder: 'e.g. rahul_codes' },
    { key: 'codeforces', label: 'Codeforces', color: '#1890FF', placeholder: 'e.g. rahul_cf' },
]

export default function OnboardingPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [skill, setSkill] = useState(null)
    const [selectedCompanies, setSelectedCompanies] = useState([])

    // Platform verification state
    // status: 'idle' | 'pending' | 'checking' | 'verified'
    // pending = problem link shown, waiting for user to submit
    // checking = polling/checking submission
    const [platformState, setPlatformState] = useState({
        leetcode: { username: '', status: 'idle', problemUrl: null, problemName: null, startTime: null, message: '', loading: false },
        codeforces: { username: '', status: 'idle', problemUrl: null, problemName: null, startTime: null, message: '', loading: false },
    })

    useEffect(() => {
        if (!api.isAuthenticated()) { navigate('/login') }
    }, [navigate])

    const updatePlatform = (key, updates) => {
        setPlatformState(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }))
    }

    const toggleCompany = c => {
        setSelectedCompanies(prev =>
            prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
        )
    }

    const hasVerified = Object.values(platformState).some(p => p.status === 'verified')

    const canProceed = () => {
        if (step === 0) return !!skill
        if (step === 1) return hasVerified
        return selectedCompanies.length > 0
    }

    // ── Step 1: Initiate Verification — check username/handle, get problem link ──
    const handleInitiate = async (platformKey) => {
        const ps = platformState[platformKey]
        if (!ps.username.trim()) {
            updatePlatform(platformKey, { message: 'Please enter a username first.' })
            return
        }

        updatePlatform(platformKey, { loading: true, message: '' })

        try {
            let result
            if (platformKey === 'leetcode') {
                result = await api.initiateLeetCodeVerification(ps.username.trim())
            } else {
                result = await api.initiateCodeforcesVerification(ps.username.trim())
            }

            if (result.success) {
                const d = result.data
                updatePlatform(platformKey, {
                    status: 'pending',
                    problemUrl: d.problemUrl,
                    problemName: platformKey === 'leetcode' ? d.problemName : '4A - Watermelon',
                    startTime: d.startTime,
                    loading: false,
                    message: '',
                })
            } else {
                updatePlatform(platformKey, {
                    loading: false,
                    message: result.message || 'Username / handle not found.',
                })
            }
        } catch (e) {
            updatePlatform(platformKey, {
                loading: false,
                message: 'Network error. Is the backend running on port 4000?',
            })
        }
    }

    // ── Step 2: Check Submission ──
    const handleCheckSubmission = async (platformKey) => {
        const ps = platformState[platformKey]
        updatePlatform(platformKey, { loading: true, message: '', status: 'checking' })

        try {
            let result
            if (platformKey === 'leetcode') {
                result = await api.checkLeetCodeSubmission(ps.username.trim(), ps.startTime)
            } else {
                result = await api.checkCodeforcesSubmission(ps.username.trim(), ps.startTime)
            }

            if (result.success) {
                updatePlatform(platformKey, {
                    status: 'verified',
                    loading: false,
                    message: '✅ Verified successfully!',
                })
                api.savePlatformVerified(platformKey, ps.username.trim(), true, new Date().toISOString())
            } else {
                updatePlatform(platformKey, {
                    status: 'pending',   // keep the problem link visible
                    loading: false,
                    message: result.message || 'Submission not found yet. Try again after submitting.',
                })
            }
        } catch (e) {
            updatePlatform(platformKey, {
                status: 'pending',
                loading: false,
                message: 'Network error during check.',
            })
        }
    }

    // ── Reset a platform back to idle ──
    const handleReset = (platformKey) => {
        updatePlatform(platformKey, {
            status: 'idle', problemUrl: null, problemName: null, startTime: null, message: '', loading: false,
        })
    }

    const handleFinish = async () => {
        for (const [key, ps] of Object.entries(platformState)) {
            if (ps.status === 'verified' && ps.username.trim()) {
                try { await api.linkPlatform(key, ps.username.trim()) }
                catch (err) { console.error(`Failed to link ${key}:`, err) }
            }
        }
        navigate('/dashboard')
    }

    return (
        <div className="onboarding-page">
            <div className="onboarding-card">
                {/* Step indicator */}
                <div className="progress-bar-wrap">
                    <div className="progress-steps">
                        {STEPS.map((label, i) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <div className="progress-step">
                                    <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>
                                        {i < step ? '✓' : i + 1}
                                    </div>
                                    <span className="step-label">{label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`step-connector ${i < step ? 'done' : ''}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 0 — Skill Level */}
                {step === 0 && (
                    <>
                        <h2 className="onb-title">What's your current level?</h2>
                        <p className="onb-sub">We'll personalize your experience based on where you are now.</p>
                        <div className="skill-options">
                            {SKILLS.map(s => (
                                <div
                                    key={s.id}
                                    className={`skill-option ${skill === s.id ? 'selected' : ''}`}
                                    onClick={() => setSkill(s.id)}
                                    id={`skill-${s.id}`}
                                >
                                    <div className="skill-icon">{s.icon}</div>
                                    <div className="skill-name">{s.name}</div>
                                    <div className="skill-desc">{s.desc}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Step 1 — Platforms with Submission-based Verification */}
                {step === 1 && (
                    <>
                        <h2 className="onb-title">Verify your platforms</h2>
                        <p className="onb-sub">Prove account ownership by solving a quick problem. We'll check your recent submissions.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                            {PLATFORM_CONFIG.map(p => {
                                const ps = platformState[p.key]
                                return (
                                    <div key={p.key} style={{
                                        padding: 16, borderRadius: 12,
                                        border: ps.status === 'verified' ? '2px solid #22C55E' : '1px solid var(--border)',
                                        background: ps.status === 'verified' ? 'rgba(34,197,94,0.05)' : 'var(--bg-card)',
                                    }}>
                                        {/* Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <span style={{ fontWeight: 700, color: p.color, fontSize: 15 }}>{p.label}</span>
                                            {ps.status === 'verified' && (
                                                <span style={{
                                                    padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                                                    background: 'rgba(34,197,94,0.15)', color: '#22C55E',
                                                }}>✓ Verified</span>
                                            )}
                                            {(ps.status === 'pending' || ps.status === 'checking') && (
                                                <span style={{
                                                    padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                                                    background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
                                                }}>⏳ Pending</span>
                                            )}
                                        </div>

                                        {/* Idle: username input + Link button */}
                                        {ps.status === 'idle' && (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <input
                                                    id={`platform-${p.key}`}
                                                    type="text"
                                                    className="input-field"
                                                    placeholder={p.placeholder}
                                                    value={ps.username}
                                                    onChange={e => updatePlatform(p.key, { username: e.target.value })}
                                                    style={{ flex: 1 }}
                                                    disabled={ps.loading}
                                                />
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleInitiate(p.key)}
                                                    disabled={ps.loading || !ps.username.trim()}
                                                    style={{ whiteSpace: 'nowrap' }}
                                                >
                                                    {ps.loading ? '⏳...' : '🔗 Link'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Pending: show problem to solve + Check Submission button */}
                                        {(ps.status === 'pending' || ps.status === 'checking') && ps.problemUrl && (
                                            <div style={{ marginTop: 8 }}>
                                                <div style={{
                                                    background: 'var(--bg-tertiary)', borderRadius: 8,
                                                    padding: 12, fontSize: 13, marginBottom: 10,
                                                    border: '1px solid var(--border-subtle, var(--border))',
                                                }}>
                                                    <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                                                        Solve this problem to verify your account:
                                                    </div>
                                                    <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                                                        1. Open the problem link below and submit any solution (any language)
                                                    </div>
                                                    <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                                                        2. Come back here and click "Check Submission"
                                                    </div>
                                                    <a
                                                        href={ps.problemUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '6px 12px', borderRadius: 6,
                                                            background: 'rgba(99,102,241,0.1)',
                                                            color: '#6366F1', fontWeight: 700,
                                                            fontSize: 13, textDecoration: 'none',
                                                        }}
                                                    >
                                                        🔗 {ps.problemName || 'Open Problem'}
                                                    </a>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                                                        ⚠️ You must submit after clicking "Link" — we check submissions from that moment onward.
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleCheckSubmission(p.key)}
                                                        disabled={ps.loading}
                                                        style={{ flex: 1 }}
                                                    >
                                                        {ps.loading ? '⏳ Checking...' : '✓ Check Submission'}
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleReset(p.key)}
                                                        disabled={ps.loading}
                                                    >
                                                        ↩ Reset
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Verified */}
                                        {ps.status === 'verified' && (
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                @{ps.username} — account ownership confirmed
                                            </div>
                                        )}

                                        {/* Error / info messages */}
                                        {ps.message && (
                                            <div style={{
                                                marginTop: 8, fontSize: 12, fontWeight: 600,
                                                color: ps.status === 'verified' ? '#22C55E' : '#EF4444',
                                            }}>
                                                {ps.message}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                            ✓ Verify at least one platform to continue
                        </p>
                    </>
                )}

                {/* Step 2 — Companies */}
                {step === 2 && (
                    <>
                        <h2 className="onb-title">Target companies</h2>
                        <p className="onb-sub">Select companies you're targeting. We'll tailor problem recommendations accordingly.</p>
                        <div className="companies-grid">
                            {COMPANIES.map(c => (
                                <div
                                    key={c}
                                    id={`company-${c.replace(/\s/g, '-').toLowerCase()}`}
                                    className={`company-chip ${selectedCompanies.includes(c) ? 'selected' : ''}`}
                                    onClick={() => toggleCompany(c)}
                                >
                                    {c}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, gap: 12 }}>
                    {step > 0 ? (
                        <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>
                            ← Back
                        </button>
                    ) : <div />}

                    {step < STEPS.length - 1 ? (
                        <button
                            id="onb-next"
                            className="btn btn-primary"
                            disabled={!canProceed()}
                            onClick={() => setStep(s => s + 1)}
                            style={{ opacity: canProceed() ? 1 : 0.5 }}
                        >
                            Continue →
                        </button>
                    ) : (
                        <button
                            id="onb-finish"
                            className="btn btn-primary"
                            disabled={!canProceed()}
                            onClick={handleFinish}
                            style={{ opacity: canProceed() ? 1 : 0.5 }}
                        >
                            🚀 Finish Setup
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
