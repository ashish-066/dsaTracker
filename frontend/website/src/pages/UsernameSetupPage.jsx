import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../services/api'

export default function UsernameSetupPage() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [status, setStatus] = useState({ state: 'idle', msg: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const setCleanUsername = value => {
        setUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
        setStatus({ state: 'idle', msg: '' })
    }

    useEffect(() => {
        if (!api.isAuthenticated()) {
            navigate('/login', { replace: true })
            return
        }
        api.fetchMe().then(r => {
            if (r.ok && r.data?.username) navigate('/dashboard', { replace: true })
        })
    }, [navigate])

    useEffect(() => {
        const u = username.trim()
        if (!u || !/^[a-z0-9_]{3,30}$/.test(u)) return

        const timer = setTimeout(async () => {
            setStatus({ state: 'checking', msg: 'Checking...' })
            const r = await api.checkUsernameAvailable(u)
            setStatus(r.available
                ? { state: 'ok', msg: '@' + u + ' is available' }
                : { state: 'bad', msg: r.reason || 'Not available' })
        }, 350)
        return () => clearTimeout(timer)
    }, [username])

    const save = async e => {
        e.preventDefault()
        setError('')
        if (status.state !== 'ok') {
            setError('Please choose an available username first.')
            return
        }
        setLoading(true)
        const r = await api.updateMyUsername(username.trim().toLowerCase())
        setLoading(false)
        if (!r.ok) {
            setError(r.error || 'Could not save username')
            return
        }
        api.setUsername(r.data.username)
        navigate('/onboarding', { replace: true })
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
                    Friends, challenges, follows, and community posts use this public handle.
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
                        x {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={save}>
                    <div className="input-group">
                        <label className="input-label">Username</label>
                        <div className="input-with-icon">
                            <span className="input-icon">@</span>
                            <input
                                className="input-field"
                                placeholder="your_handle"
                                value={username}
                                onChange={e => setCleanUsername(e.target.value)}
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
                                    status.state === 'bad' || !/^[a-z0-9_]{3,30}$/.test(username) ? 'var(--rose)' :
                                    'var(--text-muted)',
                            }}>
                                {/^[a-z0-9_]{3,30}$/.test(username)
                                    ? status.msg
                                    : 'Lowercase letters, digits, underscores. 3-30 chars.'}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        style={{ padding: '12px', fontSize: 15 }}
                        disabled={loading || status.state !== 'ok'}
                    >
                        {loading ? 'Saving...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    )
}
