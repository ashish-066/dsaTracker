import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import * as api from '../services/api'

const TOPICS = ['all', 'arrays', 'graphs', 'dynamic-programming', 'trees', 'binary-search', 'system-design', 'interview-tips', 'strings', 'backtracking']

const TOPIC_COLORS = {
    'arrays': ['#6366F1', '#818CF8'],
    'graphs': ['#10B981', '#34D399'],
    'dynamic-programming': ['#F59E0B', '#FCD34D'],
    'trees': ['#8B5CF6', '#A78BFA'],
    'binary-search': ['#3B82F6', '#60A5FA'],
    'system-design': ['#EC4899', '#F472B6'],
    'interview-tips': ['#14B8A6', '#2DD4BF'],
    'strings': ['#F97316', '#FB923C'],
    'backtracking': ['#EF4444', '#F87171'],
    'general': ['#94A3B8', '#CBD5E1'],
}

function topicColor(t) { return TOPIC_COLORS[t?.toLowerCase()] || TOPIC_COLORS.general }

function timeAgo(isoStr) {
    if (!isoStr) return ''
    const diff = (Date.now() - new Date(isoStr).getTime()) / 1000
    if (diff < 60) return `${Math.floor(diff)}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

function TopicTag({ t, small }) {
    const [bg, text] = topicColor(t)
    return (
        <span style={{
            fontSize: small ? 10 : 11, fontWeight: 700, padding: small ? '2px 8px' : '3px 11px',
            borderRadius: 20, background: `${bg}18`, color: bg,
            border: `1px solid ${bg}30`, cursor: 'default'
        }}>{t}</span>
    )
}

function PostCard({ post, onLike, onDelete, myEmail, onOpen }) {
    const [liking, setLiking] = useState(false)
    const [liked, setLiked] = useState(post.likedByMe)
    const [likes, setLikes] = useState(post.likeCount)

    async function handleLike(e) {
        e.stopPropagation()
        setLiking(true)
        const r = await onLike(post.id)
        if (r.ok) { setLiked(r.data.liked); setLikes(r.data.likeCount) }
        setLiking(false)
    }

    const isOwner = myEmail && post.userId === myEmail

    return (
        <div onClick={() => onOpen(post)} style={{
            background: 'rgba(255,255,255,.028)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 22,
            cursor: 'pointer', transition: 'all .2s',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,.25)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${topicColor(post.topic)[0]},${topicColor(post.topic)[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff', flexShrink: 0 }}>
                        {(post.authorName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{post.authorName || post.userId}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</div>
                    </div>
                </div>
                <TopicTag t={post.topic} small />
            </div>

            {/* Title */}
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, lineHeight: 1.4, color: 'var(--text-primary)' }}>{post.title}</h3>

            {/* Preview */}
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 14 }}>{post.preview}</p>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={handleLike} disabled={liking} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: liked ? '#EF4444' : 'var(--text-muted)',
                        fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'all .2s', padding: 0
                    }}>
                        {liked ? '❤️' : '🤍'} {likes}
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📖 Quick read</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#6366F1', fontWeight: 600 }}>Read more →</span>
                    {isOwner && (
                        <button onClick={e => { e.stopPropagation(); onDelete(post.id) }} style={{
                            background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)',
                            color: '#EF4444', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 8, cursor: 'pointer'
                        }}>Delete</button>
                    )}
                </div>
            </div>
        </div>
    )
}

function PostModal({ post, onClose, onLike, myEmail }) {
    const [liked, setLiked] = useState(post.likedByMe)
    const [likes, setLikes] = useState(post.likeCount)

    useEffect(() => {
        const onKey = e => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    async function handleLike() {
        const r = await onLike(post.id)
        if (r.ok) { setLiked(r.data.liked); setLikes(r.data.likeCount) }
    }

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#0f1629', border: '1px solid rgba(99,102,241,.25)', borderRadius: 20, padding: 32, maxWidth: 680, width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.05)', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', width: 32, height: 32, borderRadius: 8 }}>✕</button>

                <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TopicTag t={post.topic} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, lineHeight: 1.4 }}>{post.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${topicColor(post.topic)[0]},${topicColor(post.topic)[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff' }}>
                        {(post.authorName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{post.authorName || post.userId}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</div>
                    </div>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{post.content}</p>
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={handleLike} style={{ background: liked ? 'rgba(239,68,68,.1)' : 'rgba(255,255,255,.05)', border: `1px solid ${liked ? 'rgba(239,68,68,.3)' : 'rgba(255,255,255,.08)'}`, color: liked ? '#EF4444' : 'var(--text-muted)', padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {liked ? '❤️' : '🤍'} {likes} {likes === 1 ? 'like' : 'likes'}
                    </button>
                    <button onClick={onClose} style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.3)', color: '#818CF8', padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Close</button>
                </div>
            </div>
        </div>
    )
}

export default function CommunityPage() {
    const navigate = useNavigate()
    const [tab, setTab] = useState('feed')
    const [topic, setTopic] = useState('all')
    const [posts, setPosts] = useState([])
    const [myPosts, setMyPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [hasNext, setHasNext] = useState(false)
    const [openPost, setOpenPost] = useState(null)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState({ title: '', topic: 'arrays', content: '' })
    const [formErr, setFormErr] = useState('')
    const [submitting, setSub] = useState(false)
    const myEmail = api.getUserEmail?.() || ''

    useEffect(() => {
        if (!api.isAuthenticated()) { navigate('/login'); return }
        loadFeed(0)
    }, [topic])

    async function loadFeed(pg = 0) {
        setLoading(true)
        const r = topic === 'all'
            ? await api.fetchFeed(pg, 10)
            : await api.fetchFeedByTopic(topic, pg, 10)
        if (r.ok) {
            if (pg === 0) { setPosts(r.data.posts) }
            else { setPosts(prev => [...prev, ...r.data.posts]) }
            setHasNext(r.data.hasNext)
            setPage(pg)
        }
        setLoading(false)
    }

    async function loadMore() { loadFeed(page + 1) }

    async function loadMine() {
        const r = await api.fetchMyPosts()
        if (r.ok) setMyPosts(r.data)
    }

    useEffect(() => { if (tab === 'mine') loadMine() }, [tab])

    async function handleCreate(e) {
        e.preventDefault(); setFormErr('')
        if (!form.title.trim() || !form.content.trim()) { setFormErr('Title and content are required'); return }
        if (form.content.length > 1200) { setFormErr('Content must be under 1200 characters'); return }
        setSub(true)
        const r = await api.createPost(form.title, form.topic, form.content)
        setSub(false)
        if (r.ok) {
            setCreating(false); setForm({ title: '', topic: 'arrays', content: '' })
            loadFeed(0)
        } else { setFormErr(r.error || 'Failed to create post') }
    }

    async function handleLike(postId) { return api.toggleLike(postId) }

    async function handleDelete(postId) {
        if (!confirm('Delete this post?')) return
        const r = await api.deletePost(postId)
        if (r.ok) { loadFeed(0); if (tab === 'mine') loadMine() }
    }

    const charLeft = 1200 - form.content.length

    return (
        <div className="app-shell" style={{ background: 'linear-gradient(140deg,#07091a,#0d1327 50%,#080c1a)' }}>
            <div style={{ position: 'fixed', top: -180, left: 60, width: 400, height: 400, background: 'radial-gradient(circle,rgba(99,102,241,.06),transparent 65%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
            <Sidebar />
            <div className="main-content" style={{ position: 'relative', zIndex: 1 }}>
                <Topbar title="Community" subtitle="Quick reads from fellow developers" />
                <main className="page-content">

                    {/* ── Header actions ── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[['feed', '📰 Feed'], ['mine', '✍️ My Posts']].map(([k, l]) => (
                                <button key={k} onClick={() => setTab(k)} style={{ padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer', border: '1px solid', transition: 'all .2s', background: tab === k ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,.03)', color: tab === k ? '#fff' : 'var(--text-muted)', borderColor: tab === k ? 'transparent' : 'rgba(255,255,255,.08)' }}>
                                    {l}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setCreating(true)} style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,.35)' }}>
                            ✏️ Write a Post
                        </button>
                    </div>

                    {/* ── Create Post Modal ── */}
                    {creating && (
                        <div onClick={() => setCreating(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                            <form onClick={e => e.stopPropagation()} onSubmit={handleCreate} style={{ background: '#0f1629', border: '1px solid rgba(99,102,241,.25)', borderRadius: 20, padding: 32, maxWidth: 600, width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 800 }}>Write a Quick Read</h2>
                                    <button type="button" onClick={() => setCreating(false)} style={{ background: 'rgba(255,255,255,.05)', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', width: 32, height: 32, borderRadius: 8 }}>✕</button>
                                </div>
                                {formErr && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#EF4444', padding: '9px 14px', borderRadius: 10, fontSize: 12, marginBottom: 14 }}>{formErr}</div>}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Title</label>
                                        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Why BFS is underrated for shortest path" style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Topic</label>
                                        <select value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} style={{ width: '100%', background: '#0f1629', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                                            {TOPICS.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Content <span style={{ color: charLeft < 100 ? '#EF4444' : '#94A3B8', fontWeight: 400 }}>({charLeft} chars left)</span></label>
                                        <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={7} placeholder="Share your insight, tip, or walkthrough…" style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                                    </div>
                                    <button type="submit" disabled={submitting} style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none', padding: '12px', borderRadius: 11, fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
                                        {submitting ? 'Publishing…' : 'Publish Post'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ── Feed Tab ── */}
                    {tab === 'feed' && (<>
                        {/* Topic filter chips */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                            {TOPICS.map(t => (
                                <button key={t} onClick={() => { setTopic(t); setPage(0) }} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: 'all .2s', background: topic === t ? `linear-gradient(135deg,${topicColor(t)[0]},${topicColor(t)[1]})` : 'rgba(255,255,255,.04)', color: topic === t ? '#fff' : 'var(--text-muted)', borderColor: topic === t ? 'transparent' : 'rgba(255,255,255,.08)' }}>
                                    {t === 'all' ? '🌐 All' : t}
                                </button>
                            ))}
                        </div>

                        {loading && page === 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 14 }}>
                                <div style={{ width: 38, height: 38, border: '3px solid rgba(99,102,241,.2)', borderTop: '3px solid #6366F1', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading community feed…</div>
                            </div>
                        )}

                        {!loading && posts.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px 32px', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No posts yet {topic !== 'all' ? `in "${topic}"` : ''}</div>
                                <div style={{ fontSize: 13 }}>Be the first to share something!</div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
                            {posts.map(p => (
                                <PostCard key={p.id} post={p} onLike={handleLike} onDelete={handleDelete} myEmail={myEmail} onOpen={setOpenPost} />
                            ))}
                        </div>

                        {hasNext && (
                            <div style={{ textAlign: 'center', marginTop: 24 }}>
                                <button onClick={loadMore} disabled={loading} style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.3)', color: '#818CF8', padding: '10px 28px', borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                    {loading ? 'Loading…' : 'Load more'}
                                </button>
                            </div>
                        )}
                    </>)}

                    {/* ── My Posts Tab ── */}
                    {tab === 'mine' && (
                        myPosts.length === 0
                            ? (<div style={{ textAlign: 'center', padding: '60px 32px', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No posts yet</div>
                                <div style={{ fontSize: 13 }}>Click "Write a Post" to share your first quick read!</div>
                                <button onClick={() => setCreating(true)} style={{ marginTop: 16, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 11, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Write a Post</button>
                            </div>)
                            : (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
                                {myPosts.map(p => (
                                    <PostCard key={p.id} post={p} onLike={handleLike} onDelete={handleDelete} myEmail={myEmail} onOpen={setOpenPost} />
                                ))}
                            </div>)
                    )}

                    {/* ── Full Post Modal ── */}
                    {openPost && <PostModal post={openPost} onClose={() => setOpenPost(null)} onLike={handleLike} myEmail={myEmail} />}
                </main>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
