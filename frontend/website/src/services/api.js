/**
 * API Service Layer — Spring Boot Backend (port 8080) ONLY
 * No mock API support - all calls go to real backend
 */

// Read from Vite's build-time env (`VITE_API_BASE`) on the deployed frontend;
// fall through to localhost:8080 for local dev with `npm run dev`.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

// ── One-shot legacy-session cleanup ────────────────────────────────────────

;(function migrateLegacyAuth() {
    if (typeof window === 'undefined') return
    try {
        if (localStorage.getItem('jwt_token') != null) {
            try {
                const doomed = []
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i)
                    if (k && k.startsWith('algoledger:cache:')) doomed.push(k)
                }
                doomed.forEach(k => localStorage.removeItem(k))
            } catch { /* ignore */ }
            localStorage.removeItem('jwt_token')
            localStorage.removeItem('jwt_email')
            localStorage.removeItem('jwt_name')
            localStorage.removeItem('jwt_username')
            localStorage.removeItem('algoledger_platforms')
        }
    } catch { /* ignore — better to load app than crash on storage error */ }
})()

/* ── Auth state — JWT lives in an HttpOnly cookie now ── */

export function getJWTToken() { return null }
export function setJWTToken() { /* no-op: cookie is set by the server */ }

export function setUserEmail(email) { localStorage.setItem('jwt_email', email) }
export function getUserEmail() { return localStorage.getItem('jwt_email') }
export function setUserName(name) { localStorage.setItem('jwt_name', name) }
export function getUserName() { return localStorage.getItem('jwt_name') || '' }
export function setUsername(u) { if (u) localStorage.setItem('jwt_username', u); else localStorage.removeItem('jwt_username') }
export function getUsername() { return localStorage.getItem('jwt_username') || '' }

export function clearAuth() {
    try { clearAllCache() } catch { /* ignore */ }
    try {
        fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
            .catch(() => {})
    } catch { /* ignore */ }
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('jwt_email')
    localStorage.removeItem('jwt_name')
    localStorage.removeItem('jwt_username')
    localStorage.removeItem('algoledger_platforms')
    try {
        import('../utils/profilePic').then(m => m.clearProfilePic()).catch(() => {})
    } catch { /* ignore */ }
}

export function isAuthenticated() {
    return !!getUserEmail()
}

/** Authenticated fetch wrapper — sends the HttpOnly auth cookie automatically. */
async function authFetch(path, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    }
    return fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        credentials: 'include', // send the auth cookie
    })
}

/** Convenience: authenticated fetch that parses JSON and returns {ok, data, error} */
export async function authFetchJson(path, options = {}) {
    try {
        const res = await authFetch(path, options)

        // If token expired / invalid, backend returns JSON 401
        if (res.status === 401) {
            const body = await res.text()
            let errMsg = 'Session expired. Please log in again.'
            try { errMsg = JSON.parse(body)?.error || errMsg } catch (_) { /* ignore */ }
            clearAuth()
            window.location.href = '/login'
            return { ok: false, error: errMsg }
        }

        const text = await res.text()
        if (!text) return { ok: false, error: `HTTP ${res.status} (empty response)` }
        let data
        try { data = JSON.parse(text) } catch (_) {
            return { ok: false, error: `HTTP ${res.status}: unexpected response format` }
        }
        if (res.ok) return { ok: true, data }
        return { ok: false, error: data?.error || data?.message || `HTTP ${res.status}` }
    } catch (e) {
        return { ok: false, error: e.message }
    }
}

/* ── localStorage helpers (for UI state only) ── */

const STORAGE_KEY = 'algoledger_platforms'

export function getLinkedPlatforms() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch { return {} }
}

export function savePlatforms(platforms) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(platforms))
}

export function hasLinkedPlatforms() {
    return Object.keys(getLinkedPlatforms()).length > 0
}

/** Save a single platform with verification status */
export function savePlatformVerified(platform, username, verified, verifiedAt) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    data[platform] = { username, verified, verifiedAt }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Get full platform data including verification status.
 */
export function getLinkedPlatformsFull() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
        const result = {}
        for (const [k, v] of Object.entries(data)) {
            if (typeof v === 'string' && v.trim()) {
                result[k] = { username: v.trim(), verified: false, verifiedAt: null }
            } else if (typeof v === 'object' && v?.username) {
                result[k] = { username: v.username, verified: !!v.verified, verifiedAt: v.verifiedAt || null }
            }
        }
        return result
    } catch { return {} }
}

/* ── Platform ownership verification ── */

/** Step 1 — confirm handle exists and receive the target problem. */
export async function verifyStart(platform, handle) {
    const r = await authFetchJson('/api/verify/start', {
        method: 'POST',
        body: JSON.stringify({ platform, handle }),
    })
    if (r.ok) {
        return {
            success: true,
            data: {
                problemSlug: r.data.problemSlug,
                problemName: r.data.problemName,
                problemUrl:  r.data.problemUrl,
                startTime:   r.data.startTime,
            },
        }
    }
    return { success: false, message: r.error || 'Verification failed to start' }
}

/** Step 2 — confirm the user submitted the target problem after startTime. */
export async function verifyCheck(platform, handle, problemSlug, startTime) {
    const r = await authFetchJson('/api/verify/check', {
        method: 'POST',
        body: JSON.stringify({ platform, handle, problemSlug, startTime }),
    })
    if (r.ok && r.data.verified) return { success: true }
    return {
        success: false,
        message: r.error || 'Verification failed',
    }
}

