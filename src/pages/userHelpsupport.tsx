// src/pages/HelpSupport.tsx
import { useState } from 'react'
import {
  HelpCircle, Search, Ticket, Calendar, CreditCard, User,
  ChevronRight, ChevronDown, Mail, MessageCircle, Clock,
  Phone, CheckCircle, BookOpen, Zap,
} from 'lucide-react'
import UserDashboardLayout from '../components/UserDashboardLayout'
import { useAuth } from '../context/Authcontext'
import { useUserInvitations } from '../lib/useUserInvitations'

const TABS = [
  { key: 'browse',  label: 'Browse Topics', icon: <BookOpen size={15} /> },
  { key: 'faq',     label: 'FAQs',          icon: <HelpCircle size={15} /> },
  { key: 'contact', label: 'Contact Us',    icon: <Mail size={15} /> },
  { key: 'status',  label: 'System Status', icon: <Zap size={15} /> },
]

const POPULAR_TOPICS = [
  { icon: <Ticket size={20} />,     bg: 'rgba(13,199,94,0.12)',   color: '#0dc75e', title: 'Tickets & Orders',      desc: 'Buying, managing and using your tickets.' },
  { icon: <Calendar size={20} />,   bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', title: 'Events & Invitations',  desc: 'How events and invitations work.' },
  { icon: <CreditCard size={20} />, bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', title: 'Payments & Refunds',    desc: 'Payments, refunds and invoices.' },
  { icon: <User size={20} />,       bg: 'rgba(249,115,22,0.12)', color: '#fb923c', title: 'Account & Profile',     desc: 'Account settings and preferences.' },
]

const BROWSE_CATEGORIES = [
  { icon: '🚀', label: 'Getting Started',    sub: 'New to StageCheck? Start here.' },
  { icon: '🎟️', label: 'Buying Tickets',     sub: 'Everything about purchasing tickets.' },
  { icon: '📱', label: 'Using Your Tickets', sub: 'Access, view QR codes and manage tickets.' },
  { icon: '⚙️', label: 'Account & Settings', sub: 'Manage your profile and preferences.' },
  { icon: '🔧', label: 'Troubleshooting',    sub: 'Fix common issues and errors.' },
]

const FAQS = [
  { q: 'How do I view my ticket QR code?',       a: 'Go to My Tickets, select a ticket from the list, and the QR code will appear in the detail panel. You can also download it for offline use.' },
  { q: 'Can I download my ticket?',              a: 'Yes. Open your ticket in the My Tickets section and click "Download QR Code". A PNG will be saved to your device.' },
  { q: 'How do I transfer a ticket?',            a: 'Ticket transfers are handled by the event organiser. Contact them directly through the event page or reach out to our support team.' },
  { q: 'What is the refund policy?',             a: "Refund eligibility depends on the event organiser's policy. Check the event page for details or contact support if you need assistance." },
  { q: 'How do I contact the event organiser?',  a: 'Visit the event page and look for the organiser\'s contact information, or use the Contact Us tab to reach our support team.' },
  { q: 'Why is my payment not going through?',   a: 'Ensure your card details are correct and your bank has not blocked the transaction. Try a different payment method or contact your bank.' },
  { q: 'How do I save an event for later?',      a: 'On any event page, tap the heart icon to save it. Saved events appear in your Saved Events section on your dashboard.' },
]

const SUPPORT_EMAILS = [
  'support@stagecheck.com.ng',
  'hello@stagecheck.com.ng',
  'enquiry@stagecheck.com.ng',
]

export default function UserHelpSupport() {
  const { user } = useAuth()
  const { pending } = useUserInvitations(user?.uid, user?.email)
  const [activeTab, setActiveTab] = useState('browse')
  const [search, setSearch]       = useState('')
  const [openFaq, setOpenFaq]     = useState<number | null>(null)
  const [chatStarted, setChatStarted] = useState(false)

  const filteredFaqs = search.trim()
    ? FAQS.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
    : FAQS

  return (
    <UserDashboardLayout invitationCount={pending.length}>
      <style>{`
        /* ── Tabs ─────────────────────────────────────────── */
        .h-tabs {
          display: flex; gap: 4px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 6px;
          margin-bottom: 28px;
          overflow-x: auto; scrollbar-width: none;
        }
        .h-tabs::-webkit-scrollbar { display: none; }
        .h-tab {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 18px; border: none; background: none;
          cursor: pointer; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.5); border-radius: 8px;
          white-space: nowrap; flex-shrink: 0;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif;
        }
        .h-tab.active { background: rgba(13,199,94,0.12); color: #0dc75e; }
        .h-tab:hover:not(.active) { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }

        /* ── Topic cards ──────────────────────────────────── */
        .topics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        .topic-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 20px;
          cursor: pointer; transition: all 0.18s;
          text-decoration: none;
          display: flex; align-items: flex-start; gap: 14px;
        }
        .topic-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-2px);
        }

        /* ── Browse rows ──────────────────────────────────── */
        .browse-row {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          cursor: pointer; transition: background 0.15s;
        }
        .browse-row:last-child { border-bottom: none; }
        .browse-row:hover { background: rgba(255,255,255,0.04); }

        /* ── FAQ ──────────────────────────────────────────── */
        .faq-item { border-bottom: 1px solid rgba(255,255,255,0.07); }
        .faq-item:last-child { border-bottom: none; }
        .faq-btn {
          width: 100%; background: none; border: none; cursor: pointer;
          padding: 18px 20px; display: flex; align-items: center;
          justify-content: space-between; gap: 12px; text-align: left;
        }

        /* ── Contact cards ────────────────────────────────── */
        .contact-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .contact-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 22px;
        }

        /* ── Responsive ───────────────────────────────────── */
        @media (max-width: 640px) {
          .topics-grid { grid-template-columns: 1fr; }
          .contact-grid { grid-template-columns: 1fr; }
          .h-tab { padding: 8px 12px; font-size: 12px; }
        }
      `}</style>

      {/* ── Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <HelpCircle size={26} color="#0dc75e" />
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', color: '#fff', margin: 0 }}>
            Help & Support
          </h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: 0, fontFamily: 'DM Sans, sans-serif' }}>
          Find answers or get in touch with our team.
        </p>
      </div>

      {/* ── Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 18px', marginBottom: 24 }}>
        <Search size={18} color="rgba(255,255,255,0.35)" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); if (e.target.value) setActiveTab('faq') }}
          placeholder="Search for help articles..."
          style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 15, fontFamily: 'DM Sans, sans-serif', flex: 1 }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
        )}
      </div>

      {/* ── Tabs */}
      <div className="h-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`h-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* BROWSE TOPICS tab                                      */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'browse' && (
        <div>
          {/* Topic cards */}
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', marginBottom: 14 }}>Popular topics</p>
          <div className="topics-grid">
            {POPULAR_TOPICS.map((t, i) => (
              <div key={i} className="topic-card">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.color, flexShrink: 0 }}>
                  {t.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 4 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5, marginBottom: 10 }}>{t.desc}</div>
                  <span style={{ fontSize: 12, color: t.color, fontFamily: 'DM Sans, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    Browse articles <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* All categories */}
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', marginBottom: 14 }}>All categories</p>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
            {BROWSE_CATEGORIES.map((c, i) => (
              <div key={i} className="browse-row">
                <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)', fontFamily: 'DM Sans, sans-serif' }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>{c.sub}</div>
                </div>
                <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* FAQ tab                                                */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'faq' && (
        <div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
            {filteredFaqs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                No matching FAQs for "{search}".
              </div>
            ) : (
              filteredFaqs.map((faq, i) => (
                <div key={i} className="faq-item">
                  <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)', fontFamily: 'DM Sans, sans-serif', flex: 1 }}>
                      {faq.q}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'none', display: 'flex' }}>
                      <ChevronDown size={16} />
                    </span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 20px 18px 20px', fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, fontFamily: 'DM Sans, sans-serif' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 20, background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(13,199,94,0.06) 100%)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 4 }}>Still can't find your answer?</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>Our support team typically responds within 24 hours.</p>
            </div>
            <button onClick={() => setActiveTab('contact')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#0dc75e', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
              Contact Support
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* CONTACT tab                                            */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'contact' && (
        <div>
          <div className="contact-grid">
            {/* Email */}
            <div className="contact-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(13,199,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={18} color="#0dc75e" />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif' }}>Email Us</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans, sans-serif', marginBottom: 14 }}>Send us an email and we'll get back to you.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SUPPORT_EMAILS.map(e => (
                  <a key={e} href={`mailto:${e}`} style={{ fontSize: 13, color: '#0dc75e', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ChevronRight size={13} /> {e}
                  </a>
                ))}
              </div>
            </div>

            {/* Live Chat */}
            <div className="contact-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={18} color="#60a5fa" />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif' }}>Live Chat</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans, sans-serif', marginBottom: 14 }}>Chat with our support team in real time.</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: '#0dc75e', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0dc75e', display: 'inline-block' }} /> Online now
                </span>
              </div>
              <button
                onClick={() => setChatStarted(true)}
                style={{ width: '100%', padding: '10px', borderRadius: 9, border: '1px solid rgba(96,165,250,0.3)', background: chatStarted ? 'rgba(13,199,94,0.1)' : 'rgba(96,165,250,0.1)', color: chatStarted ? '#0dc75e' : '#60a5fa', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
              >
                {chatStarted ? '✓ Chat Active' : 'Start Chat'}
              </button>
            </div>

            {/* Response time */}
            <div className="contact-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(168,85,247,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} color="#a78bfa" />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif' }}>Response Time</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
                We typically respond within <span style={{ color: '#a78bfa', fontWeight: 600 }}>24 hours</span>. For urgent matters, use Live Chat.
              </div>
            </div>

            {/* Support hours */}
            <div className="contact-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} color="#fb923c" />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif' }}>Support Hours</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.8 }}>
                Mon – Fri: <span style={{ color: 'rgba(255,255,255,0.75)' }}>9:00 AM – 6:00 PM WAT</span><br />
                Saturday: <span style={{ color: 'rgba(255,255,255,0.75)' }}>10:00 AM – 4:00 PM WAT</span>
              </div>
            </div>
          </div>

          {/* Send a message form area */}
          <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 4 }}>Send a Message</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', marginBottom: 20 }}>Fill in the form and we'll get back to you as soon as possible.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {['Full Name', 'Email Address'].map(label => (
                <div key={label}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', display: 'block', marginBottom: 6 }}>{label}</label>
                  <input placeholder={label} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '10px 14px', color: '#fff', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', display: 'block', marginBottom: 6 }}>Subject</label>
              <input placeholder="What's your question about?" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '10px 14px', color: '#fff', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', display: 'block', marginBottom: 6 }}>Message</label>
              <textarea placeholder="Describe your issue in detail..." rows={4} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '10px 14px', color: '#fff', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button style={{ padding: '11px 28px', borderRadius: 10, border: 'none', background: '#0dc75e', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Send Message
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* STATUS tab                                             */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'status' && (
        <div>
          {/* Overall */}
          <div style={{ background: 'rgba(13,199,94,0.06)', border: '1px solid rgba(13,199,94,0.2)', borderRadius: 14, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <CheckCircle size={28} color="#0dc75e" />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0dc75e', fontFamily: 'Syne, sans-serif' }}>All Systems Operational</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', marginTop: 3 }}>All services are running normally. Last checked just now.</div>
            </div>
          </div>

          {/* Service list */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
            {[
              { name: 'Ticketing System',       sub: 'Ticket purchases and QR generation' },
              { name: 'Payment Processing',      sub: 'Card payments and bank transfers' },
              { name: 'Event Management',        sub: 'Event creation and management' },
              { name: 'Email Notifications',     sub: 'Booking confirmations and alerts' },
              { name: 'Authentication',          sub: 'Login and account access' },
            ].map((s, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)', fontFamily: 'DM Sans, sans-serif' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>{s.sub}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(13,199,94,0.1)', border: '1px solid rgba(13,199,94,0.2)', borderRadius: 20, padding: '4px 10px', flexShrink: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0dc75e', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#0dc75e', fontFamily: 'DM Sans, sans-serif' }}>Operational</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer */}
      <div style={{ marginTop: 36, padding: '18px 0', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans, sans-serif' }}>
        Still need help? Email us at{' '}
        <a href="mailto:support@stagecheck.com.ng" style={{ color: '#0dc75e', textDecoration: 'none' }}>support@stagecheck.com.ng</a>
      </div>
    </UserDashboardLayout>
  )
}