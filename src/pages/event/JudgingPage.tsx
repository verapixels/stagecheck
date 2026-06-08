import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, onSnapshot, addDoc, updateDoc, doc, query,
  where, serverTimestamp, getDoc
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/Authcontext'
import DashboardLayout from '../../components/DashboardLayout'
import { Trophy, Star, Loader2, ChevronUp, ChevronDown, Medal } from 'lucide-react'


interface Performer {
  id: string
  name: string
  song?: string
  category?: string
}

interface ScoreDoc {
  id: string
  submissionId: string
  judgeId: string
  judgeName: string
  scores: Record<string, number>
  total: number
  createdAt?: any
}

// Criteria per event type
const CRITERIA: Record<string, string[]> = {
  choir:       ['Vocal Blend', 'Intonation', 'Dynamics', 'Stage Presence', 'Diction'],
  talent:      ['Performance', 'Creativity', 'Stage Presence', 'Technical Skill', 'Audience Impact'],
  competition: ['Content', 'Delivery', 'Technical Accuracy', 'Presentation', 'Overall'],
  drama:       ['Acting', 'Direction', 'Script', 'Stagecraft', 'Overall Impact'],
  openmic:     ['Originality', 'Delivery', 'Engagement', 'Technical Skill', 'Overall'],
  conference:  ['Content Quality', 'Delivery', 'Relevance', 'Engagement', 'Overall'],
  default:     ['Criteria 1', 'Criteria 2', 'Criteria 3', 'Overall'],
}

