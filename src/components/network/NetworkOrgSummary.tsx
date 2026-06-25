import { GitBranch, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface OrgLevel {
  name: string
  count: number
  color: string
}

interface Props {
  levels: OrgLevel[]
  eventId: string
}

const glass: React.CSSProperties = {
  background: 'rgba(12,17,35,0.8)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 18,
  overflow: 'hidden',
}

export default function NetworkOrgSummary({ levels, eventId }: Props) {
  return (
    <div style={glass}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitBranch size={14} color="#6366F1" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            Org Structure
          </span>
        </div>
        <Link
          to={`/manage/event/${eventId}/network/org-builder`}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#818CF8', textDecoration: 'none', fontWeight: 600 }}
        >
          Manage <ChevronRight size={12} />
        </Link>
      </div>

      {levels.length === 0 ? (
        <div style={{ padding: '30px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            No org levels defined yet
          </p>
          <Link
            to={`/manage/event/${eventId}/network/org-builder`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
              fontSize: 12, fontWeight: 700, color: '#6366F1',
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
              padding: '7px 14px', borderRadius: 9, textDecoration: 'none',
            }}
          >
            <GitBranch size={12} /> Build Org Structure
          </Link>
        </div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {levels.map((level, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
              borderBottom: i < levels.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: level.color, flexShrink: 0,
                boxShadow: `0 0 6px ${level.color}60`,
              }} />
              <div style={{
                flex: 1, fontSize: 13, color: '#fff', fontWeight: 500,
                paddingLeft: i * 12,
              }}>
                {level.name}
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, color: level.color,
                background: `${level.color}14`, border: `1px solid ${level.color}25`,
                padding: '3px 10px', borderRadius: 7,
              }}>
                {level.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}