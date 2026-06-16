/**
 * tourSteps.js - Updated with Navigation
 * Each step now navigates to the correct page/feature
 */

export const TOUR_STEPS = [
    {
        id: 'welcome',
        title: '🚀 Welcome to AlgoSprint!',
        description: 'You\'re all set! Let\'s take a quick tour to show you around.\n\nYou\'ll learn how to track your progress, find problems, compete with others, and master your coding skills.',
        target: 'body',
        position: 'center',
        highlight: false,
        navigate: null, // Stays on dashboard
    },
    {
        id: 'sidebar',
        title: '🧭 Your Navigation Hub',
        description: 'This is your sidebar - your central command center!\n\nFrom here you can:\n• View your dashboard\n• Practice problems\n• Join challenges\n• Connect with community\n• Check your profile',
        target: '.sidebar',
        position: 'right',
        highlight: true,
        padding: 8,
        navigate: null, // Stay on dashboard to see sidebar
    },
    {
        id: 'streak',
        title: '🔥 Build Your Streak',
        description: 'This is your streak counter. Solve problems every day to maintain your streak!\n\nConsistency is the key to improvement. Your streak is visible to the community.',
        target: '.sidebar-xp-bar',
        position: 'right',
        highlight: true,
        padding: 8,
        navigate: null,
    },
    {
        id: 'dashboard-overview',
        title: '📊 Your Personal Dashboard',
        description: 'This is your command center where you see all your stats at a glance:\n\n• Problems solved\n• Current streak & ranking\n• Performance metrics\n• Weak topics analysis\n• Progress charts',
        target: '.page-content',
        position: 'center',
        highlight: true,
        padding: 0,
        navigate: '/dashboard',
    },
    {
        id: 'training',
        title: '📚 Training Section',
        description: 'Here\'s where you practice problems from LeetCode, Codeforces, and GeeksforGeeks.\n\nYou can:\n• Filter by difficulty\n• Search by topic\n• Track what you\'ve solved\n• Get curated recommendations\n• Solve problems from multiple platforms',
        target: '.page-content',
        position: 'center',
        highlight: true,
        padding: 0,
        navigate: '/problems', // Navigate to problems page
    },
    {
        id: 'challenges',
        title: '🏆 Take on Challenges',
        description: 'Compete with other users in real-time challenges!\n\nSolve problems faster, aim for the leaderboard, and earn recognition.\n\nGreat for:\n• Testing your skills\n• Networking with coders',
        target: '.page-content',
        position: 'center',
        highlight: true,
        padding: 0,
        navigate: '/challenges',
    },
    {
        id: 'community',
        title: '👥 Connect with Community',
        description: 'Share your progress, learn from others, and stay motivated!\n\nThe community section lets you:\n• See what others are working on\n• Share your solutions',
        target: '.page-content',
        position: 'center',
        highlight: true,
        padding: 0,
        navigate: '/community',
    },
    {
        id: 'profile',
        title: '⚙️ Your Profile & Settings',
        description: 'Customize your experience here!\n\nYou can:\n• Update your bio and picture\n• Connect more platforms\n• View detailed statistics',
        target: '.page-content',
        position: 'center',
        highlight: true,
        padding: 0,
        navigate: '/profile',
    },
    {
        id: 'topbar',
        title: '🔔 Stay Updated',
        description: 'The top bar keeps you in the loop with:\n\n• Notifications on new challenges\n• Updates on platform syncs\n• Quick access to search',
        target: '.topbar',
        position: 'bottom',
        highlight: false,
        padding: 8,
        navigate: '/dashboard',
    },
    {
        id: 'tips',
        title: '💡 Pro Tips to Get Started',
        description: 'Here are some tips to maximize your learning:\n\n1. Solve one problem daily to maintain your streak\n2. Start with Easy problems, work your way up\n3. Join challenges to practice under pressure\n\nRemember: consistency beats intensity! 💪',
        target: 'body',
        position: 'center',
        highlight: false,
        navigate: '/dashboard',
    },
    {
        id: 'finish',
        title: '✨ You\'re Ready to Code!',
        description: 'You now have a complete overview of AlgoSprint.\n\nHere\'s what you should do next:\n\nHappy coding! 🚀',
        target: 'body',
        position: 'center',
        highlight: false,
        navigate: null, // User can decide where to go
    },
]

/**
 * Get tour step by ID
 */
export const getTourStep = (stepId) => {
    return TOUR_STEPS.find(step => step.id === stepId)
}

/**
 * Get tour step by index
 */
export const getTourStepByIndex = (index) => {
    return TOUR_STEPS[index]
}

/**
 * Total number of steps
 */
export const TOTAL_TOUR_STEPS = TOUR_STEPS.length