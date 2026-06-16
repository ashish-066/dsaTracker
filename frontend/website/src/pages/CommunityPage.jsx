import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/TopBar'
import * as api from '../services/api'
const THEME_VARS = {
    dark: {
        'bg-primary': '#0B0F1A',
        'bg-secondary': '#121727',
        'card-bg': 'rgba(255,255,255,0.025)',
        'card-bg-hover': 'rgba(255,255,255,0.04)',
        'card-border': 'rgba(255,255,255,0.06)',
        'card-border-hover': 'rgba(255,255,255,0.1)',
        'text-primary': '#F1F5F9',
        'text-secondary': '#CBD5E1',
        'text-muted': '#64748B',
        'text-tertiary': '#475569',
        'accent-amber': '#E5A653',
        'accent-purple': '#9F8FE3',
        'accent-green': '#10B981',
        'accent-blue': '#3B82F6',
        'accent-pink': '#EC4899',
        'accent-red': '#EF4444',
        'accent-orange': '#F97316',
        'accent-cyan': '#06B6D4',
        'code-bg': 'rgba(8,12,30,0.8)',
        'code-border': 'rgba(255,255,255,0.06)',
        'code-inline-bg': 'rgba(229,166,83,0.1)',
        'code-inline-border': 'rgba(229,166,83,0.18)',
        'code-inline-color': '#F3C887',
    },
    light: {
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F8FAFC',
        'card-bg': 'rgba(15,23,42,0.04)',
        'card-bg-hover': 'rgba(15,23,42,0.08)',
        'card-border': 'rgba(15,23,42,0.12)',
        'card-border-hover': 'rgba(15,23,42,0.18)',
        'text-primary': '#0F172A',
        'text-secondary': '#334155',
        'text-muted': '#94A3B8',
        'text-tertiary': '#CBD5E1',
        'accent-amber': '#D97706',
        'accent-purple': '#7C3AED',
        'accent-green': '#059669',
        'accent-blue': '#2563EB',
        'accent-pink': '#DB2777',
        'accent-red': '#DC2626',
        'accent-orange': '#EA580C',
        'accent-cyan': '#0891B2',
        'code-bg': 'rgba(15,23,42,0.06)',
        'code-border': 'rgba(15,23,42,0.12)',
        'code-inline-bg': 'rgba(217,119,6,0.1)',
        'code-inline-border': 'rgba(217,119,6,0.2)',
        'code-inline-color': '#B45309',
    }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TOPICS = ['all', 'arrays', 'graphs', 'dynamic-programming', 'trees', 'binary-search', 'system-design', 'strings', 'backtracking']

const TOPIC_LABELS = {
    'all': 'All',
    'arrays': 'Arrays',
    'graphs': 'Graphs',
    'dynamic-programming': 'DP',
    'trees': 'Trees',
    'binary-search': 'Binary Search',
    'system-design': 'System Design',
    'strings': 'Strings',
    'backtracking': 'Backtracking',
}

const TOPIC_COLORS = {
    'arrays':              ['#E5A653', '#9F8FE3'],
    'graphs':              ['#10B981', '#34D399'],
    'dynamic-programming': ['#F59E0B', '#FCD34D'],
    'trees':               ['#9F8FE3', '#9F8FE3'],
    'binary-search':       ['#3B82F6', '#60A5FA'],
    'system-design':       ['#EC4899', '#F472B6'],
    'interview-tips':      ['#14B8A6', '#2DD4BF'],
    'strings':             ['#F97316', '#FB923C'],
    'backtracking':        ['#EF4444', '#F87171'],
    'general':             ['#94A3B8', '#CBD5E1'],
    'tutorials':           ['#8B5CF6', '#A78BFA'],
    'discussions':         ['#06B6D4', '#22D3EE'],
}

const FEED_TABS = [
    { id: 'feed',        label: 'Hot' },
    { id: 'latest',      label: 'Latest' },
    { id: 'top',         label: 'Top' },
    { id: 'tutorials',   label: 'Tutorials' },
    { id: 'discussions', label: 'Discussions' },
    { id: 'mine',        label: 'My Posts' },
]

const TRENDING_TOPICS = [
    { tag: 'SystemDesign',        count: '1.2k' },
    { tag: 'DynamicProgramming',  count: '845'  },
    { tag: 'FAANG_Interviews',    count: '632'  },
    { tag: 'Python',              count: '412'  },
]

const TOP_CONTRIBUTORS = [
    { name: 'Michael Chen', rep: '14k Rep', solutions: '42 Solutions', rank: 1 },
    { name: 'Emma Watson',  rep: '12k Rep', solutions: '38 Solutions', rank: 2 },
    { name: 'James Doe',    rep: '10k Rep', solutions: '29 Solutions', rank: 3 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCSSVar(varName, theme = 'dark') {
    return THEME_VARS[theme][varName] || THEME_VARS.dark[varName]
}

function topicColor(t) { return TOPIC_COLORS[t?.toLowerCase()] || TOPIC_COLORS.general }

function timeAgo(isoStr) {
    if (!isoStr) return ''
    const diff = (Date.now() - new Date(isoStr).getTime()) / 1000
    if (diff < 60)    return `${Math.floor(diff)}s ago`
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

function readTime(content) {
    const words = (content || '').trim().split(/\s+/).length
    return Math.max(1, Math.ceil(words / 200))
}

function difficultyBadge(post) {
    const theme = 'dark'
    if (post.featured) return { 
        label: 'STAFF PICK', 
        color: getCSSVar('accent-amber', theme), 
        bg: `rgba(229,166,83,0.12)`, 
        border: `rgba(229,166,83,0.3)` 
    }
    const words = (post.content || '').split(/\s+/).length
    if (words > 400) return { 
        label: 'HARD',   
        color: getCSSVar('accent-red', theme), 
        bg: `rgba(239,68,68,0.1)`,  
        border: `rgba(239,68,68,0.25)`  
    }
    if (words > 150) return { 
        label: 'MEDIUM', 
        color: getCSSVar('accent-orange', theme), 
        bg: `rgba(245,158,11,0.1)`, 
        border: `rgba(245,158,11,0.25)` 
    }
    return null
}

// Avatar 
function Avatar({ name, size = 36, colors }) {
    const [c1, c2] = colors || topicColor('general')
    const letter = (name || '?')[0].toUpperCase()
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: `linear-gradient(135deg,${c1},${c2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: size * 0.38, color: '#fff', flexShrink: 0,
        }}>
            {letter}
        </div>
    )
}

// Upvote column
function UpvoteCol({ count, liked, onLike, liking }) {
    const theme = 'dark'
    const fmt = n => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, minWidth: 42, paddingTop: 2,
        }}>
            <button
                onClick={e => { e.stopPropagation(); onLike() }}
                disabled={liking}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    color: liked ? getCSSVar('accent-amber', theme) : getCSSVar('text-tertiary', theme), 
                    transition: 'color .2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                </svg>
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: liked ? getCSSVar('accent-amber', theme) : getCSSVar('text-muted', theme), lineHeight: 1 }}>
                {fmt(count)}
            </span>
            <button
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    color: getCSSVar('text-tertiary', theme), display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
        </div>
    )
}

// Post Row 
function PostRow({ post, onLike, onDelete, myEmail, expanded, dimmed, onToggle }) {
    const [liking, setLiking]   = useState(false)
    const [liked, setLiked]     = useState(post.likedByMe)
    const [likes, setLikes]     = useState(post.likeCount)
    const [saved, setSaved]     = useState(post.savedByMe)
    const [savingPost, setSaving] = useState(false)
    const [c1, c2]              = topicColor(post.topic)
    const isOwner               = myEmail && post.userId === myEmail
    const badge                 = difficultyBadge(post)
    const isFeatured            = post.featured
    const theme                 = 'dark'

    async function handleLike() {
        setLiking(true)
        const r = await onLike(post.id)
        if (r.ok) { setLiked(r.data.liked); setLikes(r.data.likeCount) }
        setLiking(false)
    }

    async function handleSave(e) {
        e.stopPropagation()
        if (savingPost) return
        setSaving(true)
        const next = !saved
        setSaved(next)
        const r = next ? await api.savePost(post.id) : await api.unsavePost(post.id)
        if (!r.ok) setSaved(!next)
        setSaving(false)
    }

    return (
        <article
            style={{
                display: 'flex', gap: 0,
                background: isFeatured
                    ? `rgba(229,166,83,0.06)`
                    : expanded ? getCSSVar('card-bg-hover', theme) : getCSSVar('card-bg', theme),
                border: isFeatured
                    ? `1px solid rgba(229,166,83,0.25)`
                    : expanded ? `1px solid ${getCSSVar('card-border-hover', theme)}` : `1px solid ${getCSSVar('card-border', theme)}`,
                borderRadius: 14,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all .25s',
                opacity: dimmed ? 0.45 : 1,
                transform: dimmed ? 'scale(0.99)' : 'scale(1)',
                pointerEvents: dimmed ? 'none' : 'auto',
            }}
            onClick={onToggle}
            onMouseEnter={e => {
                if (!expanded && !isFeatured && !dimmed) {
                    e.currentTarget.style.background = getCSSVar('card-bg-hover', theme)
                    e.currentTarget.style.borderColor = getCSSVar('card-border-hover', theme)
                }
            }}
            onMouseLeave={e => {
                if (!expanded && !isFeatured && !dimmed) {
                    e.currentTarget.style.background = getCSSVar('card-bg', theme)
                    e.currentTarget.style.borderColor = getCSSVar('card-border', theme)
                }
            }}
        >
            {/* Left accent bar */}
            <div style={{ width: 3, background: `linear-gradient(180deg,${c1},${c2})`, flexShrink: 0 }} />

            {/* Upvote column */}
            <div style={{ padding: '16px 12px 16px 14px', flexShrink: 0 }}>
                <UpvoteCol count={likes} liked={liked} onLike={handleLike} liking={liking} />
            </div>

            {/* Main content */}
            <div style={{ flex: 1, padding: '16px 16px 16px 0', minWidth: 0 }}>

                {/* Top row: featured badge + badge + topic */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    {isFeatured && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: getCSSVar('accent-amber', theme), letterSpacing: '0.05em' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                            FEATURED
                        </span>
                    )}
                    {badge && (
                        <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                            color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
                            letterSpacing: '0.06em',
                        }}>{badge.label}</span>
                    )}
                    <span style={{
                        fontSize: 11, fontWeight: 600, color: c1,
                        background: `${c1}15`, border: `1px solid ${c1}25`,
                        padding: '2px 8px', borderRadius: 20,
                    }}>{post.topic}</span>
                </div>

                {/* Title */}
                <h3 style={{
                    fontSize: expanded ? 22 : 16, fontWeight: 800, lineHeight: 1.35,
                    color: getCSSVar('text-primary', theme), marginBottom: 8, letterSpacing: '-0.01em',
                    transition: 'font-size .2s',
                }}>
                    {post.title}
                </h3>

                {/* Preview / Full content */}
                {!expanded ? (
                    <p style={{
                        fontSize: 13.5, color: getCSSVar('text-muted', theme), lineHeight: 1.7,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        margin: 0,
                    }}>
                        {post.preview || post.content}
                    </p>
                ) : (
                    <div style={{ marginTop: 8 }}>
                        <Markdown text={post.content} theme={theme} />
                        <style>{getMarkdownCSS(theme)}</style>
                    </div>
                )}

                {/* Footer row */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: 12, flexWrap: 'wrap', gap: 8,
                }}>
                    {/* Author + time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={post.authorName || post.userId} size={26} colors={[c1, c2]} />
                        <span style={{ fontSize: 12.5, color: getCSSVar('text-muted', theme), fontWeight: 500 }}>
                            {post.authorName || post.userId}
                            {post.authorUsername && (
                                <span style={{ color: getCSSVar('accent-amber', theme), fontWeight: 600 }}> @{post.authorUsername}</span>
                            )}
                            <span style={{ color: getCSSVar('text-tertiary', theme) }}> · {timeAgo(post.createdAt)} · {readTime(post.content)} min read</span>
                        </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* Comments placeholder */}
                        <button
                            onClick={e => { e.stopPropagation(); onToggle() }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: getCSSVar('text-tertiary', theme), fontSize: 12.5, fontWeight: 600, padding: '4px 8px',
                                borderRadius: 7, transition: 'all .15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = `rgba(255,255,255,0.06)`; e.currentTarget.style.color = getCSSVar('text-muted', theme) }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = getCSSVar('text-tertiary', theme) }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                            </svg>
                            {post.commentCount ?? 0} Comments
                        </button>

                        {/* Save */}
                        <button
                            onClick={handleSave}
                            disabled={savingPost}
                            title={saved ? 'Saved' : 'Save'}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: saved ? getCSSVar('accent-amber', theme) : getCSSVar('text-tertiary', theme), fontSize: 14, padding: '4px 6px',
                                borderRadius: 7, transition: 'color .2s',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                            </svg>
                        </button>

                        {/* Share placeholder */}
                        <button
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: getCSSVar('text-tertiary', theme), padding: '4px 6px', borderRadius: 7, transition: 'color .2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = getCSSVar('text-muted', theme) }}
                            onMouseLeave={e => { e.currentTarget.style.color = getCSSVar('text-tertiary', theme) }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                        </button>

                        {/* Delete (owner only) */}
                        {isOwner && (
                            <button
                                onClick={e => { e.stopPropagation(); onDelete(post.id) }}
                                style={{
                                    background: `rgba(239,68,68,.08)`, border: `1px solid rgba(239,68,68,.2)`,
                                    color: getCSSVar('accent-red', theme), fontSize: 10, fontWeight: 700, padding: '3px 8px',
                                    borderRadius: 6, cursor: 'pointer',
                                }}
                            >
                                Delete
                            </button>
                        )}

                        {/* Collapse arrow when expanded */}
                        {expanded && (
                            <button
                                onClick={e => { e.stopPropagation(); onToggle() }}
                                style={{
                                    background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.1)`,
                                    color: getCSSVar('text-muted', theme), padding: '4px 10px', borderRadius: 7,
                                    fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="18 15 12 9 6 15"/>
                                </svg>
                                Collapse
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    )
}



function WeeklyChallengeWidget() {
    const theme = 'dark'
    return (
        <div style={{
            background: getCSSVar('card-bg', theme), border: `1px solid rgba(229,166,83,0.2)`,
            borderRadius: 14, padding: '18px 18px', overflow: 'hidden', position: 'relative',
        }}>
            {/* Glow */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: 'radial-gradient(circle,rgba(229,166,83,0.15),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: getCSSVar('accent-amber', theme), letterSpacing: '0.08em' }}>WEEKLY CHALLENGE</span>
                <span style={{ marginLeft: 'auto', fontSize: 18 }}>🏆</span>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: getCSSVar('text-primary', theme), lineHeight: 1.3, marginBottom: 8 }}>
                Solve "Rainwater Trapping"
            </h3>
            <p style={{ fontSize: 12.5, color: getCSSVar('text-muted', theme), lineHeight: 1.6, marginBottom: 14 }}>
                Join 2,451 other developers tackling this classic array problem. 3 days left!
            </p>
            <button style={{
                width: '100%', padding: '9px 0', borderRadius: 8, fontWeight: 700,
                fontSize: 13, cursor: 'pointer', border: `1px solid rgba(229,166,83,0.4)`,
                background: `rgba(229,166,83,0.1)`, color: getCSSVar('accent-amber', theme),
                transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
                onMouseEnter={e => { e.currentTarget.style.background = `rgba(229,166,83,0.2)` }}
                onMouseLeave={e => { e.currentTarget.style.background = `rgba(229,166,83,0.1)` }}
            >
                Attempt Now →
            </button>
        </div>
    )
}

function TrendingTopicsWidget() {
    const theme = 'dark'
    return (
        <div style={{
            background: getCSSVar('card-bg', theme), border: `1px solid ${getCSSVar('card-border', theme)}`,
            borderRadius: 14, padding: '16px 18px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={getCSSVar('accent-amber', theme)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 800, color: getCSSVar('text-muted', theme), letterSpacing: '0.07em' }}>TRENDING TOPICS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {TRENDING_TOPICS.map((t, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 0', borderBottom: i < TRENDING_TOPICS.length - 1 ? `1px solid ${getCSSVar('card-border', theme)}` : 'none',
                        cursor: 'pointer',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.75' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                    >
                        <span style={{ fontSize: 13, fontWeight: 600, color: getCSSVar('text-secondary', theme) }}>
                            <span style={{ color: getCSSVar('accent-amber', theme) }}>#</span> {t.tag}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: getCSSVar('text-tertiary', theme) }}>{t.count}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function TopContributorsWidget() {
    const theme = 'dark'
    const rankColors = [getCSSVar('accent-amber', theme), getCSSVar('text-muted', theme), '#CD7F32']
    return (
        <div style={{
            background: getCSSVar('card-bg', theme), border: `1px solid ${getCSSVar('card-border', theme)}`,
            borderRadius: 14, padding: '16px 18px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <span style={{ fontSize: 14 }}>🏅</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: getCSSVar('text-muted', theme), letterSpacing: '0.07em' }}>TOP CONTRIBUTORS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {TOP_CONTRIBUTORS.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Rank badge */}
                        <div style={{
                            width: 22, height: 22, borderRadius: '50%', background: `${rankColors[i]}20`,
                            border: `1px solid ${rankColors[i]}40`, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 10, fontWeight: 800, color: rankColors[i], flexShrink: 0,
                        }}>{c.rank}</div>
                        {/* Avatar */}
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${rankColors[i]}, ${rankColors[i]}88)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
                        }}>{c.name[0]}</div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: getCSSVar('text-secondary', theme), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: getCSSVar('text-tertiary', theme) }}>{c.rep} · {c.solutions}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function CommunityStatsWidget() {
    const theme = 'dark'
    return (
        <div style={{
            background: getCSSVar('card-bg', theme), border: `1px solid ${getCSSVar('card-border', theme)}`,
            borderRadius: 14, padding: '16px 18px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
        }}>
            <div style={{ textAlign: 'center', padding: '8px 0', borderRight: `1px solid ${getCSSVar('card-border', theme)}` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: getCSSVar('text-primary', theme) }}>1,204</div>
                <div style={{ fontSize: 11, color: getCSSVar('text-muted', theme), marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                    ONLINE
                </div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: getCSSVar('text-primary', theme) }}>342</div>
                <div style={{ fontSize: 11, color: getCSSVar('text-muted', theme), marginTop: 2 }}>POSTS TODAY</div>
            </div>
        </div>
    )
}

// Search Bar
function SearchBar({ value, onChange }) {
    const theme = 'dark'
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: `rgba(255,255,255,0.05)`, border: `1px solid rgba(255,255,255,0.09)`,
            borderRadius: 10, padding: '8px 14px', flex: 1, maxWidth: 340,
            transition: 'border-color .2s',
        }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(229,166,83,0.4)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
        >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={getCSSVar('text-tertiary', theme)} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="Search discussions..."
                style={{
                    background: 'none', border: 'none', outline: 'none',
                    fontSize: 13, color: getCSSVar('text-secondary', theme), flex: 1,
                    '::placeholder': { color: getCSSVar('text-tertiary', theme) },
                }}
            />
        </div>
    )
}

// Markdown renderer 
function safeLinkUrl(raw) {
    if (raw == null) return null
    const url = String(raw).trim()
    if (!url) return null
    if (url.startsWith('/') || url.startsWith('#')) return url
    const lower = url.toLowerCase()
    if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('mailto:')) return url
    return null
}

function mdInline(s, keyBase = 'i') {
    if (!s) return null
    const out = []
    let i = 0, k = 0
    const RE = /(`[^`\n]+`)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|_([^_\n]+)_|\[([^\]]+)]\(([^)\s]+)\)/g
    let m
    while ((m = RE.exec(s)) !== null) {
        if (m.index > i) out.push(s.slice(i, m.index))
        const key = keyBase + '-' + k++
        if (m[1]) out.push(<code key={key} className="md-icode">{m[1].slice(1, -1)}</code>)
        else if (m[2]) out.push(<strong key={key}>{m[2]}</strong>)
        else if (m[3]) out.push(<em key={key}>{m[3]}</em>)
        else if (m[4]) out.push(<em key={key}>{m[4]}</em>)
        else if (m[5]) {
            const safe = safeLinkUrl(m[6])
            if (safe) out.push(<a key={key} href={safe} target="_blank" rel="noopener noreferrer nofollow" className="md-link">{m[5]}</a>)
            else out.push(<span key={key} className="md-link-blocked" title="Link blocked: unsupported URL">{m[5]}</span>)
        }
        i = RE.lastIndex
    }
    if (i < s.length) out.push(s.slice(i))
    return out
}

function Markdown({ text, theme = 'dark' }) {
    if (!text) return null
    const lines = text.replace(/\r\n/g, '\n').split('\n')
    const blocks = []
    let i = 0, k = 0
    while (i < lines.length) {
        const line = lines[i]
        if (/^```/.test(line)) {
            const code = []; i++
            while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++ }
            i++
            blocks.push(<pre key={k++} className="md-block"><code>{code.join('\n')}</code></pre>)
            continue
        }
        if (/^\s*---\s*$/.test(line)) { blocks.push(<hr key={k++} className="md-hr" />); i++; continue }
        const h = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/)
        if (h) {
            const level = h[1].length, cls = `md-h${level}`
            if (level === 1) blocks.push(<h1 key={k++} className={cls}>{mdInline(h[2], 'h' + k)}</h1>)
            else if (level === 2) blocks.push(<h2 key={k++} className={cls}>{mdInline(h[2], 'h' + k)}</h2>)
            else blocks.push(<h3 key={k++} className={cls}>{mdInline(h[2], 'h' + k)}</h3>)
            i++; continue
        }
        if (/^>\s?/.test(line)) {
            const items = []
            while (i < lines.length && /^>\s?/.test(lines[i])) { items.push(lines[i].replace(/^>\s?/, '')); i++ }
            blocks.push(<blockquote key={k++} className="md-quote">{items.map((ln, j) => <p key={j}>{mdInline(ln, 'q' + k + '-' + j)}</p>)}</blockquote>)
            continue
        }
        if (/^\s*[-*]\s+/.test(line)) {
            const items = []
            while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++ }
            blocks.push(<ul key={k++} className="md-ul">{items.map((ln, j) => <li key={j}>{mdInline(ln, 'ul' + k + '-' + j)}</li>)}</ul>)
            continue
        }
        if (/^\s*\d+\.\s+/.test(line)) {
            const items = []
            while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++ }
            blocks.push(<ol key={k++} className="md-ol">{items.map((ln, j) => <li key={j}>{mdInline(ln, 'ol' + k + '-' + j)}</li>)}</ol>)
            continue
        }
        if (/^\s*$/.test(line)) { i++; continue }
        const para = [line]; i++
        while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,3}\s|>\s?|```|\s*---\s*$|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i])) { para.push(lines[i]); i++ }
        blocks.push(<p key={k++} className="md-p">{mdInline(para.join(' '), 'p' + k)}</p>)
    }
    return <div className="md-body">{blocks}</div>
}

//Markdown CSS
function getMarkdownCSS(theme = 'dark') {
    return `
