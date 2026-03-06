import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../services/api'

export default function SignupPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const set = field => e => setForm({ ...form, [field]: e.target.value })

    const handleSubmit = async e => {
        e.preventDefault()
        setError('')

        if (form.password !== form.confirm) {
            setError('Passwords do not match')
            return
        }

        if (form.password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setLoading(true)

        try {
            const result = await api.register(form.name, form.email, form.password)
            if (result.success) {
                setLoading(false)
                navigate('/onboarding')
            } else {
                setError(result.error || 'Registration failed. Please try again.')
                setLoading(false)
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="sidebar-logo-icon">A</div>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>
                        Algo<span style={{ color: 'var(--text-accent)' }}>Ledger</span>
                    </span>
                </div>

                <h1 className="auth-title">Create account</h1>
                <p className="auth-sub">Join 3,200+ students tracking their DSA progress.</p>

                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '14px',
                        border: '1px solid #fecaca'
                    }}>
                        {error}
                    </div>
                )}

                <button className="google-btn" style={{ marginBottom: 16 }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
                        <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.101-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                    </svg>
                    Sign up with Google
                </button>

                <div className="auth-divider">or</div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <div className="input-with-icon">
                            <span className="input-icon">👤</span>
                            <input
                                id="name"
                                type="text"
                                className="input-field"
                                placeholder="Rahul Sharma"
                                value={form.name}
                                onChange={set('name')}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Email address</label>
                        <div className="input-with-icon">
                            <span className="input-icon">✉</span>
                            <input
                                id="signup-email"
                                type="email"
                                className="input-field"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={set('email')}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div className="input-with-icon">
                            <span className="input-icon">🔒</span>
                            <input
                                id="signup-password"
                                type="password"
                                className="input-field"
                                placeholder="Min. 8 characters"
                                value={form.password}
                                onChange={set('password')}
                                required
                                minLength={8}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Confirm Password</label>
                        <div className="input-with-icon">
                            <span className="input-icon">🔒</span>
                            <input
                                id="confirm-password"
                                type="password"
                                className="input-field"
                                placeholder="Repeat your password"
                                value={form.confirm}
                                onChange={set('confirm')}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        id="signup-submit"
                        className="btn btn-primary w-full"
                        style={{ padding: '12px', fontSize: 15, marginTop: 4 }}
                        disabled={loading}
                    >
                        {loading ? '⏳ Creating account...' : 'Create Account →'}
                    </button>
                </form>

                <p className="auth-switch" style={{ marginTop: 20 }}>
                    Already have an account?{' '}
                    <a href="#" onClick={e => { e.preventDefault(); navigate('/login') }}>
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    )
}
