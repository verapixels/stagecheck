// ─── TicketingLoadingTransition.tsx ────────────────────────────────────────
// Full-screen animated loader shown the instant a user clicks "Get Tickets",
// while we navigate to /events/:id/tickets and fetch ticket data.
// Drop this in directly above wherever "Get Tickets" is clicked:
//
//   const [navigating, setNavigating] = useState(false)
//   ...
//   {navigating && <TicketingLoadingTransition eventName={event.name} />}
//
//   const handleGetTickets = () => {
//     setNavigating(true)
//     setTimeout(() => navigate(`/events/${event.id}/tickets`), 900)
//   }

import { RiTicket2Fill } from 'react-icons/ri'

export default function TicketingLoadingTransition({ eventName }: { eventName?: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#060e1c',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 22,
      fontFamily: 'Inter, sans-serif',
    }}>
      <style>{`
        @keyframes tk-pulse-ring {
          0%   { transform: scale(0.8); opacity: 0.7; }
          70%  { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes tk-pop {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.08); }
        }
        @keyframes tk-bar {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes tk-dot {
          0%, 80%, 100% { opacity: 0.25; }
          40%           { opacity: 1; }
        }
      `}</style>

      <div style={{ position: 'relative', width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(13,199,94,0.25)',
          animation: 'tk-pulse-ring 1.6s cubic-bezier(0.4,0,0.6,1) infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(13,199,94,0.25)',
          animation: 'tk-pulse-ring 1.6s cubic-bezier(0.4,0,0.6,1) infinite',
          animationDelay: '0.5s',
        }} />
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #0dc75e, #0a9f4b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'tk-pop 1.2s ease-in-out infinite',
          boxShadow: '0 0 30px rgba(13,199,94,0.5)',
        }}>
          <RiTicket2Fill size={28} color="#00210d" />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
          Preparing your tickets{eventName ? ` for ${eventName}` : ''}
        </div>
        <div style={{ color: '#c4cbdb', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          Hang tight
          <span style={{ animation: 'tk-dot 1.4s infinite' }}>.</span>
          <span style={{ animation: 'tk-dot 1.4s infinite', animationDelay: '0.2s' }}>.</span>
          <span style={{ animation: 'tk-dot 1.4s infinite', animationDelay: '0.4s' }}>.</span>
        </div>
      </div>

      <div style={{ width: 180, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: '#0dc75e', borderRadius: 999,
          animation: 'tk-bar 0.9s ease forwards',
        }} />
      </div>
    </div>
  )
}