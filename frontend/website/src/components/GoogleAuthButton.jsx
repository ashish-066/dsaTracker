import { useEffect, useRef, useState } from 'react'

const GOOGLE_SCRIPT_ID = 'google-identity-services'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_CONFIG_ERROR = GOOGLE_CLIENT_ID ? '' : 'Google sign-in is not configured'

function loadGoogleScript() {
    if (typeof window === 'undefined') return Promise.reject(new Error('Google sign-in is unavailable'))
    if (window.google?.accounts?.id) return Promise.resolve()

    return new Promise((resolve, reject) => {
        const existing = document.getElementById(GOOGLE_SCRIPT_ID)
        if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true })
            existing.addEventListener('error', () => reject(new Error('Could not load Google sign-in')), { once: true })
            return
        }

        const script = document.createElement('script')
        script.id = GOOGLE_SCRIPT_ID
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Could not load Google sign-in'))
        document.head.appendChild(script)
    })
}

export default function GoogleAuthButton({ label = 'Continue with Google', onCredential, disabled = false }) {
    const hostRef = useRef(null)
    const [ready, setReady] = useState(false)
    const [loadError, setLoadError] = useState(GOOGLE_CONFIG_ERROR)

    useEffect(() => {
        let cancelled = false
        if (!GOOGLE_CLIENT_ID) return

        loadGoogleScript()
            .then(() => {
                if (cancelled || !hostRef.current) return
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: response => {
                        if (response?.credential) onCredential(response.credential)
                    },
                })
                window.google.accounts.id.renderButton(hostRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: hostRef.current.offsetWidth || 320,
                    text: label.toLowerCase().includes('sign up') ? 'signup_with' : 'continue_with',
                })
                setReady(true)
            })
            .catch(err => {
                if (!cancelled) setLoadError(err.message || 'Could not load Google sign-in')
            })

        return () => { cancelled = true }
    }, [label, onCredential])

    if (loadError) {
        return (
            <button type="button" className="google-btn" disabled title={loadError}>
                {label}
            </button>
        )
    }

    return (
        <div className={disabled ? 'google-auth-disabled' : ''} aria-busy={!ready || disabled}>
            <div ref={hostRef} className="google-auth-host" />
        </div>
    )
}
