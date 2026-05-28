import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as api from '../services/api'

export default function CompleteUsernamePage() {
    const navigate = useNavigate()
    const location = useLocation()
    const nextPath = location.state?.next || '/onboarding'
    const [username, setUsername] = useState('')
    const [status, setStatus] = useState({ state: 'idle', msg: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleUsernameInput = e => {
        const next = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
        setUsername(next)
        if (!next) {
            setStatus({ state: 'idle', msg: '' })
        } else if (!/^[a-z0-9_]{3,30}$/.test(next)) {
            setStatus({ state: 'bad', msg: 'Lowercase letters, digits, underscores. 3-30 chars.' })
        } else {
            setStatus({ state: 'checking', msg: 'Checking...' })
        }
    }

    useEffect(() => {
        const u = username.trim()
        if (!/^[a-z0-9_]{3,30}$/.test(u)) return
        const timer = setTimeout(async () => {
            const r = await api.checkUsernameAvailable(u)
            if (r.available) setStatus({ state: 'ok', msg: '@' + u + ' is available' })
            else setStatus({ state: 'bad', msg: r.reason || 'Not available' })
        }, 350)
        return () => clearTimeout(timer)
    }, [username])

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        if (status.state !== 'ok') {
            setError('Please choose an available username first')
            return
        }
        setLoading(true)
        const result = await api.updateMyUsername(username.trim().toLowerCase())
        setLoading(false)
        if (!result.ok) {
            setError(result.error || 'Could not save username')
            return
        }
        api.setUsername(result.data.username)
        api.syncAllPlatforms().catch(() => {})
        navigate(nextPath)
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="sidebar-logo-icon">A</div>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>
                        Algo<span className="accent-italic" style={{ fontWeight: 600 }}>Sprint</span>
                    </span>
                </div>
                <div className="accent-hand" style={{ color: 'var(--amber)', fontSize: 18, marginBottom: 4, transform: 'rotate(-2deg)', display: 'inline-block' }}>
                    one last thing
                </div>
                <h1 className="auth-title">
                    Pick your <span className="accent-italic">username</span>.
                </h1>
                <p className="auth-sub">
                    Friends will use this handle to find you for follows and challenges.
                </p>

                {error && (
                    <div style={{
                        background: 'var(--danger-light)',
                        color: 'var(--rose)',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '16px',
                        fontSize: '14px',
                        border: '1px dashed rgba(216,139,168,0.35)',
                    }}>
                        {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={submit}>
                    <div className="input-group">
                        <label className="input-label" htmlFor="google-username">Username</label>
                        <div className="input-with-icon">
                            <span className="input-icon">@</span>
                            <input
                                id="google-username"
                                type="text"
                                className="input-field"
                                placeholder="your_handle"
                                value={username}
                                onChange={handleUsernameInput}
                                required
                                autoComplete="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                maxLength={30}
                            />
                        </div>
                        {username && (
                            <div style={{
                                fontSize: 12,
                                marginTop: 4,
                                color:
                                    status.state === 'ok' ? 'var(--sage)' :
                                    status.state === 'bad' ? 'var(--rose)' :
                                    'var(--text-muted)',
                            }}>
                                {status.msg}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        style={{ padding: '12px', fontSize: 15, marginTop: 4 }}
                        disabled={loading || status.state !== 'ok'}
                    >
                        {loading ? 'Saving...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    )
}