export async function completeOnboarding(data) {
    const r = await authFetchJson('/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify(data),
    })
    if (r.ok) return { success: true }
    return { success: false, message: r.error || 'Failed to complete onboarding' }
}

/* ── Cache helpers for reducing API calls ── */

function getCacheKey(email, endpoint) {
    return `algoledger:cache:${email}:${endpoint}`
}

export function clearAllCache() {
    const email = getUserEmail()
    if (!email) return
    try {
        const doomed = []
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (k && k.startsWith(`algoledger:cache:${email}:`)) doomed.push(k)
        }
        doomed.forEach(k => localStorage.removeItem(k))
    } catch { /* ignore */ }
}

export function setCacheEntry(endpoint, data, ttlSeconds = 300) {
    const email = getUserEmail()
    if (!email) return
    const key = getCacheKey(email, endpoint)
    const envelope = {
        data,
        expires: Date.now() + ttlSeconds * 1000,
    }
    try {
        localStorage.setItem(key, JSON.stringify(envelope))
    } catch { /* ignore storage quota errors */ }
}

export function getCacheEntry(endpoint) {
    const email = getUserEmail()
    if (!email) return null
    const key = getCacheKey(email, endpoint)
    try {
        const text = localStorage.getItem(key)
        if (!text) return null
        const envelope = JSON.parse(text)
        if (Date.now() > envelope.expires) {
            localStorage.removeItem(key)
            return null
        }
        return envelope.data
    } catch { return null }
}

/* ── Dashboard Stats ── */

export async function getDashboardStats() {
    const cached = getCacheEntry('dashboard')
    if (cached) return { ok: true, data: cached }

    const r = await authFetchJson('/api/platforms/dashboard')
    if (r.ok) {
        setCacheEntry('dashboard', r.data, 600)
        return r
    }
    return r
}

/* ── Missions / Practice ── */

export async function getMissions() {
    const cached = getCacheEntry('missions')
    if (cached) return { ok: true, data: cached }

    const r = await authFetchJson('/api/missions')
    if (r.ok) {
        setCacheEntry('missions', r.data, 600)
        return r
    }
    return r
}

/* ── Community ── */

export async function getCommunityPosts(limit = 10, offset = 0) {
    const r = await authFetchJson(`/api/community/posts?limit=${limit}&offset=${offset}`)
    return r
}

export async function getCommunityPost(postId) {
    const r = await authFetchJson(`/api/community/posts/${postId}`)
    return r
}

export async function createCommunityPost(content, topic) {
    const r = await authFetchJson('/api/community/posts', {
        method: 'POST',
        body: JSON.stringify({ content, topic }),
    })
    return r
}

export async function likeCommunityPost(postId) {
    const r = await authFetchJson(`/api/community/posts/${postId}/like`, {
        method: 'POST',
    })
    return r
}

export async function unlikeCommunityPost(postId) {
    const r = await authFetchJson(`/api/community/posts/${postId}/unlike`, {
        method: 'POST',
    })
    return r
}

/* ── Contests ── */

export async function getContests() {
    const cached = getCacheEntry('contests')
    if (cached) return { ok: true, data: cached }

    const r = await authFetchJson('/api/contests')
    if (r.ok) {
        setCacheEntry('contests', r.data, 3600)
        return r
    }
    return r
}

/* ── Problems ── */

export async function getProblems(filters = {}) {
    const params = new URLSearchParams(filters)
    const r = await authFetchJson(`/api/problems?${params}`)
    return r
}

/* ── Challenges ── */

export async function getChallenges() {
    const cached = getCacheEntry('challenges')
    if (cached) return { ok: true, data: cached }

    const r = await authFetchJson('/api/challenges')
    if (r.ok) {
        setCacheEntry('challenges', r.data, 600)
        return r
    }
    return r
}

export async function getUserChallenges() {
    const r = await authFetchJson('/api/challenges/mine')
    return r
}

/* ── Profile ── */

export async function getUserProfile() {
    const cached = getCacheEntry('profile')
    if (cached) return { ok: true, data: cached }

    const r = await authFetchJson('/api/user/profile')
    if (r.ok) {
        setCacheEntry('profile', r.data, 600)
        return r
    }
    return r
}

export async function updateUserProfile(updates) {
    const r = await authFetchJson('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
    })
    if (r.ok) {
        clearAllCache() // Invalidate profile cache
    }
    return r
}

/* ── Recommendations ── */

export async function getRecommendations() {
    const cached = getCacheEntry('recommendations')
    if (cached) return { ok: true, data: cached }

    const r = await authFetchJson('/api/recommendations')
    if (r.ok) {
        setCacheEntry('recommendations', r.data, 1200)
        return r
    }
    return r
}

/* ── Notifications ── */

export async function getUnreadNotificationCount() {
    const r = await authFetchJson('/api/notifications/unread-count')
    return r
}

export async function getNotifications() {
    const r = await authFetchJson('/api/notifications')
    return r
}

/* ── Authentication ── */

export async function loginWithEmailPassword(email, password) {
    const r = await authFetchJson('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })
    if (r.ok) {
        setUserEmail(r.data.email)
        setUserName(r.data.name)
        setUsername(r.data.username)
    }
    return r
}

export async function signupWithEmail(name, email, password, username) {
    const r = await authFetchJson('/auth/signup/request', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, username }),
    })
    return r
}

export async function getCurrentUser() {
    const r = await authFetchJson('/auth/me')
    if (r.ok) {
        setUserEmail(r.data.email)
        setUserName(r.data.name)
        setUsername(r.data.username)
    }
    return r
}