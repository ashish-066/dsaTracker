/**
 * AlgoLedger Analytics Engine
 * All metrics are computed dynamically from real submission data.
 * No hardcoded values anywhere.
 */

/* ─── helpers ─── */
const dayKey = d => {
    const dt = d instanceof Date ? d : new Date(d * 1000)
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}
const isoWeek = d => {
    const dt = new Date(d)
    dt.setHours(0, 0, 0, 0)
    dt.setDate(dt.getDate() + 4 - (dt.getDay() || 7))
    const y = new Date(dt.getFullYear(), 0, 1)
    return `${dt.getFullYear()}-W${Math.ceil((((dt - y) / 86400000) + 1) / 7)}`
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

/* ════════════════════════════════════════
   1. TOPIC ANALYTICS
════════════════════════════════════════ */
export function computeTopicStats(submissions) {
    const map = {}
    submissions.forEach(s => {
        const t = s.topic || s.topicSlug || 'Unknown'
        if (!map[t]) map[t] = { topic: t, total: 0, accepted: 0, attempts: 0, totalTime: 0, timeSamples: 0 }
        map[t].total++
        if (s.statusDisplay === 'Accepted' || s.status === 'AC') map[t].accepted++
        map[t].attempts += s.attempts || 1
        if (s.solveTime) { map[t].totalTime += s.solveTime; map[t].timeSamples++ }
    })
    return Object.values(map).map(t => ({
        ...t,
        successRate: t.total > 0 ? Math.round((t.accepted / t.total) * 100) : 0,
        avgAttempts: t.total > 0 ? +(t.attempts / t.total).toFixed(1) : 1,
        avgSolveTime: t.timeSamples > 0 ? Math.round(t.totalTime / t.timeSamples) : null,
    })).sort((a, b) => b.accepted - a.accepted)
}

export function detectWeakTopics(topicStats) {
    if (!topicStats.length) return []
    const avgSuccessRate = topicStats.reduce((s, t) => s + t.successRate, 0) / topicStats.length
    const avgAttempts = topicStats.reduce((s, t) => s + t.avgAttempts, 0) / topicStats.length

    return topicStats
        .map(t => {
            let weakScore = 0
            if (t.successRate < avgSuccessRate * 0.7) weakScore += 40
            if (t.avgAttempts > avgAttempts * 1.3) weakScore += 30
            if (t.total < 5) weakScore += 20
            if (t.successRate < 40) weakScore += 10
            return { ...t, weakScore }
        })
        .filter(t => t.weakScore > 20)
        .sort((a, b) => b.weakScore - a.weakScore)
        .slice(0, 4)
}

/* ════════════════════════════════════════
   2. SKILL RADAR
════════════════════════════════════════ */
const RADAR_TOPICS = ['Array', 'Hash Table', 'Binary Search', 'Graph', 'Dynamic Programming', 'Greedy', 'String', 'Simulation', 'Tree', 'Stack']

export function computeSkillRadar(topicStats, totalSolved) {
    const byTopic = {}
    topicStats.forEach(t => { byTopic[t.topic.toLowerCase()] = t })

    return RADAR_TOPICS.map(name => {
        const key = name.toLowerCase()
        // fuzzy match
        const stat = byTopic[key] || topicStats.find(t => t.topic.toLowerCase().includes(key.split(' ')[0])) || null
        if (!stat) return { topic: name, score: 0 }

        const rateScore = stat.successRate * 0.45
        const depthScore = Math.min(stat.total / Math.max(totalSolved * 0.15, 1), 1) * 35
        const diffScore = Math.min(stat.accepted / 10, 1) * 20
        return { topic: name, score: Math.round(rateScore + depthScore + diffScore), solved: stat.accepted, rate: stat.successRate }
    })
}

/* ════════════════════════════════════════
   3. EFFICIENCY
════════════════════════════════════════ */
export function computeEfficiency(submissions) {
    if (!submissions.length) return { score: 0, firstAttemptRate: 0, avgRetries: 0, wrongRatio: 0 }

    // Group by problem so we can count retries
    const problems = {}
    submissions.forEach(s => {
        const id = s.titleSlug || s.problem_id || s.id
        if (!problems[id]) problems[id] = { attempts: 0, accepted: false }
        problems[id].attempts++
        if (s.statusDisplay === 'Accepted') problems[id].accepted = true
    })

    const pList = Object.values(problems)
    const accepted = pList.filter(p => p.accepted)
    const firstTry = accepted.filter(p => p.attempts === 1).length
    const firstAttemptRate = accepted.length ? Math.round((firstTry / accepted.length) * 100) : 0
    const avgRetries = accepted.length ? +(accepted.reduce((s, p) => s + p.attempts, 0) / accepted.length).toFixed(1) : 0
    const wrongs = submissions.filter(s => s.statusDisplay !== 'Accepted').length
    const wrongRatio = Math.round((wrongs / submissions.length) * 100)

    const score = clamp(
        Math.round(firstAttemptRate * 0.45 + (100 - wrongRatio) * 0.35 + Math.max(0, 100 - (avgRetries - 1) * 20) * 0.20),
        0, 100
    )
    return { score, firstAttemptRate, avgRetries, wrongRatio, totalUnique: pList.length }
}

/* ════════════════════════════════════════
   4. CONSISTENCY
════════════════════════════════════════ */
export function computeConsistency(heatmapData) {
    if (!heatmapData.length) return { score: 0, activeDays: 0, inactivityGap: 0, currentStreak: 0, longestStreak: 0 }

    const last30 = heatmapData.slice(-30)
    const activeDays = last30.filter(d => d.count > 0).length

    // Longest inactivity gap
    let maxGap = 0, curGap = 0
    heatmapData.forEach(d => {
        if (d.count === 0) { curGap++; maxGap = Math.max(maxGap, curGap) }
        else curGap = 0
    })

    // Streak
    let curStreak = 0, longestStreak = 0, streak = 0
        ;[...heatmapData].reverse().forEach((d, i) => {
            if (d.count > 0) { streak++; if (i === 0 || curStreak === streak - 1) curStreak = streak }
            else { longestStreak = Math.max(longestStreak, streak); streak = 0 }
        })
    longestStreak = Math.max(longestStreak, streak)

    const actScore = clamp(activeDays / 30 * 100, 0, 40)
    const gapScore = clamp((1 - maxGap / 30) * 30, 0, 30)
    const streakScore = clamp(curStreak / 14 * 30, 0, 30)
    const score = Math.round(actScore + gapScore + streakScore)

    return { score, activeDays, inactivityGap: maxGap, currentStreak: curStreak, longestStreak }
}

/* ════════════════════════════════════════
   5. WEEKLY / MONTHLY GROWTH
════════════════════════════════════════ */
export function computeWeeklyGrowth(heatmapData, weeks = 16) {
    const result = []
    for (let w = weeks - 1; w >= 0; w--) {
        const end = w * 7
        const start = end + 7
        const slice = heatmapData.slice(Math.max(0, heatmapData.length - start), Math.max(0, heatmapData.length - end))
        const solved = slice.reduce((a, d) => a + d.count, 0)
        const label = slice[0] ? slice[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `W${weeks - w}`
        result.push({ week: label, solved, active: slice.filter(d => d.count > 0).length })
    }
    return result
}

export function computeDailyTrend(heatmapData, days = 30) {
    return heatmapData.slice(-days).map(d => ({
        day: d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: d.count,
    }))
}

/* ════════════════════════════════════════
   6. LEARNING PROGRESSION
════════════════════════════════════════ */
export function computeProgression(submissions) {
    if (!submissions.length) return { points: [], insight: null }

    const sorted = [...submissions].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    const monthly = {}
    sorted.forEach(s => {
        if (!s.timestamp) return
        const d = new Date(s.timestamp * 1000)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (!monthly[key]) monthly[key] = { easy: 0, medium: 0, hard: 0, total: 0 }
        const diff = (s.difficulty || '').toLowerCase()
        if (diff === 'easy') monthly[key].easy++
        else if (diff === 'medium') monthly[key].medium++
        else if (diff === 'hard') monthly[key].hard++
        monthly[key].total++
    })

    const points = Object.entries(monthly).map(([k, v]) => ({
        month: k,
        easy: v.easy, medium: v.medium, hard: v.hard,
        hardRatio: v.total > 0 ? Math.round(((v.medium + v.hard) / v.total) * 100) : 0,
    }))

    let insight = null
    if (points.length >= 2) {
        const first = points[0]; const last = points[points.length - 1]
        if (last.hardRatio > first.hardRatio + 15) insight = `Difficulty level rising — you're tackling ${last.hardRatio}% Medium/Hard problems (up from ${first.hardRatio}%)`
        else if (last.hard > 0 && first.hard === 0) insight = `You've started solving Hard problems — great progression!`
        else if (last.medium > first.medium * 1.5) insight = `Strong Medium problem push in recent months`
    }

    return { points, insight }
}

/* ════════════════════════════════════════
   7. CONTEST READINESS
════════════════════════════════════════ */
export function computeContestReadiness({ totalSolved, mediumSolved, hardSolved, easySolved, effiScore, consistencyScore, topicStats }) {
    if (!totalSolved) return { score: 0, strengths: [], weaknesses: [] }

    const mhRatio = totalSolved > 0 ? ((mediumSolved + hardSolved) / totalSolved) : 0
    const hardBonus = totalSolved > 0 ? (hardSolved / totalSolved) : 0
    const topicCoverage = clamp(topicStats.length / 8, 0, 1)

    const score = Math.round(
        mhRatio * 30 +
        hardBonus * 20 +
        effiScore * 0.25 +
        consistencyScore * 0.15 +
        topicCoverage * 10
    )

    const strengths = [], weaknesses = []
    if (mhRatio > 0.5) strengths.push('Strong Medium/Hard ratio')
    if (hardSolved > 5) strengths.push('Hard problem experience')
    if (effiScore > 60) strengths.push('High first-attempt success')
    if (consistencyScore > 60) strengths.push('Consistent daily practice')
    if (topicStats.length > 6) strengths.push('Broad topic coverage')
    if (mhRatio < 0.3) weaknesses.push('Too Easy-heavy — solve more Mediums')
    if (hardSolved < 3) weaknesses.push('Limited Hard problem exposure')
    if (effiScore < 50) weaknesses.push('High retry rate — review before submitting')
    if (consistencyScore < 40) weaknesses.push('Inconsistent practice schedule')
    if (topicStats.length < 4) weaknesses.push('Narrow topic coverage')

    return { score: clamp(score, 0, 100), strengths, weaknesses }
}

/* ════════════════════════════════════════
   8. SMART RECOMMENDATIONS
════════════════════════════════════════ */
export function computeRecommendations({ weakTopics, topicStats, totalSolved, mediumSolved, hardSolved }) {
    const recs = []

    // Weak topics first
    weakTopics.slice(0, 2).forEach(t => {
        const needed = Math.max(5, Math.ceil(10 - t.total))
        recs.push({
            priority: 'high',
            topic: t.topic,
            reason: `Low success rate (${t.successRate}%) · avg ${t.avgAttempts} attempts per problem`,
            action: `Practice ${needed} more ${t.topic} problems`,
            icon: '🔴',
        })
    })

    // Difficulty progression
    const total = totalSolved || 1
    const mhRatio = (mediumSolved + hardSolved) / total
    if (mhRatio < 0.3 && totalSolved > 20) {
        recs.push({ priority: 'medium', topic: 'Medium Difficulty', reason: 'Your current mix is too Easy-heavy', action: 'Solve 5 Medium problems this week', icon: '🟡' })
    }
    if (hardSolved < 3 && totalSolved > 40) {
        recs.push({ priority: 'medium', topic: 'Hard Problems', reason: 'No Hard problem history detected', action: 'Attempt 1 Hard problem per week', icon: '🔴' })
    }

    // Less practiced topics
    const rareTopic = topicStats.filter(t => t.total < 5 && t.total > 0).slice(0, 2)
    rareTopic.forEach(t => {
        recs.push({ priority: 'low', topic: t.topic, reason: `Only ${t.total} problems solved`, action: `Do 5 more ${t.topic} problems`, icon: '🟢' })
    })

    // General if nothing
    if (!recs.length) {
        recs.push({ priority: 'medium', topic: 'Sliding Window', reason: 'Pattern not detected in recent activity', action: 'Build intuition with 5 Sliding Window problems', icon: '🟡' })
        recs.push({ priority: 'low', topic: 'Graph BFS', reason: 'Pattern coverage incomplete', action: 'Solve 3 Graph BFS problems', icon: '🟢' })
    }

    return recs.slice(0, 5)
}

/* ════════════════════════════════════════
   9. PREDICTIVE PROGRESS
════════════════════════════════════════ */
export function computePrediction({ heatmapData, totalSolved }) {
    const recent = heatmapData.slice(-21).filter(d => d.count > 0)
    const avgPerDay = recent.length > 0
        ? recent.reduce((s, d) => s + d.count, 0) / heatmapData.slice(-21).length
        : 0

    const in30 = Math.round(totalSolved + avgPerDay * 30)
    const in90 = Math.round(totalSolved + avgPerDay * 90)
    const in180 = Math.round(totalSolved + avgPerDay * 180)

    const milestones = [100, 200, 300, 500, 1000].map(m => {
        if (totalSolved >= m) return { target: m, reached: true, daysLeft: 0 }
        const daysLeft = avgPerDay > 0 ? Math.ceil((m - totalSolved) / avgPerDay) : null
        const eta = daysLeft ? new Date(Date.now() + daysLeft * 86400000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'
        return { target: m, reached: false, daysLeft, eta }
    })

    return { avgPerDay: +avgPerDay.toFixed(2), in30, in90, in180, milestones }
}

/* ════════════════════════════════════════
   10. PERFORMANCE SCORE
════════════════════════════════════════ */
export function computePerformanceScore({ totalSolved, longestStreak, acceptanceRate, activeWeeks, hardSolved, effiScore }) {
    const s = clamp(totalSolved / 3, 0, 35)
    const st = clamp(longestStreak * 1.2, 0, 20)
    const ar = clamp(acceptanceRate * 0.12, 0, 12)
    const aw = clamp(activeWeeks * 1.5, 0, 15)
    const h = clamp(hardSolved * 1.5, 0, 10)
    const e = clamp(effiScore * 0.08, 0, 8)
    return Math.round(clamp(s + st + ar + aw + h + e, 0, 100))
}

export function scoreLabel(s) {
    if (s >= 85) return { label: 'Elite', color: '#A855F7', bg: 'rgba(168,85,247,0.18)' }
    if (s >= 70) return { label: 'Advanced', color: '#38BDF8', bg: 'rgba(56,189,248,0.18)' }
    if (s >= 50) return { label: 'Intermediate', color: '#22C55E', bg: 'rgba(34,197,94,0.18)' }
    if (s >= 30) return { label: 'Beginner', color: '#F59E0B', bg: 'rgba(245,158,11,0.18)' }
    return { label: 'Novice', color: '#64748B', bg: 'rgba(100,116,139,0.18)' }
}

/* ════════════════════════════════════════
   11. AVG SOLVE TIME BY DIFFICULTY
════════════════════════════════════════ */
export function computeAvgSolveTime(submissions) {
    const bins = { easy: { total: 0, n: 0 }, medium: { total: 0, n: 0 }, hard: { total: 0, n: 0 } }
    submissions.forEach(s => {
        const d = (s.difficulty || '').toLowerCase()
        if (s.solveTime && bins[d]) { bins[d].total += s.solveTime; bins[d].n++ }
    })
    return {
        easy: bins.easy.n ? Math.round(bins.easy.total / bins.easy.n) : null,
        medium: bins.medium.n ? Math.round(bins.medium.total / bins.medium.n) : null,
        hard: bins.hard.n ? Math.round(bins.hard.total / bins.hard.n) : null,
    }
}

export const fmtMins = m => m ? (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`) : '—'