export default function JudgingPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { user }    = useAuth()
  const [performers, setPerformers] = useState<Performer[]>([])
  const [scores, setScores]         = useState<ScoreDoc[]>([])
  const [eventType, setEventType]   = useState('choir')
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<Performer | null>(null)
  const [draft, setDraft]           = useState<Record<string, number>>({})
  const [saving, setSaving]         = useState(false)
  const [activeTab, setActiveTab]   = useState<'score' | 'rankings'>('score')

  const criteria = CRITERIA[eventType] ?? CRITERIA.default

  useEffect(() => {
    if (!eventId) return
    getDoc(doc(db, 'events', eventId)).then(snap => {
      if (snap.exists()) setEventType(snap.data().eventType ?? 'choir')
    })

    // Approved submissions
    const unsubSubs = onSnapshot(collection(db, 'events', eventId, 'submissions'), snap => {
      const approved = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter((d: any) => d.status === 'approved')
        .map((d: any) => ({
          id: d.id,
          name: d.groupName || d.performerName || d.speakerName || d.teamName || d.ministerName || d.awardeeName || d.entryName || d.email || 'Unknown',
          song: d.songSearch || d.actTitle || d.topic || '',
          category: d.category || d.actType || '',
        }))
      setPerformers(approved)
      setLoading(false)
    })

    // Scores
    const unsubScores = onSnapshot(collection(db, 'events', eventId, 'scores'), snap => {
      setScores(snap.docs.map(d => ({ id: d.id, ...d.data() } as ScoreDoc)))
    })

    return () => { unsubSubs(); unsubScores() }
  }, [eventId])

  // When a performer is selected, pre-fill draft with existing score if judge already scored them
  useEffect(() => {
    if (!selected || !user) return
    const existing = scores.find(s => s.submissionId === selected.id && s.judgeId === user.uid)
    if (existing) setDraft(existing.scores)
    else setDraft(Object.fromEntries(criteria.map(c => [c, 0])))
  }, [selected, scores, user])

  const handleScore = (criterion: string, value: number) => {
    setDraft(prev => ({ ...prev, [criterion]: Math.min(10, Math.max(0, value)) }))
  }

  const handleSubmitScore = async () => {
    if (!eventId || !selected || !user) return
    setSaving(true)
    try {
      const total = Object.values(draft).reduce((a, b) => a + b, 0)
      const existing = scores.find(s => s.submissionId === selected.id && s.judgeId === user.uid)
      const payload = {
        submissionId: selected.id,
        judgeId: user.uid,
        judgeName: user.displayName || user.email || 'Judge',
        scores: draft,
        total,
        updatedAt: serverTimestamp(),
      }
      if (existing) {
        await updateDoc(doc(db, 'events', eventId, 'scores', existing.id), payload)
      } else {
        await addDoc(collection(db, 'events', eventId, 'scores'), { ...payload, createdAt: serverTimestamp() })
      }
      setSelected(null)
    } finally {
      setSaving(false)
    }
  }

  // Rankings: average total across all judges per performer
  const rankings = performers.map(p => {
    const pScores = scores.filter(s => s.submissionId === p.id)
    const avg = pScores.length > 0 ? pScores.reduce((a, s) => a + s.total, 0) / pScores.length : 0
    const judgeCount = pScores.length
    return { ...p, avg: Math.round(avg * 10) / 10, judgeCount }
  }).sort((a, b) => b.avg - a.avg)

  const myScore = (pId: string) => scores.find(s => s.submissionId === pId && s.judgeId === user?.uid)

  const cardStyle: React.CSSProperties = {
    background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
  }
  const tabStyle = (t: 'score' | 'rankings'): React.CSSProperties => ({
    padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    fontFamily: 'var(--font-body)', transition: 'all 0.15s',
    background: activeTab === t ? 'rgba(245,158,11,0.12)' : 'transparent',
    color: activeTab === t ? '#F59E0B' : 'rgba(255,255,255,0.4)',
  })

  return (
    <DashboardLayout plan="starter" eventType={eventType} eventId={eventId}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Trophy size={20} color="#F59E0B" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-0.5px', color: '#fff' }}>
              Judging & Scoring
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            {performers.length} performers · {scores.length} score entries
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={tabStyle('score')} onClick={() => setActiveTab('score')}>Score Performers</button>
          <button style={tabStyle('rankings')} onClick={() => setActiveTab('rankings')}>Live Rankings</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Performers', value: performers.length, color: '#fff' },
          { label: 'Scored',     value: performers.filter(p => scores.some(s => s.submissionId === p.id)).length, color: '#22C55E' },
          { label: 'Judges',     value: [...new Set(scores.map(s => s.judgeId))].length, color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', padding: '32px 0' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
        </div>
      ) : activeTab === 'score' ? (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16, alignItems: 'start' }} className="judge-layout">
          {/* Performer list */}
          <div style={cardStyle}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Select a performer to score
            </div>
            {performers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
                No approved performers yet.
              </div>
            ) : performers.map(p => {
              const my = myScore(p.id)
              const isSelected = selected?.id === p.id
              return (
                <div key={p.id} onClick={() => setSelected(isSelected ? null : p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
                    background: isSelected ? 'rgba(245,158,11,0.06)' : 'transparent', transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{p.name}</div>
                    {p.song && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{p.song}</div>}
                  </div>
                  {my
                    ? <span style={{ fontSize: 12, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '3px 10px', borderRadius: 6 }}>
                        Scored: {my.total}
                      </span>
                    : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 6 }}>Not scored</span>
                  }
                </div>
              )
            })}
          </div>

          {/* Score panel */}
          {selected && (
            <div style={{ ...cardStyle, position: 'sticky', top: 24 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 2 }}>{selected.name}</div>
                {selected.song && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{selected.song}</div>}
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                  {criteria.map(c => (
                    <div key={c}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{c}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>{draft[c] ?? 0}<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>/10</span></span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                          <button key={n} onClick={() => handleScore(c, n)}
                            style={{
                              flex: 1, height: 28, borderRadius: 5, border: 'none', cursor: 'pointer',
                              background: (draft[c] ?? 0) >= n ? '#F59E0B' : 'rgba(255,255,255,0.07)',
                              transition: 'all 0.1s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = (draft[c] ?? 0) >= n ? '#F59E0B' : 'rgba(245,158,11,0.3)'}
                            onMouseLeave={e => e.currentTarget.style.background = (draft[c] ?? 0) >= n ? '#F59E0B' : 'rgba(255,255,255,0.07)'}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Total Score</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-display)' }}>
                    {Object.values(draft).reduce((a, b) => a + b, 0)}<span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>/{criteria.length * 10}</span>
                  </span>
                </div>

                <button onClick={handleSubmitScore} disabled={saving}
                  style={{ width: '100%', background: '#F59E0B', border: 'none', color: '#0B1020', padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Star size={15} />}
                  Submit Score
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Rankings tab */
        <div style={cardStyle}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Leaderboard</div>
          </div>
          {rankings.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)',
                background: i === 0 ? 'rgba(245,158,11,0.2)' : i === 1 ? 'rgba(156,163,175,0.15)' : i === 2 ? 'rgba(180,120,60,0.15)' : 'rgba(255,255,255,0.06)',
                color: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#B47C3C' : 'rgba(255,255,255,0.4)',
              }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.name}</div>
                {p.song && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{p.song}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: i < 3 ? '#F59E0B' : '#fff', fontFamily: 'var(--font-display)' }}>
                  {p.avg}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>avg · {p.judgeCount} judge{p.judgeCount !== 1 ? 's' : ''}</div>
              </div>
            </div>
          ))}
          {rankings.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
              No scores submitted yet.
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .judge-layout { grid-template-columns: 1fr !important; } }
      `}</style>
    </DashboardLayout>
  )
}