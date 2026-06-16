/**
 * Mock API Data for Frontend Testing
 * Replace this with real API calls when backend is ready
 */

export const MOCK_USER = {
    email: 'testuser@example.com',
    name: 'Test User',
    username: 'testuser',
    streak: 15,
    totalProblems: 245,
    totalContests: 12,
}

export const MOCK_DASHBOARD_DATA = {
    streak: 15,
    totalProblems: 245,
    totalContests: 12,
    totalTime: 1230,
    easyCount: 89,
    mediumCount: 120,
    hardCount: 36,
    platformData: {
        leetcode: { count: 150, streak: 12 },
        codeforces: { count: 95, streak: 8 },
        geeksforgeeks: { count: 0, streak: 0 },
    },
    recentProblems: [
        {
            id: 1,
            title: 'Two Sum',
            platform: 'leetcode',
            difficulty: 'Easy',
            status: 'solved',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
            id: 2,
            title: 'Median of Two Sorted Arrays',
            platform: 'leetcode',
            difficulty: 'Hard',
            status: 'solved',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
        {
            id: 3,
            title: 'A. Watermelon',
            platform: 'codeforces',
            difficulty: 'Easy',
            status: 'attempted',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
    ],
    achievements: [
        { id: 1, name: 'First Steps', description: 'Solve your first problem', unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { id: 2, name: '7-Day Streak', description: 'Maintain a 7-day streak', unlockedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
        { id: 3, name: 'Century Club', description: 'Solve 100 problems', unlockedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    ],
}

export const MOCK_PRACTICE_DATA = {
    missions: [
        {
            id: 1,
            category: 'mission',
            difficulty: 'Easy',
            platform: 'leetcode',
            title: 'Two Sum',
            description: 'Find two numbers that add up to target',
            url: 'https://leetcode.com/problems/two-sum/',
            estimatedTime: 15,
        },
        {
            id: 2,
            category: 'weakness',
            difficulty: 'Medium',
            platform: 'leetcode',
            title: 'LRU Cache',
            description: 'Design and implement LRU Cache',
            url: 'https://leetcode.com/problems/lru-cache/',
            estimatedTime: 45,
        },
        {
            id: 3,
            category: 'levelup',
            difficulty: 'Hard',
            platform: 'leetcode',
            title: 'Merge K Sorted Lists',
            description: 'Merge multiple sorted linked lists',
            url: 'https://leetcode.com/problems/merge-k-sorted-lists/',
            estimatedTime: 60,
        },
        {
            id: 4,
            category: 'explore',
            difficulty: 'Medium',
            platform: 'codeforces',
            title: 'B. Restaurant',
            description: 'Solve Codeforces problem',
            url: 'https://codeforces.com/problemset/problem/1/B',
            estimatedTime: 30,
        },
        {
            id: 5,
            category: 'stretch',
            difficulty: 'Hard',
            platform: 'leetcode',
            title: 'Edit Distance',
            description: 'Dynamic Programming challenge',
            url: 'https://leetcode.com/problems/edit-distance/',
            estimatedTime: 50,
        },
    ],
}

export const MOCK_COMMUNITY_DATA = {
    posts: [
        {
            id: 1,
            author: 'alice',
            content: 'Just completed my 100th LeetCode problem! 🎉',
            topic: 'general',
            likes: 45,
            comments: 12,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            liked: false,
        },
        {
            id: 2,
            author: 'bob',
            content: 'Best way to master dynamic programming - Tips and tricks',
            topic: 'dynamic-programming',
            likes: 89,
            comments: 23,
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            liked: true,
        },
        {
            id: 3,
            author: 'charlie',
            content: 'Struggling with graph problems? Start with BFS/DFS',
            topic: 'graphs',
            likes: 67,
            comments: 18,
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
            liked: false,
        },
        {
            id: 4,
            author: 'diana',
            content: 'System Design interview prep - resources and timeline',
            topic: 'system-design',
            likes: 123,
            comments: 34,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            liked: false,
        },
    ],
}

export const MOCK_CONTESTS_DATA = {
    upcoming: [
        {
            id: 1,
            platform: 'leetcode',
            name: 'LeetCode Weekly Contest 385',
            startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            duration: 90,
            participantCount: 5432,
            difficulty: 'Medium',
            registered: true,
        },
        {
            id: 2,
            platform: 'codeforces',
            name: 'Codeforces Round #923',
            startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            duration: 120,
            participantCount: 8234,
            difficulty: 'Mixed',
            registered: false,
        },
    ],
    recent: [
        {
            id: 3,
            platform: 'leetcode',
            name: 'LeetCode Weekly Contest 384',
            startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            duration: 90,
            rank: 245,
            totalParticipants: 5123,
            score: 18,
        },
    ],
}

export const MOCK_PROFILE_DATA = {
    user: MOCK_USER,
    stats: {
        totalProblems: 245,
        totalContests: 12,
        currentStreak: 15,
        longestStreak: 32,
        easyCount: 89,
        mediumCount: 120,
        hardCount: 36,
        acceptance: 0.87,
    },
    platforms: [
        {
            platform: 'leetcode',
            username: 'testuser',
            solved: 150,
            verified: true,
            verifiedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        },
        {
            platform: 'codeforces',
            username: 'testuser',
            solved: 95,
            verified: true,
            verifiedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        },
    ],
    badges: [
        { name: 'Century', description: '100 problems solved', icon: '🏆' },
        { name: 'Legend', description: '15-day streak', icon: '⭐' },
        { name: 'Speedster', description: 'Complete 5 problems in 1 hour', icon: '⚡' },
    ],
}

export const MOCK_CHALLENGES_DATA = {
    challenges: [
        {
            id: 1,
            title: 'Week 1: Arrays & Hashing',
            description: 'Master the fundamentals',
            difficulty: 'Easy',
            duration: '7 days',
            problems: 10,
            completed: 6,
            progress: 60,
        },
        {
            id: 2,
            title: 'Week 2: Two Pointers',
            description: 'Solve problems efficiently',
            difficulty: 'Medium',
            duration: '7 days',
            problems: 12,
            completed: 4,
            progress: 33,
        },
        {
            id: 3,
            title: 'Binary Trees Bootcamp',
            description: 'Deep dive into tree problems',
            difficulty: 'Medium',
            duration: '14 days',
            problems: 20,
            completed: 0,
            progress: 0,
        },
    ],
}

export const MOCK_PROBLEMS_DATA = {
    problems: [
        {
            id: 1,
            title: 'Two Sum',
            difficulty: 'Easy',
            platform: 'leetcode',
            acceptance: 47.3,
            likes: 15243,
            dislikes: 456,
        },
        {
            id: 2,
            title: 'Add Two Numbers',
            difficulty: 'Medium',
            platform: 'leetcode',
            acceptance: 32.1,
            likes: 8234,
            dislikes: 1234,
        },
        {
            id: 3,
            title: 'Median of Two Sorted Arrays',
            difficulty: 'Hard',
            platform: 'leetcode',
            acceptance: 28.5,
            likes: 9234,
            dislikes: 2345,
        },
        {
            id: 4,
            title: 'A. Watermelon',
            difficulty: 'Easy',
            platform: 'codeforces',
            acceptance: 98.2,
            likes: 234,
            dislikes: 12,
        },
    ],
}

export const MOCK_RECOMMENDATIONS_DATA = {
    recommendations: [
        {
            id: 1,
            title: 'Strengthen Your Weak Areas',
            problems: [
                { title: 'LRU Cache', difficulty: 'Hard', topic: 'Design' },
                { title: 'Word Ladder', difficulty: 'Hard', topic: 'BFS' },
            ],
            reason: 'Based on your recent attempts',
        },
        {
            id: 2,
            title: 'Trending Problems This Week',
            problems: [
                { title: 'Maximum Sum Subarray', difficulty: 'Medium', topic: 'DP' },
                { title: 'Merge K Sorted Lists', difficulty: 'Hard', topic: 'Heap' },
            ],
            reason: 'Popular among users with your skill level',
        },
    ],
}
