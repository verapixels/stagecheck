import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/Authcontext'
import DashboardLayout from '../../components/DashboardLayout'
import {
  Film, Upload, Trash2, Loader2, Image, Video,
  FileText, Download, X, Eye, Plus
} from 'lucide-react'

import { storage } from '../../lib/firebase'
import { useEvent } from '../../context/Eventcontext'

interface MediaItem {
  id: string
  filename: string
  url: string
  uploadedBy: string
  uploaderName: string
  uploadedAt?: any
  type: 'image' | 'video' | 'document'
  size?: number
  storagePath?: string
}

function getMediaType(filename: string): 'image' | 'video' | 'document' {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video'
  return 'document'
}

export default function MediaPage() {
  const { eventId } = useParams<{ eventId: string }>()
const { eventType, enabledModules, loading: metaLoading } = useEvent()
  const { user }    = useAuth()
  const [items, setItems]         = useState<MediaItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [preview, setPreview]     = useState<MediaItem | null>(null)
  const [filter, setFilter]       = useState<'all' | 'image' | 'video' | 'document'>('all')
  const fileInputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!eventId) return
    const unsub = onSnapshot(collection(db, 'events', eventId, 'media'), snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem)))
      setLoading(false)
    })
    return () => unsub()
  }, [eventId])

  const handleUpload = async (files: FileList | null) => {
    if (!files || !eventId || !user) return
    setUploading(true)
    setProgress(0)

    for (const file of Array.from(files)) {
      try {
        let url = ''
        let storagePath = ''

        if (storage) {
          storagePath = `events/${eventId}/media/${Date.now()}_${file.name}`
          const storageRef = ref(storage, storagePath)
          await new Promise<void>((resolve, reject) => {
            const task = uploadBytesResumable(storageRef, file)
            task.on('state_changed',
              snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
              reject,
              async () => { url = await getDownloadURL(storageRef); resolve() }
            )
          })
        } else {
          // Fallback: create object URL (dev only, not persistent)
          url = URL.createObjectURL(file)
        }

        await addDoc(collection(db, 'events', eventId, 'media'), {
          filename: file.name,
          url,
          storagePath,
          uploadedBy: user.uid,
          uploaderName: user.displayName || user.email || 'Organiser',
          type: getMediaType(file.name),
          size: file.size,
          uploadedAt: serverTimestamp(),
        })
      } catch (err) {
        console.error('Upload error:', err)
      }
    }
    setUploading(false)
    setProgress(0)
  }

  const handleDelete = async (item: MediaItem) => {
    if (!eventId) return
    try {
      if (storage && item.storagePath) {
        await deleteObject(ref(storage, item.storagePath))
      }
      await deleteDoc(doc(db, 'events', eventId, 'media', item.id))
      if (preview?.id === item.id) setPreview(null)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleUpload(e.dataTransfer.files)
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)

  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
  }

  return (
    <DashboardLayout
  plan="starter"
  eventType={eventType ?? 'custom'}
  eventId={eventId}
  enabledModules={enabledModules}
>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Film size={20} color="#3B82F6" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-0.5px', color: '#fff' }}>
              Media Hub
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            {items.length} files uploaded
          </p>
        </div>
        <button onClick={() => fileInputRef.current?.click()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#3B82F6', border: 'none', color: '#fff', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
          <Plus size={15} /> Upload Files
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.pptx,.docx" style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files)} />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Images',    value: items.filter(i => i.type === 'image').length,    color: '#22C55E', icon: <Image size={14} />    },
          { label: 'Videos',    value: items.filter(i => i.type === 'video').length,    color: '#F59E0B', icon: <Video size={14} />    },
          { label: 'Documents', value: items.filter(i => i.type === 'document').length, color: '#3B82F6', icon: <FileText size={14} /> },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          border: '2px dashed rgba(59,130,246,0.3)', borderRadius: 14, padding: '24px',
          textAlign: 'center', marginBottom: 20, transition: 'all 0.2s', cursor: 'pointer',
          background: 'rgba(59,130,246,0.03)',
        }}
        onDragEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)'; e.currentTarget.style.background = 'rgba(59,130,246,0.06)' }}
        onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; e.currentTarget.style.background = 'rgba(59,130,246,0.03)' }}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Loader2 size={24} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ width: 200, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#3B82F6', borderRadius: 3, transition: 'width 0.2s' }} />
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Uploading... {progress}%</span>
          </div>
        ) : (
          <>
            <Upload size={28} color="rgba(59,130,246,0.5)" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              Drop files here or click to upload
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
              Images, videos, PDFs, PPTX accepted
            </div>
          </>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'image', 'video', 'document'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)', transition: 'all 0.15s', textTransform: 'capitalize',
              borderColor: filter === f ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)',
              background: filter === f ? 'rgba(59,130,246,0.1)' : 'transparent',
              color: filter === f ? '#3B82F6' : 'rgba(255,255,255,0.4)',
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', padding: '32px 0' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px 24px', textAlign: 'center' }}>
          <Film size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
            {items.length === 0 ? 'No files uploaded yet.' : 'No files of this type.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {filtered.map(item => (
            <div key={item.id} style={{
              background: 'rgba(19,26,46,0.8)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, overflow: 'hidden', position: 'relative', group: true,
            } as any}>
              {/* Preview */}
              <div style={{ height: 130, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {item.type === 'image' ? (
                  <img src={item.url} alt={item.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
                ) : item.type === 'video' ? (
                  <Video size={32} color="rgba(245,158,11,0.5)" />
                ) : (
                  <FileText size={32} color="rgba(59,130,246,0.5)" />
                )}
                {/* Hover actions overlay */}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  opacity: 0, transition: 'opacity 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                >
                  <button onClick={() => setPreview(item)}
                    style={{ padding: '7px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                    <Eye size={15} />
                  </button>
                  <a href={item.url} download={item.filename} target="_blank" rel="noreferrer"
                    style={{ padding: '7px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                    <Download size={15} />
                  </a>
                  <button onClick={() => handleDelete(item)}
                    style={{ padding: '7px', borderRadius: 8, background: 'rgba(248,113,113,0.2)', border: 'none', color: '#F87171', cursor: 'pointer' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                  {item.filename}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                  {item.uploaderName} {item.size ? `· ${formatSize(item.size)}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <button onClick={() => setPreview(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh' }}>
            {preview.type === 'image' && (
              <img src={preview.url} alt={preview.filename} style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
            )}
            {preview.type === 'video' && (
              <video src={preview.url} controls style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12 }} />
            )}
            {preview.type === 'document' && (
              <div style={{ background: 'rgba(19,26,46,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '40px', textAlign: 'center' }}>
                <FileText size={48} color="#3B82F6" style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 16, color: '#fff', marginBottom: 8 }}>{preview.filename}</div>
                <a href={preview.url} download={preview.filename} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#3B82F6', color: '#fff', padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                  <Download size={14} /> Download
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}