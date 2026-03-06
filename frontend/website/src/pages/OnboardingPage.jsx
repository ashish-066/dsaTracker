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

export default function OnboardingPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [skill, setSkill] = useState(null)
    const [platforms, setPlatforms] = useState({ leetcode: '', codeforces: '', gfg: '' })
    const [selectedCompanies, setSelectedCompanies] = useState([])
    const [validatingLeetCode, setValidatingLeetCode] = useState(false)
    const [leetCodeError, setLeetCodeError] = useState('')
    const [submissions, setSubmissions] = useState([])

    useEffect(() => {
        // Check authentication
        if (!api.isAuthenticated()) {
            navigate('/login')
        }
    }, [navigate])

    const toggleCompany = c => {
        setSelectedCompanies(prev =>
            prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
        )
    }

    const canProceed = () => {
        if (step === 0) return !!skill
        if (step === 1) return Object.values(platforms).some(v => v.trim()) && !leetCodeError
        return selectedCompanies.length > 0
    }

    const validateLeetCode = async () => {
        if (!platforms.leetcode.trim()) return

        setValidatingLeetCode(true)
        setLeetCodeError('')

        try {
            const result = await api.verifyLeetCodeUsername(platforms.leetcode)
            if (result.valid) {
                setSubmissions(result.data?.submissions || [result.data])
                setLeetCodeError('')
            } else {
                setLeetCodeError(result.error || 'LeetCode username not found')
                setSubmissions([])
            }
        } catch (err) {
            setLeetCodeError('Error validating LeetCode username')
            setSubmissions([])
        } finally {
            setValidatingLeetCode(false)
        }
    }

    const handleLeetCodeChange = (value) => {
        setPlatforms({ ...platforms, leetcode: value })
        setLeetCodeError('')
        setSubmissions([])
    }

    const handleFinish = async () => {
        // Add LeetCode to backend if username is provided and validated
        if (platforms.leetcode && !leetCodeError) {
            try {
                await api.addLeetCode(platforms.leetcode)
            } catch (err) {
                console.error('Failed to add LeetCode:', err)
            }
        }

        // Store all platform preferences
        localStorage.setItem('algoledger_platforms', JSON.stringify(platforms))
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

                {/* Step 1 — Platforms */}
                {step === 1 && (
                    <>
                        <h2 className="onb-title">Connect your platforms</h2>
                        <p className="onb-sub">Add your usernames so we can pull your problem history automatically.</p>
                        <div className="platform-inputs">
                            {[
                                { key: 'leetcode', label: 'LeetCode', color: '#FFA116', placeholder: 'rahul_codes' },
                                { key: 'codeforces', label: 'Codeforces', color: '#1890FF', placeholder: 'rahul_cf' },
                                { key: 'gfg', label: 'GeeksforGeeks', color: '#22C55E', placeholder: 'rahul_gfg' },
                            ].map(p => (
                                <div key={p.key}>
                                    <div className="platform-input-row">
                                        <div className="platform-label" style={{ color: p.color }}>
                                            {p.label}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                                            <input
                                                id={`platform-${p.key}`}
                                                type="text"
                                                className="input-field"
                                                placeholder={p.placeholder}
                                                value={platforms[p.key]}
                                                onChange={e => {
                                                    if (p.key === 'leetcode') {
                                                        handleLeetCodeChange(e.target.value)
                                                    } else {
                                                        setPlatforms({ ...platforms, [p.key]: e.target.value })
                                                    }
                                                }}
                                                style={{ flex: 1 }}
                                            />
                                            {p.key === 'leetcode' && platforms.leetcode && (
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={validateLeetCode}
                                                    disabled={validatingLeetCode}
                                                    style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
                                                >
                                                    {validatingLeetCode ? '⏳' : '✓'} Verify
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* LeetCode error message */}
                                    {p.key === 'leetcode' && leetCodeError && (
                                        <div style={{
                                            color: '#dc2626',
                                            fontSize: '12px',
                                            marginTop: '6px',
                                            marginLeft: '4px'
                                        }}>
                                            ⚠️ {leetCodeError}
                                        </div>
                                    )}

                                    {/* LeetCode success - show recent submissions */}
                                    {p.key === 'leetcode' && submissions.length > 0 && (
                                        <div style={{
                                            color: '#16a34a',
                                            fontSize: '12px',
                                            marginTop: '6px',
                                            marginLeft: '4px'
                                        }}>
                                            ✓ Found {submissions.length} recent submissions
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                            ✓ Add at least one platform to continue
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
