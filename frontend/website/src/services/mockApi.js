/**
 * Mock API Wrapper
 * Enable/disable with: localStorage.setItem('useMockApi', 'true'/'false')
 * Check status with: localStorage.getItem('useMockApi')
 */
// localStorage.setItem('useMockApi', 'true');
// localStorage.setItem('jwt_email', 'testuser@example.com');
// localStorage.setItem('jwt_name', 'Test User');
// localStorage.setItem('jwt_username', 'testuser');
// window.location.href = '/dashboard';
import {
    MOCK_CHALLENGES_DATA,
    MOCK_COMMUNITY_DATA,
    MOCK_CONTESTS_DATA,
    MOCK_DASHBOARD_DATA,
    MOCK_PRACTICE_DATA,
    MOCK_PROBLEMS_DATA,
    MOCK_PROFILE_DATA,
    MOCK_RECOMMENDATIONS_DATA,
    MOCK_USER,
} from './mockData'

export function isMockApiEnabled() {
    return localStorage.getItem('useMockApi') === 'true'
}

export function enableMockApi() {
    localStorage.setItem('useMockApi', 'true')
    console.log('✅ Mock API enabled. Page will reload.')
    window.location.reload()
}

export function disableMockApi() {
    localStorage.removeItem('useMockApi')
    console.log('❌ Mock API disabled. Page will reload.')
    window.location.reload()
}

export function getMockApiStatus() {
    return {
        enabled: isMockApiEnabled(),
        message: isMockApiEnabled()
            ? '✅ Using Mock API (no backend needed)'
            : '❌ Using Real API (backend required)',
    }
}

/**
 * Intercept authFetchJson calls and return mock data
 * Usage: wrap the real authFetchJson with this function
 */
export async function mockAuthFetchJson(path, options = {}) {
    if (!isMockApiEnabled()) {
        // Fall through to real API
        return null
    }

    // Add small delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))

    console.log(`🎭 [MOCK API] ${options.method || 'GET'} ${path}`)

    // LOGIN - Check credentials
    if (path === '/auth/login') {
        const { email, password } = JSON.parse(options.body || '{}')
        if (email && password) {
            return {
                ok: true,
                data: {
                    email,
                    name: MOCK_USER.name,
                    username: MOCK_USER.username,
                },
            }
        }
        return { ok: false, error: 'Invalid email or password' }
    }

    // SIGNUP - Accept any new user
    if (path === '/auth/signup/request') {
        const { name, email, password, username } = JSON.parse(options.body || '{}')
        if (email && password) {
            return {
                ok: true,
                data: {
                    email,
                    name,
                    username,
                    requiresOTP: false,
                },
            }
        }
        return { ok: false, error: 'Invalid signup data' }
    }

    // DASHBOARD DATA
    if (path === '/api/platforms/dashboard') {
        return {
            ok: true,
            data: MOCK_DASHBOARD_DATA,
        }
    }

    // PRACTICE MISSIONS
    if (path === '/api/missions') {
        return {
            ok: true,
            data: MOCK_PRACTICE_DATA,
        }
    }

    // COMMUNITY POSTS
    if (path === '/api/community/posts') {
        return {
            ok: true,
            data: MOCK_COMMUNITY_DATA,
        }
    }

    if (path.startsWith('/api/community/posts/')) {
        const postId = path.split('/').pop()
        return {
            ok: true,
            data: MOCK_COMMUNITY_DATA.posts.find(p => p.id === parseInt(postId)),
        }
    }

    // CONTESTS
    if (path === '/api/contests') {
        return {
            ok: true,
            data: MOCK_CONTESTS_DATA,
        }
    }

    // PROFILE
    if (path === '/api/user/profile') {
        return {
            ok: true,
            data: MOCK_PROFILE_DATA,
        }
    }

    // PROFILE UPDATE
    if (path === '/api/user/profile' && options.method === 'PUT') {
        return {
            ok: true,
            data: { ...MOCK_PROFILE_DATA.user, ...JSON.parse(options.body || '{}') },
        }
    }

    // CHALLENGES
    if (path === '/api/challenges') {
        return {
            ok: true,
            data: MOCK_CHALLENGES_DATA,
        }
    }

    // PROBLEMS
    if (path === '/api/problems') {
        return {
            ok: true,
            data: MOCK_PROBLEMS_DATA,
        }
    }

    // RECOMMENDATIONS
    if (path === '/api/recommendations') {
        return {
            ok: true,
            data: MOCK_RECOMMENDATIONS_DATA,
        }
    }

    // VERIFICATION (always succeed for testing)
    if (path === '/api/verify/start') {
        const { platform, handle } = JSON.parse(options.body || '{}')
        return {
            ok: true,
            data: {
                problemSlug: 'two-sum',
                problemName: 'Two Sum',
                problemUrl: `https://${platform}.com/problems/two-sum/`,
                startTime: new Date().toISOString(),
            },
        }
    }

    if (path === '/api/verify/check') {
        return {
            ok: true,
            data: { verified: true },
        }
    }

    // GET CURRENT USER
    if (path === '/auth/me') {
        return {
            ok: true,
            data: MOCK_USER,
        }
    }

    // NOTIFICATIONS
    if (path === '/api/notifications/unread-count') {
        return {
            ok: true,
            data: { count: 3 },
        }
    }

    if (path === '/api/notifications') {
        return {
            ok: true,
            data: {
                notifications: [
                    { id: 1, message: 'You solved Two Sum!', read: false, timestamp: new Date() },
                    { id: 2, message: 'New contest available!', read: false, timestamp: new Date() },
                    { id: 3, message: 'Keep your streak going!', read: true, timestamp: new Date() },
                ],
            },
        }
    }

    // CHALLENGES
    if (path === '/challenges/mine' || path === '/api/challenges/mine') {
        return {
            ok: true,
            data: MOCK_CHALLENGES_DATA.challenges || [],
        }
    }

    if (path === '/challenges/invitations' || path === '/api/challenges/invitations') {
        return {
            ok: true,
            data: [],
        }
    }

    // COMMUNITY POSTS
    if (path.includes('/api/posts') || path.includes('/posts')) {
        return {
            ok: true,
            data: {
                posts: MOCK_COMMUNITY_DATA.posts || [],
                hasNext: false,
            },
        }
    }

    // CATCH-ALL: For any missing endpoint, provide reasonable defaults
    console.log(`🎭 [MOCK API] Returning default data for ${path}`)
    
    // Return empty data based on endpoint pattern
    if (path.includes('/dashboard')) {
        return { ok: true, data: MOCK_DASHBOARD_DATA }
    }
    if (path.includes('/profile')) {
        return { ok: true, data: MOCK_PROFILE_DATA }
    }
    if (path.includes('/community')) {
        return { ok: true, data: MOCK_COMMUNITY_DATA }
    }
    if (path.includes('/problems')) {
        return { ok: true, data: MOCK_PROBLEMS_DATA }
    }
    if (path.includes('/challenges')) {
        return { ok: true, data: MOCK_CHALLENGES_DATA.challenges || [] }
    }
    if (path.includes('/recommendations')) {
        return { ok: true, data: MOCK_RECOMMENDATIONS_DATA }
    }
    if (path.includes('/contests')) {
        return { ok: true, data: MOCK_CONTESTS_DATA }
    }
    if (path.includes('/missions')) {
        return { ok: true, data: MOCK_PRACTICE_DATA }
    }

    // FALLBACK - Return empty success for unknown endpoints
    return {
        ok: true,
        data: [],
    }
}
