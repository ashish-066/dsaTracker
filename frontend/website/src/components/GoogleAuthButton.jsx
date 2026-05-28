import { useEffect, useRef, useState } from 'react'
import * as api from '../services/api'

const GOOGLE_SCRIPT_ID = 'google-identity-services'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function loadGoogleScript() {
    if (window.google?.accounts?.id) return Promise.resolve()
    return new Promise((resolve, reject) => {
        const existing = document.getElementById(GOOGLE_SCRIPT_ID)
        if (existing) {
            existing.addEventListener('load', resolve, { once: true })
            existing.addEventListener('error', reject, { once: true })
            return
        }
        const script = document.createElement('script')
        script.id = GOOGLE_SCRIPT_ID
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
    })
}

export default function GoogleAuthButton({ label = 'Continue with Google', onSuccess, onError }) {
    const buttonRef = useRef(null)
    const onSuccessRef = useRef(onSuccess)
    const onErrorRef = useRef(onError)
    const [ready, setReady] = useState(false)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        onSuccessRef.current = onSuccess
        onErrorRef.current = onError
    }, [onSuccess, onError])

    useEffect(() => {
        let cancelled = false
        if (!GOOGLE_CLIENT_ID) return
        loadGoogleScript()
            .then(() => {
                if (cancelled) return
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: async ({ credential }) => {
                        if (!credential) {
                            onErrorRef.current?.('Google did not return a credential')
                            return
                        }
                        setBusy(true)
                        const result = await api.loginWithGoogle(credential)
                        setBusy(false)
                        if (result.ok) onSuccessRef.current?.(result.data)
                        else onErrorRef.current?.(result.error || 'Google sign-in failed')
                    },
                })
                if (buttonRef.current) {
                    buttonRef.current.innerHTML = ''
                    window.google.accounts.id.renderButton(buttonRef.current, {
                        type: 'standard',
                        theme: 'outline',
                        size: 'large',
                        text: label.toLowerCase().includes('sign up') ? 'signup_with' : 'continue_with',
                        shape: 'rectangular',
                        width: buttonRef.current.offsetWidth || 320,
                    })
                }
                setReady(true)
            })
            .catch(() => onErrorRef.current?.('Could not load Google sign-in'))
        return () => {
            cancelled = true
        }
    }, [label])

    if (!GOOGLE_CLIENT_ID) {
        return (
            <button type="button" className="google-btn" disabled title="VITE_GOOGLE_CLIENT_ID is not configured">
                {label}
            </button>
        )
    }

    return (
        <div className="google-auth-wrap" aria-busy={busy || !ready}>
            <div ref={buttonRef} />
            {(busy || !ready) && (
                <div className="google-auth-status">
                    {busy ? 'Signing in with Google...' : 'Loading Google sign-in...'}
                </div>
            )}
        </div>
    )
}