.md-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:4px; padding:6px 8px; margin-bottom:14px; background:rgba(15,23,42,0.55); border:1px solid rgba(255,255,255,0.06); border-radius:12px; backdrop-filter:blur(6px); }
.md-tb-btn { min-width:32px; height:32px; padding:0 10px; background:transparent; border:1px solid transparent; color:#CBD5E1; font-size:13px; font-weight:600; letter-spacing:0.02em; border-radius:8px; cursor:pointer; transition:background 0.15s,color 0.15s,border-color 0.15s,transform 0.1s; display:inline-flex; align-items:center; justify-content:center; }
.md-tb-btn:hover { background:rgba(229,166,83,0.12); color:#F8FAFC; border-color:rgba(229,166,83,0.25); }
.md-tb-btn:active { transform:translateY(1px); }
.md-tb-bold { font-weight:900; } .md-tb-italic { font-style:italic; } .md-tb-mono { font-family:'JetBrains Mono','Fira Code',ui-monospace,monospace; font-size:12px; }
.md-tb-sep { width:1px; height:18px; background:rgba(255,255,255,0.08); margin:0 4px; display:inline-block; }
.md-hint { display:flex; flex-wrap:wrap; gap:10px 16px; align-items:center; margin-top:18px; padding-top:14px; border-top:1px dashed rgba(255,255,255,0.06); font-size:12px; color:#64748B; }
.md-hint-k { font-family:'JetBrains Mono','Fira Code',ui-monospace,monospace; font-size:11.5px; color:#94A3B8; background:rgba(15,23,42,0.6); padding:2px 7px; border-radius:5px; border:1px solid rgba(255,255,255,0.05); }
.md-hint-muted { margin-left:auto; opacity:0.6; font-style:italic; }
.md-body { font-size:15px; line-height:1.8; color:#CBD5E1; letter-spacing:0.005em; }
.md-body > * + * { margin-top:16px; }
.md-h1,.md-h2,.md-h3 { color:#F1F5F9; font-weight:800; letter-spacing:-0.02em; line-height:1.25; margin-top:32px; }
.md-h1 { font-size:24px; margin-top:24px; } .md-h2 { font-size:20px; padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.07); } .md-h3 { font-size:17px; color:#E2E8F0; }
.md-p { margin:0; }
.md-body strong { color:#F1F5F9; font-weight:800; } .md-body em { color:#E2E8F0; font-style:italic; }
.md-icode { font-family:'JetBrains Mono','Fira Code',ui-monospace,monospace; font-size:0.88em; padding:2px 7px; border-radius:5px; background:rgba(229,166,83,0.1); border:1px solid rgba(229,166,83,0.18); color:#F3C887; }
.md-block { font-family:'JetBrains Mono','Fira Code',ui-monospace,monospace; font-size:13px; line-height:1.65; padding:14px 16px; background:rgba(8,12,30,0.8); border:1px solid rgba(255,255,255,0.06); border-left:3px solid rgba(229,166,83,0.5); border-radius:10px; color:#E2E8F0; overflow-x:auto; }
.md-block code { background:none; border:none; padding:0; color:inherit; font-size:inherit; }
.md-ul,.md-ol { margin:0; padding-left:24px; color:#CBD5E1; } .md-ul li,.md-ol li { margin:6px 0; padding-left:4px; line-height:1.7; }
.md-ul li::marker { color:#E5A653; } .md-ol li::marker { color:#9F8FE3; font-weight:700; }
.md-quote { margin:0; padding:4px 18px; border-left:3px solid rgba(159,143,227,0.7); background:rgba(159,143,227,0.05); color:#E2E8F0; font-style:italic; border-radius:0 10px 10px 0; }
.md-quote p { margin:8px 0; }
.md-hr { border:none; height:1px; background:linear-gradient(90deg,transparent,rgba(229,166,83,0.3),transparent); margin:24px 0; }
.md-link { color:#F3C887; text-decoration:none; border-bottom:1px solid rgba(243,200,135,0.35); transition:color 0.15s,border-color 0.15s; }
.md-link:hover { color:#FFE4BC; border-bottom-color:rgba(255,228,188,0.7); }
.md-link-blocked { color:#94A3B8; text-decoration:line-through; text-decoration-color:rgba(148,163,184,0.5); cursor:not-allowed; }
`
}

// Write Editor
const TOOLS = [
    { id: 'b',   label: 'B',     title: 'Bold (Ctrl+B)',   bold: true,   apply: ta => mdWrap(ta, '**', '**', 'bold text') },
    { id: 'i',   label: 'I',     title: 'Italic (Ctrl+I)', italic: true, apply: ta => mdWrap(ta, '*', '*', 'italic') },
    { id: 'c',   label: '`',     title: 'Inline code',     mono: true,   apply: ta => mdWrap(ta, '`', '`', 'code') },
    { id: 's1',  separator: true },
    { id: 'h1',  label: 'H1',    title: 'Heading 1',       apply: ta => mdLinePrefix(ta, '# ') },
    { id: 'h2',  label: 'H2',    title: 'Heading 2',       apply: ta => mdLinePrefix(ta, '## ') },
    { id: 'h3',  label: 'H3',    title: 'Heading 3',       apply: ta => mdLinePrefix(ta, '### ') },
    { id: 's2',  separator: true },
    { id: 'ul',  label: '• List', title: 'Bullet list',    apply: ta => mdLinePrefix(ta, '- ') },
    { id: 'ol',  label: '1. List',title: 'Numbered list',  apply: ta => mdLinePrefix(ta, '1. ') },
    { id: 'q',   label: '❝',     title: 'Blockquote',      apply: ta => mdLinePrefix(ta, '> ') },
    { id: 's3',  separator: true },
    { id: 'cb',  label: '</> Code', title: 'Code block (```)', mono: true, apply: ta => mdCodeBlock(ta) },
    { id: 'hr',  label: '—',     title: 'Divider (---)',   apply: ta => mdInsertAt(ta, '\n---\n') },
]

function mdWrap(ta, before, after = before, placeholder = '') {
    const start = ta.selectionStart, end = ta.selectionEnd, v = ta.value
    const sel = v.slice(start, end) || placeholder
    const next = v.slice(0, start) + before + sel + after + v.slice(end)
    return { value: next, selStart: start + before.length, selEnd: start + before.length + sel.length }
}

function mdLinePrefix(ta, prefix) {
    const start = ta.selectionStart, end = ta.selectionEnd, v = ta.value
    const lineStart = v.lastIndexOf('\n', start - 1) + 1
    let lineEnd = v.indexOf('\n', end); if (lineEnd === -1) lineEnd = v.length
    const block = v.slice(lineStart, lineEnd)
    const replaced = block.split('\n').map(ln => prefix + ln).join('\n')
    const next = v.slice(0, lineStart) + replaced + v.slice(lineEnd)
    return { value: next, selStart: lineStart, selEnd: lineStart + replaced.length }
}

function mdInsertAt(ta, snippet) {
    const start = ta.selectionStart, v = ta.value
    const next = v.slice(0, start) + snippet + v.slice(start)
    return { value: next, selStart: start + snippet.length, selEnd: start + snippet.length }
}

function mdCodeBlock(ta, lang = '', placeholder = 'code') {
    const start = ta.selectionStart, end = ta.selectionEnd, v = ta.value
    const sel = v.slice(start, end) || placeholder
    const needLead = start > 0 && v[start - 1] !== '\n'
    const needTrail = end < v.length && v[end] !== '\n'
    const before = (needLead ? '\n' : '') + '```' + lang + '\n'
    const after = '\n```' + (needTrail ? '\n' : '')
    const next = v.slice(0, start) + before + sel + after + v.slice(end)
    return { value: next, selStart: start + before.length, selEnd: start + before.length + sel.length }
}

function WriteEditor({ onCancel, onPublished }) {
    const [form, setForm]       = useState({ title: '', topic: 'arrays', content: '' })
    const [formErr, setFormErr] = useState('')
    const [submitting, setSub]  = useState(false)
    const [preview, setPreview] = useState(false)
    const textareaRef           = useRef(null)
    const [c1]                  = topicColor(form.topic)
    const theme                 = 'dark'

    useEffect(() => {
        const onKey = e => { if (e.key === 'Escape') onCancel() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onCancel])

    function autoResize(el) {
        if (!el) return
        if (el.scrollHeight > el.clientHeight) { el.style.height = el.scrollHeight + 'px'; return }
        requestAnimationFrame(() => {
            if (!el.isConnected) return
            const sy = window.scrollY
            el.style.height = 'auto'
            el.style.height = el.scrollHeight + 'px'
            if (window.scrollY !== sy) window.scrollTo(0, sy)
        })
    }

    function applyFormat(fn) {
        const ta = textareaRef.current; if (!ta) return
        const r = fn(ta); if (!r) return
        setForm(f => ({ ...f, content: r.value }))
        requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(r.selStart, r.selEnd); autoResize(ta) })
    }

    function onBodyKeyDown(e) {
        const mod = e.ctrlKey || e.metaKey; if (!mod) return
        const key = e.key.toLowerCase()
        if (key === 'b') { e.preventDefault(); applyFormat(ta => mdWrap(ta, '**', '**', 'bold text')) }
        else if (key === 'i') { e.preventDefault(); applyFormat(ta => mdWrap(ta, '*', '*', 'italic')) }
        else if (key === 'k') { e.preventDefault(); applyFormat(ta => mdWrap(ta, '`', '`', 'code')) }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!form.title.trim()) { setFormErr('Title is required'); return }
        if (!form.content.trim()) { setFormErr('Content is required'); return }
        setSub(true)
        const r = await api.createPost(form)
        setSub(false)
        if (r.ok) onPublished()
        else setFormErr(r.error || 'Failed to publish')
    }

    return (
        <div style={{ maxWidth: 760, margin: '0 auto', paddingBottom: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <button onClick={onCancel} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `rgba(255,255,255,.05)`, border: `1px solid rgba(255,255,255,.1)`, color: getCSSVar('text-muted', theme), padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>
                    ← Back
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setPreview(p => !p)} style={{ padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: 12.5, cursor: 'pointer', border: `1px solid rgba(255,255,255,.12)`, background: preview ? `rgba(229,166,83,.12)` : `rgba(255,255,255,.04)`, color: preview ? getCSSVar('accent-amber', theme) : getCSSVar('text-muted', theme) }}>
                        {preview ? 'Edit' : 'Preview'}
                    </button>
                    <button onClick={handleSubmit} disabled={submitting} style={{ padding: '8px 22px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none', background: `linear-gradient(135deg,#E5A653,#9F8FE3)`, color: '#fff', opacity: submitting ? 0.7 : 1 }}>
                        {submitting ? 'Publishing…' : 'Publish Post'}
                    </button>
                </div>
            </div>

            <div style={{ background: getCSSVar('card-bg', theme), border: `1px solid ${getCSSVar('card-border', theme)}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ height: 3, background: `linear-gradient(90deg,${c1},#9F8FE3)` }} />
                <form onSubmit={handleSubmit} style={{ padding: '28px 32px' }}>
                    {formErr && (
                        <div style={{ background: `rgba(239,68,68,.1)`, border: `1px solid rgba(239,68,68,.25)`, color: getCSSVar('accent-red', theme), padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 20 }}>
                            {formErr}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                        <select value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} style={{ background: `rgba(255,255,255,.06)`, border: `1px solid rgba(255,255,255,.1)`, color: getCSSVar('text-secondary', theme), padding: '8px 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer', outline: 'none' }}>
                            {TOPICS.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Post title…" style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 26, fontWeight: 800, color: getCSSVar('text-primary', theme), letterSpacing: '-0.02em', marginBottom: 20, padding: 0, boxSizing: 'border-box' }} />
                    <div style={{ height: 1, background: `rgba(255,255,255,.07)`, marginBottom: 20 }} />
                    {!preview ? (
                        <>
                            <div className="md-toolbar" role="toolbar">
                                {TOOLS.map(t => t.separator
                                    ? <span key={t.id} className="md-tb-sep" aria-hidden />
                                    : <button key={t.id} type="button" title={t.title} onClick={() => applyFormat(t.apply)} className={'md-tb-btn' + (t.bold ? ' md-tb-bold' : '') + (t.italic ? ' md-tb-italic' : '') + (t.mono ? ' md-tb-mono' : '')}>{t.label}</button>
                                )}
                            </div>
                            <textarea ref={textareaRef} value={form.content} onChange={e => { setForm(f => ({ ...f, content: e.target.value })); autoResize(e.target) }} onKeyDown={onBodyKeyDown} placeholder="Start writing your post…" style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 16, color: getCSSVar('text-secondary', theme), lineHeight: 1.85, resize: 'none', fontFamily: 'inherit', minHeight: 360, padding: 0, boxSizing: 'border-box' }} />
                            <div className="md-hint">
                                <span><strong className="md-hint-k">**bold**</strong></span>
                                <span><em className="md-hint-k">*italic*</em></span>
                                <span><code className="md-hint-k">```code```</code></span>
                                <span><span className="md-hint-k"># Heading</span></span>
                                <span><span className="md-hint-k">- list</span></span>
                                <span><span className="md-hint-k">&gt; quote</span></span>
                                <span className="md-hint-muted">markdown supported</span>
                            </div>
                        </>
                    ) : (
                        <div style={{ minHeight: 360 }}>
                            {form.content ? <Markdown text={form.content} theme={theme} /> : <p style={{ color: getCSSVar('text-tertiary', theme), fontStyle: 'italic' }}>Nothing to preview yet.</p>}
                        </div>
                    )}
                </form>
            </div>
            <style>{getMarkdownCSS(theme)}</style>
        </div>
    )
}

export default function CommunityPage() {
    const navigate = useNavigate()
    const theme = 'dark'

    const [activeTab, setActiveTab] = useState('feed')
    const [topic, setTopic]       = useState('all')
    const [posts, setPosts]       = useState([])
    const [myPosts, setMyPosts]   = useState([])
    const [loading, setLoading]   = useState(true)
    const [page, setPage]         = useState(0)
    const [hasNext, setHasNext]   = useState(false)
    const [expandedId, setExpandedId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [view, setView]         = useState('feed')
    const myEmail = api.getUserEmail?.() || ''

    useEffect(() => {
        if (!api.isAuthenticated()) { navigate('/login'); return }
        loadFeed(0)
    }, [topic, activeTab])

    async function loadFeed(pg = 0) {
        setLoading(true)
        const effectiveTopic = activeTab === 'tutorials' ? 'interview-tips'
            : activeTab === 'discussions' ? 'general'
            : topic

        const r = effectiveTopic === 'all' || activeTab === 'feed' || activeTab === 'latest' || activeTab === 'top'
            ? await api.fetchFeed(pg, 10)
            : await api.fetchFeedByTopic(effectiveTopic, pg, 10)

        if (r.ok) {
            setPosts(pg === 0 ? r.data.posts : prev => [...prev, ...r.data.posts])
            setHasNext(r.data.hasNext)
            setPage(pg)
        }
        setLoading(false)
    }

    async function loadMine() {
        const r = await api.fetchMyPosts()
        if (r.ok) setMyPosts(r.data)
    }

    useEffect(() => { if (activeTab === 'mine') loadMine() }, [activeTab])

    function openWrite() { setView('write') }
    function closeWrite() { setView('feed') }
    function afterPublish() { setView('feed'); loadFeed(0); setActiveTab('feed') }

    async function handleLike(postId) { return api.toggleLike(postId) }

    async function handleDelete(postId) {
        if (!confirm('Delete this post?')) return
        const r = await api.deletePost(postId)
        if (r.ok) { loadFeed(0); if (activeTab === 'mine') loadMine() }
    }

    function toggleExpand(postId) {
        setExpandedId(prev => prev === postId ? null : postId)
    }

    const displayedPosts = (activeTab === 'mine' ? myPosts : posts).filter(p => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return (p.title || '').toLowerCase().includes(q)
            || (p.content || '').toLowerCase().includes(q)
            || (p.authorName || '').toLowerCase().includes(q)
            || (p.topic || '').toLowerCase().includes(q)
    })

    if (view === 'write') {
        return (
            <div className="app-shell">
                <Sidebar />
                <div className="main-content">
                    <Topbar title="Write a Post" subtitle="Share your insight with the community" />
                    <main className="page-content">
                        <WriteEditor onCancel={closeWrite} onPublished={afterPublish} />
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="app-shell" style={{ background: `linear-gradient(140deg,${getCSSVar('bg-primary', theme)},${getCSSVar('bg-secondary', theme)} 50%,${getCSSVar('bg-primary', theme)})` }}>
            <div style={{ position: 'fixed', top: -200, left: 80, width: 500, height: 500, background: 'radial-gradient(circle,rgba(229,166,83,0.05),transparent 65%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

            <Sidebar />
            <div className="main-content" style={{ position: 'relative', zIndex: 1 }}>
                <Topbar title="Community" subtitle="Insights and tips from fellow developers" />
                <main className="page-content">

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: 32, fontWeight: 900, color: getCSSVar('text-primary', theme), letterSpacing: '-0.03em', margin: 0, flex: '0 0 auto' }}>
                            Community
                        </h1>
                        <div style={{ flex: 1 }}>
                            <SearchBar value={searchQuery} onChange={setSearchQuery} />
                        </div>
                        <button
                            onClick={openWrite}
                            id="community-new-post-btn"
                            style={{
                                background: 'linear-gradient(135deg,#E5A653,#9F8FE3)', color: '#fff',
                                border: 'none', padding: '9px 20px', borderRadius: 10,
                                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(229,166,83,0.35)',
                                display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            New Post
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

                        <div>
                            <div style={{
                                display: 'flex', gap: 0, borderBottom: `1px solid ${getCSSVar('card-border', theme)}`,
                                marginBottom: 16, overflowX: 'auto',
                            }}>
                                {FEED_TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        id={`community-tab-${tab.id}`}
                                        onClick={() => { setActiveTab(tab.id); setExpandedId(null) }}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            padding: '10px 16px', fontSize: 13.5, fontWeight: 700,
                                            color: activeTab === tab.id ? getCSSVar('text-primary', theme) : getCSSVar('text-tertiary', theme),
                                            borderBottom: activeTab === tab.id ? '2px solid #E5A653' : '2px solid transparent',
                                            marginBottom: -1, transition: 'all .15s', whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {['feed', 'latest', 'top'].includes(activeTab) && (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                                    {TOPICS.map(t => {
                                        const [bg] = topicColor(t)
                                        const sel = topic === t
                                        return (
                                            <button
                                                key={t}
                                                id={`community-topic-${t}`}
                                                onClick={() => { setTopic(t); setPage(0); setExpandedId(null) }}
                                                style={{
                                                    padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                                                    cursor: 'pointer', border: '1px solid', transition: 'all .18s',
                                                    background: sel ? `linear-gradient(135deg,${topicColor(t)[0]},${topicColor(t)[1]})` : getCSSVar('card-bg', theme),
                                                    color: sel ? '#fff' : getCSSVar('text-muted', theme),
                                                    borderColor: sel ? 'transparent' : getCSSVar('card-border', theme),
                                                    boxShadow: sel ? `0 2px 10px ${topicColor(t)[0]}40` : 'none',
                                                }}
                                            >
                                                {TOPIC_LABELS[t] || t}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {loading && page === 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 14 }}>
                                    <div style={{ width: 36, height: 36, border: `3px solid rgba(229,166,83,0.2)`, borderTop: '3px solid #E5A653', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                                    <div style={{ color: getCSSVar('text-muted', theme), fontSize: 13 }}>Loading community feed…</div>
                                </div>
                            )}

                            {!loading && displayedPosts.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '70px 32px', color: getCSSVar('text-muted', theme) }}>
                                    <div style={{ fontSize: 48, marginBottom: 14 }}>
                                        {searchQuery ? '🔍' : activeTab === 'mine' ? '✍️' : '📝'}
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: getCSSVar('text-muted', theme) }}>
                                        {searchQuery
                                            ? `No results for "${searchQuery}"`
                                            : activeTab === 'mine'
                                                ? 'No posts yet'
                                                : `No posts yet ${topic !== 'all' ? `in "${TOPIC_LABELS[topic] || topic}"` : ''}`}
                                    </div>
                                    <div style={{ fontSize: 13, marginBottom: 20 }}>
                                        {searchQuery
                                            ? 'Try a different search term'
                                            : activeTab === 'mine'
                                                ? 'Share a tip, a walkthrough, or something that helped you crack a problem.'
                                                : 'Be the first to share something!'}
                                    </div>
                                    {!searchQuery && (
                                        <button
                                            onClick={openWrite}
                                            style={{ background: 'linear-gradient(135deg,#E5A653,#9F8FE3)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 11, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                                        >
                                            {activeTab === 'mine' ? 'Write your first post' : 'Write a Post'}
                                        </button>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {displayedPosts.map((p, idx) => (
                                    <PostRow
                                        key={p.id}
                                        post={{ ...p, featured: idx === 0 && activeTab === 'feed' && topic === 'all' && !searchQuery }}
                                        onLike={handleLike}
                                        onDelete={handleDelete}
                                        myEmail={myEmail}
                                        expanded={expandedId === p.id}
                                        dimmed={expandedId !== null && expandedId !== p.id}
                                        onToggle={() => toggleExpand(p.id)}
                                    />
                                ))}
                            </div>

                            {hasNext && !searchQuery && (
                                <div style={{ textAlign: 'center', marginTop: 24 }}>
                                    <button
                                        onClick={() => loadFeed(page + 1)}
                                        disabled={loading}
                                        style={{
                                            background: `rgba(229,166,83,0.08)`, border: `1px solid rgba(229,166,83,0.2)`,
                                            color: '#9F8FE3', padding: '10px 32px', borderRadius: 11,
                                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                        }}
                                    >
                                        {loading ? 'Loading…' : 'Load more'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 20 }}>
                            <WeeklyChallengeWidget />
                            <TrendingTopicsWidget />
                            <TopContributorsWidget />
                            <CommunityStatsWidget />
                        </div>
                    </div>

                </main>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}