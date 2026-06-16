/**
 * OnboardingPage.jsx (Updated)
 * ──────────────────────────────
 * Multi-step onboarding with proof-of-ownership verification.
 * Now integrated with the tour feature - tour will start automatically
 * after onboarding completes on the dashboard.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../services/api'
import { useTour } from '../tour/TourContext'

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
    const { startTour } = useTour()
    const [step, setStep] = useState(0)
    const [skill, setSkill] = useState(null)
    const [selectedCompanies, setSelectedCompanies] = useState([])

    // Platform verification state.
    //   status = 'idle'      → user is typing a handle
    //            'pending'   → server picked a problem; waiting on the user
    //                          to submit it on the real platform
    //            'checking'  → we're polling the platform's recent submissions
    //            'verified'  → proof accepted
    const [platformState, setPlatformState] = useState({
        leetcode: {
            username: '', status: 'idle', problemUrl: null, problemName: null,
            problemSlug: null, startTime: null, message: '', loading: false,
        },
        codeforces: {
            username: '', status: 'idle', problemUrl: null, problemName: null,
            problemSlug: null, startTime: null, message: '', loading: false,
        },
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

    // ── Step 1: tell the backend which handle we want to verify; it confirms
    //           the account exists, picks a problem, and hands us a startTime. ──
    const handleStart = async (platformKey) => {
        const ps = platformState[platformKey]
        const handle = ps.username.trim()
        if (!handle) {
            updatePlatform(platformKey, { message: 'Please enter a username first.' })
            return
        }
        updatePlatform(platformKey, { loading: true, message: '' })
        try {
            const r = await api.verifyStart(platformKey, handle)
            if (r.success) {
                updatePlatform(platformKey, {
                    status: 'pending',
                    problemSlug: r.data.problemSlug,
                    problemName: r.data.problemName,
                    problemUrl:  r.data.problemUrl,
                    startTime:   r.data.startTime,
                    loading: false,
                    message: '',
                })
            } else {
                updatePlatform(platformKey, {
                    loading: false,
                    message: r.message || "Couldn't find that account. Check the spelling.",
                })
            }
        } catch (e) {
            updatePlatform(platformKey, {
                loading: false,
                message: "Couldn't reach the verification service. Please try again in a moment.",
            })
        }
    }

    // ── Step 2: check the platform's recent submissions for proof of ownership. ──
    const handleCheck = async (platformKey) => {
        const ps = platformState[platformKey]
        if (!ps.problemSlug || !ps.startTime) return
        updatePlatform(platformKey, { loading: true, message: '', status: 'checking' })
        try {
            const r = await api.verifyCheck(platformKey, ps.username.trim(), ps.problemSlug, ps.startTime)
            if (r.success) {
                updatePlatform(platformKey, {
                    status: 'verified',
                    loading: false,
                    message: '✅ Ownership confirmed!',
                })
                api.savePlatformVerified(platformKey, ps.username.trim(), true, new Date().toISOString())
            } else {
                // Not found yet — stay in 'pending' so the Check button and
                // problem link remain visible and the user can retry.
                updatePlatform(platformKey, {
                    status: 'pending',
                    loading: false,
                    message: r.message || "Submission not found yet. Try again after you submit.",
                })
            }
        } catch (e) {
            updatePlatform(platformKey, {
                status: 'pending',
                loading: false,
                message: 'Network error during check. Try again.',
            })
        }
    }

    // ── Reset a platform back to idle (lets the user try a different handle). ──
    const handleReset = (platformKey) => {
        updatePlatform(platformKey, {
            status: 'idle', problemUrl: null, problemName: null, problemSlug: null,
            startTime: null, message: '', loading: false,
        })
    }

    // ── Finish onboarding and redirect to dashboard
    // The tour will start automatically on the dashboard via useEffect
    const handleFinish = async () => {
        try {
            // Save onboarding data to backend
            await api.completeOnboarding({
                skillLevel: skill,
                selectedCompanies,
                platforms: Object.keys(platformState).reduce((acc, key) => {
                    if (platformState[key].status === 'verified') {
                        acc[key] = {
                            username: platformState[key].username,
                            verified: true,
                        }
                    }
                    return acc
                }, {}),
            })

            // Mark tour as not completed so it starts fresh
            localStorage.removeItem('algoSprint_tourCompleted')

            // Navigate to dashboard - tour will start there
            navigate('/dashboard')

            // Start tour on next tick to ensure component mounted
            setTimeout(() => {
                startTour()
            }, 500)
        } catch (err) {
            console.error('Error completing onboarding:', err)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '500px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '40px',
            }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                        Let's Get Started
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
                        Tell us about yourself so we can personalize your experience
                    </p>
                </div>

                {/* Progress indicator */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
                    {STEPS.map((s, i) => (
                        <div
                            key={i}
                            style={{
                                height: 8,
                                flex: 1,
                                maxWidth: 100,
                                borderRadius: 4,
                                background: i < step ? 'var(--primary-color)' : i === step ? 'var(--primary-color)' : 'var(--bg-tertiary)',
                                transition: 'all 0.3s ease',
                            }}
                        />
                    ))}
                </div>

                {/* Step content */}
                {step === 0 && (
                    <>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
                            What's your skill level?
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
                            {SKILLS.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setSkill(s.id)}
                                    style={{
                                        padding: '16px',
                                        border: skill === s.id ? '2px solid var(--primary-color)' : '1px solid var(--border)',
                                        background: skill === s.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = e.currentTarget.style.background === 'rgba(59, 130, 246, 0.1)' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-tertiary)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = skill === s.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)'
                                    }}
                                >
                                    <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{s.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.desc}</div>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {step === 1 && (
                    <>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                            Connect your accounts
                        </h2>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
                            Verify at least one platform to continue. We'll sync your problem history.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 30 }}>
                            {PLATFORM_CONFIG.map(p => {
                                const ps = platformState[p.key]
                                return (
                                    <div key={p.key}>
                                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                                            {p.label}
                                        </label>

                                        {ps.status === 'idle' && (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <input
                                                    type="text"
                                                    placeholder={p.placeholder}
                                                    value={ps.username}
                                                    onChange={e => updatePlatform(p.key, { username: e.target.value })}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px 12px',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '8px',
                                                        background: 'var(--bg-primary)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: 13,
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleStart(p.key)}
                                                    disabled={ps.loading}
                                                    style={{
                                                        padding: '10px 16px',
                                                        background: p.color,
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontWeight: 600,
                                                        fontSize: 13,
                                                        cursor: ps.loading ? 'not-allowed' : 'pointer',
                                                        opacity: ps.loading ? 0.7 : 1,
                                                    }}
                                                >
                                                    {ps.loading ? '⏳' : '🔗'}
                                                </button>
                                            </div>
                                        )}

                                        {(ps.status === 'pending' || ps.status === 'checking') && ps.problemUrl && (
                                            <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8, border: '1px dashed var(--border)', marginBottom: 10 }}>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                                    Verify your account by solving this problem:
                                                </div>
                                                <a
                                                    href={ps.problemUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-block',
                                                        padding: '6px 12px',
                                                        background: p.color,
                                                        color: 'white',
                                                        borderRadius: 6,
                                                        textDecoration: 'none',
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        marginBottom: 10,
                                                    }}
                                                >
                                                    {ps.problemName}
                                                </a>
                                                <button
                                                    onClick={() => handleCheck(p.key)}
                                                    disabled={ps.loading}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        background: 'var(--primary-color)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        cursor: ps.loading ? 'not-allowed' : 'pointer',
                                                    }}
                                                >
                                                    {ps.loading ? '⏳ Checking...' : '✓ Check Submission'}
                                                </button>
                                            </div>
                                        )}

                                        {ps.status === 'verified' && (
                                            <div style={{
                                                padding: '10px 12px',
                                                background: 'rgba(16, 185, 129, 0.1)',
                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                                borderRadius: '8px',
                                                color: '#10b981',
                                                fontSize: 12,
                                                fontWeight: 600,
                                            }}>
                                                ✅ Verified as @{ps.username}
                                            </div>
                                        )}

                                        {ps.message && (
                                            <div style={{ fontSize: 12, color: ps.status === 'verified' ? '#10b981' : '#ef4444', marginTop: 6 }}>
                                                {ps.message}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                            Target companies
                        </h2>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                            Select companies you're targeting. We'll tailor recommendations accordingly.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 30 }}>
                            {COMPANIES.map(c => (
                                <button
                                    key={c}
                                    onClick={() => toggleCompany(c)}
                                    style={{
                                        padding: '12px',
                                        border: selectedCompanies.includes(c) ? '2px solid var(--primary-color)' : '1px solid var(--border)',
                                        background: selectedCompanies.includes(c) ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)',
                                        fontWeight: 600,
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!selectedCompanies.includes(c)) {
                                            e.currentTarget.style.background = 'var(--bg-tertiary)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = selectedCompanies.includes(c) ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)'
                                    }}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Navigation buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                    <button
                        onClick={() => setStep(s => Math.max(0, s - 1))}
                        disabled={step === 0}
                        style={{
                            padding: '12px 20px',
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            cursor: step === 0 ? 'not-allowed' : 'pointer',
                            opacity: step === 0 ? 0.5 : 1,
                        }}
                    >
                        ← Back
                    </button>

                    <button
                        onClick={() => {
                            if (step < STEPS.length - 1) {
                                setStep(s => s + 1)
                            } else {
                                handleFinish()
                            }
                        }}
                        disabled={!canProceed()}
                        style={{
                            padding: '12px 20px',
                            background: 'var(--primary-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: canProceed() ? 'pointer' : 'not-allowed',
                            opacity: canProceed() ? 1 : 0.5,
                        }}
                    >
                        {step < STEPS.length - 1 ? 'Continue →' : '🚀 Get Started'}
                    </button>
                </div>

            </div>
        </div>
    )
}