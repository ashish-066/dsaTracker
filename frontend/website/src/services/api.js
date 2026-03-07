/**
 * API Service Layer — Integrated with Spring Boot Backend (port 8080)
 * Platform sync (LeetCode stats) is done server-side → stored in DB → served via /api/platforms/dashboard
 */

const API_BASE = 'http://localhost:8080'

/* ── JWT Token Management ── */

export function getJWTToken() { return localStorage.getItem('jwt_token') }
export function setJWTToken(token) { localStorage.setItem('jwt_token', token) }
export function setUserEmail(email) { localStorage.setItem('jwt_email', email) }
export function getUserEmail() { return localStorage.getItem('jwt_email') }

export function clearAuth() {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('jwt_email')
    localStorage.removeItem('algoledger_platforms')
}

export function isAuthenticated() {
    return !!getJWTToken() && !!getUserEmail()
}

/** Authenticated fetch wrapper — auto-attaches Bearer token */
async function authFetch(path, options = {}) {
    const token = getJWTToken()
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    }
    return fetch(`${API_BASE}${path}`, { ...options, headers })
}

/** Convenience: authenticated fetch that parses JSON and returns {ok, data, error} */
export async function authFetchJson(path, options = {}) {
    try {
        const res = await authFetch(path, options)
        const data = await res.json()
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

/* ── Authentication API calls ── */

/** Register a new user */
export async function register(name, email, password) {
    const res = await fetch(`${API_BASE}/auth/addNewUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, roles: 'ROLE_USER' }),
    })
    const data = await res.text()
    return { success: res.ok, data, status: res.status }
}

/** Login user and get JWT token */
export async function login(email, password) {
    const res = await fetch(`${API_BASE}/auth/generateToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
    })
    if (res.ok) {
        const token = await res.text()
        setJWTToken(token)
        setUserEmail(email)
        return { success: true, token, email }
    } else {
        const error = await res.text()
        return { success: false, error: error || 'Invalid credentials' }
    }
}

/** Logout user */
export function logout() { clearAuth() }

/* ── Platform linking (stored in DB via backend) ── */

/**
 * Link a platform account. Triggers an immediate sync from the platform API.
 * platform: 'leetcode' | 'codeforces'
 */
export async function linkPlatform(platform, username) {
    const res = await authFetch('/api/platforms/link', {
        method: 'POST',
        body: JSON.stringify({ platform, username }),
    })
    const data = await res.json()
    if (res.ok) {
        // Mirror in localStorage for instant UI feedback
        const platforms = getLinkedPlatforms()
        platforms[platform] = username
        savePlatforms(platforms)
        return { success: true, data }
    }
    return { success: false, error: data.error || 'Failed to link platform' }
}

/** Verify a LeetCode username exists (public endpoint) */
export async function verifyLeetCodeUsername(username) {
    try {
        const res = await fetch(`${API_BASE}/api/leetcode/submissions/${encodeURIComponent(username)}`)
        if (res.ok) {
            const data = await res.json()
            return { valid: true, data }
        }
        return { valid: false, error: 'Username not found' }
    } catch (e) {
        return { valid: false, error: e.message }
    }
}

/** Verify a Codeforces handle exists (public endpoint) */
export async function verifyCodeforcesHandle(handle) {
    try {
        const res = await fetch(`${API_BASE}/api/codeforces/user/${encodeURIComponent(handle)}`)
        if (res.ok) {
            const data = await res.json()
            return { valid: data.exists, data }
        }
        return { valid: false, error: 'Handle not found' }
    } catch (e) {
        return { valid: false, error: e.message }
    }
}

/* ── Dashboard data (served from DB, synced from real platform APIs) ── */

/**
 * Fetch dashboard stats for the logged-in user.
 * Returns: { totalSolved, easySolved, mediumSolved, hardSolved,
 *            currentStreak, longestStreak, platforms[], topics[], linkedPlatforms[] }
 */
export async function fetchDashboardData() {
    const res = await authFetch('/api/platforms/dashboard')
    if (res.ok) {
        return { success: true, data: await res.json() }
    }
    return { success: false, error: `HTTP ${res.status}` }
}

export async function fetchCalendarData() {
    const res = await authFetch('/api/platforms/calendar')
    if (res.ok) {
        return { success: true, data: await res.json() }
    }
    return { success: false, error: `HTTP ${res.status}` }
}

/**
 * Force-sync all linked platforms from their live APIs → update DB → return fresh stats.
 */
export async function syncAllPlatforms() {
    const res = await authFetch('/api/platforms/sync', { method: 'POST' })
    if (res.ok) {
        return { success: true, data: await res.json() }
    }
    return { success: false, error: `HTTP ${res.status}` }
}

/* ── Legacy helpers (kept for backward compat with OnboardingPage) ── */

export async function addLeetCode(username) {
    return linkPlatform('leetcode', username)
}

export async function addCodeforces(handle) {
    return linkPlatform('codeforces', handle)
}

/** @deprecated Use fetchDashboardData() instead */
export async function fetchAllPlatformData() {
    return fetchDashboardData()
}


export async function fetchLeetCodeSubmissions(username) {
    try {
        const res = await fetch(`${API_BASE}/api/leetcode/submissions/${encodeURIComponent(username)}`)
        if (res.ok) {
            const data = await res.json()
            return { success: true, data: data.submissions || [] }
        }
        return { success: false, error: 'Failed to fetch' }
    } catch (e) {
        return { success: false, error: e.message }
    }
}

/* ─────────────────────────────────────────────
   CHALLENGE / CONTEST APIs
───────────────────────────────────────────── */

export async function createChallenge(opponentEmail, contestType) {
    try {
        const res = await authFetch('/challenges', {
            method: 'POST',
            body: JSON.stringify({ opponentEmail, contestType }),
        })
        const data = await res.json()
        if (res.ok) return { success: true, data }
        return { success: false, error: data.error || 'Failed to create challenge' }
    } catch (e) { return { success: false, error: e.message } }
}

export async function getChallenge(id) {
    try {
        const res = await authFetch(`/challenges/${id}`)
        if (res.ok) return { success: true, data: await res.json() }
        return { success: false, error: 'Not found' }
    } catch (e) { return { success: false, error: e.message } }
}

export async function acceptChallenge(id) {
    try {
        const res = await authFetch(`/challenges/${id}/accept`, { method: 'POST' })
        const data = await res.json()
        if (res.ok) return { success: true, data }
        return { success: false, error: data.error || 'Failed' }
    } catch (e) { return { success: false, error: e.message } }
}

export async function declineChallenge(id) {
    try {
        const res = await authFetch(`/challenges/${id}/decline`, { method: 'POST' })
        const data = await res.json()
        if (res.ok) return { success: true, data }
        return { success: false, error: data.error || 'Failed' }
    } catch (e) { return { success: false, error: e.message } }
}

export async function fetchMyChallenges() {
    try {
        const res = await authFetch('/challenges/mine')
        if (res.ok) return { success: true, data: await res.json() }
        return { success: false, error: 'Failed' }
    } catch (e) { return { success: false, error: e.message } }
}

export async function fetchInvitations() {
    try {
        const res = await authFetch('/challenges/invitations')
        if (res.ok) return { success: true, data: await res.json() }
        return { success: false, error: 'Failed' }
    } catch (e) { return { success: false, error: e.message } }
}

export async function fetchLeaderboard(id) {
    try {
        const res = await authFetch(`/challenges/${id}/leaderboard`)
        if (res.ok) return { success: true, data: await res.json() }
        return { success: false, error: 'Failed' }
    } catch (e) { return { success: false, error: e.message } }
}

export async function finishChallenge(id) {
    try {
        const res = await authFetch(`/challenges/${id}/finish`, { method: 'POST' })
        const data = await res.json()
        if (res.ok) return { success: true, data }
        return { success: false, error: data.error || 'Failed' }
    } catch (e) { return { success: false, error: e.message } }
}
