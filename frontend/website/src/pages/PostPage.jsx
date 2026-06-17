import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/TopBar'
import * as api from '../services/api'

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
    return Math.max(1, Math.ceil((content || '').trim().split(/\s+/).length / 200))
}

// ── Markdown (same as CommunityPage) ─────────────────────────────────────────
function safeLinkUrl(raw) {
    if (!raw) return null
    const url = String(raw).trim()
    if (!url) return null
    if (url.startsWith('/') || url.startsWith('#')) return url
    const lower = url.toLowerCase()
    if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('mailto:')) return url
    return null
}

function mdInline(s, keyBase = 'i') {
    if (!s) return null
    const out = []; let i = 0, k = 0
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
            else out.push(<span key={key} className="md-link-blocked">{m[5]}</span>)
        }
        i = RE.lastIndex
    }
    if (i < s.length) out.push(s.slice(i))
    return out
}

function Markdown({ text }) {
    if (!text) return null
    const lines = text.replace(/\r\n/g, '\n').split('\n')
    const blocks = []; let i = 0, k = 0
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
            const level = h[1].length
            if (level === 1) blocks.push(<h1 key={k++} className="md-h1">{mdInline(h[2], 'h' + k)}</h1>)
            else if (level === 2) blocks.push(<h2 key={k++} className="md-h2">{mdInline(h[2], 'h' + k)}</h2>)
            else blocks.push(<h3 key={k++} className="md-h3">{mdInline(h[2], 'h' + k)}</h3>)
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

const MD_CSS = `
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
.md-link { color:#F3C887; text-decoration:none; border-bottom:1px solid rgba(243,200,135,0.35); }
.md-link:hover { color:#FFE4BC; }
.md-link-blocked { color:#94A3B8; text-decoration:line-through; cursor:not-allowed; }
`

export default function PostPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [post, setPost]     = useState(null)
    const [loading, setLoading] = useState(true)
    const [liked, setLiked]   = useState(false)
    const [likes, setLikes]   = useState(0)
    const [liking, setLiking] = useState(false)
    const [saved, setSaved]   = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!api.isAuthenticated()) { navigate('/login'); return }
        api.fetchPost(id).then(r => {
            if (r.ok) {
                setPost(r.data)
                setLiked(r.data.likedByMe)
                setLikes(r.data.likeCount)
                setSaved(r.data.savedByMe)
            }
            setLoading(false)
        })
    }, [id])

    async function handleLike() {
        if (liking) return
        setLiking(true)
        const r = await api.toggleLike(id)
        if (r.ok) { setLiked(r.data.liked); setLikes(r.data.likeCount) }
        setLiking(false)
    }

    async function handleSave() {
        if (saving) return
        setSaving(true)
        const next = !saved
        setSaved(next)
        const r = next ? await api.savePost(id) : await api.unsavePost(id)
        if (!r.ok) setSaved(!next)
        setSaving(false)
    }

    const [c1, c2] = post ? topicColor(post.topic) : ['#94A3B8', '#CBD5E1']

    return (
        <div className="app-shell" style={{ background: 'linear-gradient(140deg,#0B0F1A,#121727 50%,#0B0F1A)' }}>
            <Sidebar />
            <div className="main-content">
                <Topbar title="Community" subtitle="Post" />
                <main className="page-content">

                    {/* Back button */}
                    <button
                        onClick={() => navigate('/community')}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
                            color: '#94A3B8', padding: '8px 16px', borderRadius: 10,
                            fontWeight: 600, fontSize: 12.5, cursor: 'pointer', marginBottom: 24,
                        }}
                    >
                        ← Back to Community
                    </button>

                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                            <div style={{ width: 36, height: 36, border: '3px solid rgba(229,166,83,0.2)', borderTop: '3px solid #E5A653', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                        </div>
                    )}

                    {!loading && !post && (
                        <div style={{ textAlign: 'center', padding: 80, color: '#64748B' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#94A3B8' }}>Post not found</div>
                        </div>
                    )}

                    {!loading && post && (
                        <div style={{ maxWidth: 760, margin: '0 auto' }}>
                            <article style={{
                                background: 'rgba(255,255,255,0.025)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 16, overflow: 'hidden',
                            }}>
                                {/* Top accent bar */}
                                <div style={{ height: 3, background: `linear-gradient(90deg,${c1},${c2})` }} />

                                <div style={{ padding: '28px 32px' }}>
                                    {/* Topic pill */}
                                    <div style={{ marginBottom: 14 }}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, color: c1,
                                            background: `${c1}15`, border: `1px solid ${c1}25`,
                                            padding: '3px 10px', borderRadius: 20,
                                        }}>{post.topic}</span>
                                    </div>

                                    {/* Title */}
                                    <h1 style={{
                                        fontSize: 26, fontWeight: 900, color: '#F1F5F9',
                                        lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 16,
                                    }}>
                                        {post.title}
                                    </h1>

                                    {/* Author row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            background: `linear-gradient(135deg,${c1},${c2})`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, fontSize: 14, color: '#fff', flexShrink: 0,
                                        }}>
                                            {(post.authorName || post.userId || '?')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0' }}>
                                                {post.authorName || post.userId}
                                            </span>
                                            {post.authorUsername && (
                                                <span style={{ color: '#E5A653', fontWeight: 600, fontSize: 13 }}> @{post.authorUsername}</span>
                                            )}
                                            <div style={{ fontSize: 12, color: '#475569', marginTop: 1 }}>
                                                {timeAgo(post.createdAt)} · {readTime(post.content)} min read
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <Markdown text={post.content} />

                                    {/* Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                                        {/* Like */}
                                        <button
                                            onClick={handleLike}
                                            disabled={liking}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 7,
                                                background: liked ? 'rgba(229,166,83,0.12)' : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${liked ? 'rgba(229,166,83,0.35)' : 'rgba(255,255,255,0.1)'}`,
                                                color: liked ? '#E5A653' : '#94A3B8',
                                                padding: '8px 16px', borderRadius: 10,
                                                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                                transition: 'all .2s',
                                            }}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="18 15 12 9 6 15" />
                                            </svg>
                                            {likes} {likes === 1 ? 'Upvote' : 'Upvotes'}
                                        </button>

                                        {/* Save */}
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 7,
                                                background: saved ? 'rgba(229,166,83,0.12)' : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${saved ? 'rgba(229,166,83,0.35)' : 'rgba(255,255,255,0.1)'}`,
                                                color: saved ? '#E5A653' : '#94A3B8',
                                                padding: '8px 16px', borderRadius: 10,
                                                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                                transition: 'all .2s',
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                                            </svg>
                                            {saved ? 'Saved' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        </div>
                    )}
                </main>
            </div>
            <style>{MD_CSS}</style>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
