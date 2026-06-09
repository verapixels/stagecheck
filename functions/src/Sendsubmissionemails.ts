import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import fetch from 'node-fetch'

if (!admin.apps.length) admin.initializeApp()

const resendApiKey = defineSecret('RESEND_API_KEY')
const FROM_EMAIL = 'StageCheck <hello@verapixels.com>'
const LOGO_URL = 'https://res.cloudinary.com/dr0qtfjjf/image/upload/q_auto/f_auto/v1780966404/ChatGPT_Image_Jun_8_2026_10_17_50_PM_phtfqg.png'

// ─── Types ────────────────────────────────────────────────────────────────────
type EmailType = 'submitted' | 'approved' | 'rejected' | 'organizer_notify'

interface SongItem {
  title: string
  artist?: string
  singerName?: string
  thumbnail?: string
  source?: string
}


// ─── Song rows HTML ───────────────────────────────────────────────────────────
function buildSongRows(songs: SongItem[]): string {
  if (!songs?.length) return ''
  return songs.map(s => `
    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;margin-bottom:8px;">
      <tr>
        <td style="padding:11px 14px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              ${s.thumbnail ? `
              <td style="width:44px;vertical-align:middle;padding-right:12px;">
                <img src="${s.thumbnail}" alt="" width="44" height="44"
                     style="width:44px;height:44px;border-radius:8px;object-fit:cover;display:block;border:0;"/>
              </td>` : ''}
              <td style="vertical-align:middle;">
                <span style="font-size:13px;font-weight:600;color:#fff;display:block;margin-bottom:2px;">${s.title}</span>
                <span style="font-size:11px;color:rgba(255,255,255,0.35);">${s.artist || s.singerName || ''}</span>
              </td>
              <td align="right" style="vertical-align:middle;padding-left:10px;">
                <span style="font-size:10px;color:rgba(255,255,255,0.25);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:5px;padding:3px 8px;white-space:nowrap;">
                  ${s.source === 'original' ? 'Original' : 'YouTube'}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`).join('')
}
// ─── Shared wrapper ───────────────────────────────────────────────────────────
function emailShell(title: string, bodyContent: string, footerEvent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing:border-box; }
    body { margin:0;padding:0;background:#000612;font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased; }
    a { color:#0dc75e;text-decoration:none; }
  </style>
</head>
<body style="margin:0;padding:0;background:#000612;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000612;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px 60px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:580px;background:linear-gradient(160deg,#0d1829 0%,#070e1c 100%);border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.6);">
          <!-- top bar -->
          <tr><td style="height:3px;background:linear-gradient(90deg,#0dc75e,#14B8A6,#0dc75e);"></td></tr>

          <!-- logo row -->
          <tr>
            <td style="padding:28px 36px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td><img src="${LOGO_URL}" alt="StageCheck" height="32" style="height:32px;width:auto;display:block;border:0;"/></td>
                  <td align="right">
                    <span style="display:inline-block;background:rgba(13,199,94,0.1);border:1px solid rgba(13,199,94,0.25);border-radius:20px;padding:4px 12px;font-size:10px;font-weight:700;color:#0dc75e;letter-spacing:0.8px;text-transform:uppercase;">
                      StageCheck
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="padding:0 36px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

          <!-- main body -->
          <tr><td style="padding:28px 36px 32px;">${bodyContent}</td></tr>

          <tr><td style="padding:0 36px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

          <!-- footer -->
          <tr>
            <td style="padding:20px 36px 28px;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;color:rgba(255,255,255,0.2);">
                Powered by <span style="color:#0dc75e;">StageCheck</span>
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.18);line-height:1.6;">
                You received this because you submitted to <strong style="color:rgba(255,255,255,0.28);">${footerEvent}</strong>.<br/>
                If this is a mistake, please ignore this email.
              </p>
            </td>
          </tr>
          <!-- bottom bar -->
          <tr><td style="height:3px;background:linear-gradient(90deg,#14B8A6,#0dc75e,#14B8A6);"></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Template: submitter confirmation ────────────────────────────────────────
function buildSubmittedEmail(params: {
  eventName: string
  performerName: string
  songs: SongItem[]
}): string {
  const body = `
    <!-- icon + heading -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td style="width:48px;vertical-align:middle;">
          <div style="width:44px;height:44px;border-radius:50%;background:rgba(13,199,94,0.1);border:1.5px solid rgba(13,199,94,0.3);text-align:center;line-height:44px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;">
              <path d="M20 6L9 17l-5-5" stroke="#0dc75e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </td>
        <td style="padding-left:14px;vertical-align:middle;">
          <div style="font-size:20px;font-weight:800;color:#fff;line-height:1.2;">Entry received!</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:2px;">You're in the queue — sit tight.</div>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px 0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
      Hi <strong style="color:rgba(255,255,255,0.8);">${params.performerName}</strong>, your submission to
      <strong style="color:#fff;">${params.eventName}</strong> has been received.
      The organizer will review it and you'll hear back once a decision is made.
    </p>

    <!-- status pill -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:8px;padding:8px 16px;">
          <span style="font-size:12px;font-weight:700;color:#F59E0B;letter-spacing:0.5px;">⏳ PENDING APPROVAL</span>
        </td>
      </tr>
    </table>

    ${params.songs?.length ? `
    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.25);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">
      Your submitted song${params.songs.length > 1 ? 's' : ''}
    </div>
    ${buildSongRows(params.songs)}` : ''}
  `
  return emailShell(`Entry received · ${params.eventName}`, body, params.eventName)
}

// ─── Template: organizer notification ────────────────────────────────────────
function buildOrganizerEmail(params: {
  eventName: string
  performerName: string
  groupName: string
  email: string
  songs: SongItem[]
  dashboardUrl: string
}): string {
  const body = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td style="width:48px;vertical-align:middle;">
          <div style="width:44px;height:44px;border-radius:50%;background:rgba(13,199,94,0.08);border:1.5px solid rgba(13,199,94,0.25);text-align:center;line-height:44px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#0dc75e" stroke-width="1.8" stroke-linecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="#0dc75e" stroke-width="1.8"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#0dc75e" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
        </td>
        <td style="padding-left:14px;vertical-align:middle;">
          <div style="font-size:20px;font-weight:800;color:#fff;line-height:1.2;">New submission</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:2px;">${params.eventName}</div>
        </td>
      </tr>
    </table>

    <!-- submitter card -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="background:rgba(13,199,94,0.05);border:1px solid rgba(13,199,94,0.14);border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:10px;">Submitter</div>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom:5px;">
                <span style="font-size:11px;color:rgba(255,255,255,0.3);min-width:60px;display:inline-block;">Name</span>
                <span style="font-size:13px;color:#fff;font-weight:600;">${params.performerName}</span>
              </td>
            </tr>
            ${params.groupName && params.groupName !== params.performerName ? `
            <tr>
              <td style="padding-bottom:5px;">
                <span style="font-size:11px;color:rgba(255,255,255,0.3);min-width:60px;display:inline-block;">Group</span>
                <span style="font-size:13px;color:rgba(255,255,255,0.7);">${params.groupName}</span>
              </td>
            </tr>` : ''}
            ${params.email ? `
            <tr>
              <td>
                <span style="font-size:11px;color:rgba(255,255,255,0.3);min-width:60px;display:inline-block;">Email</span>
                <a href="mailto:${params.email}" style="font-size:13px;color:#14B8A6;">${params.email}</a>
              </td>
            </tr>` : ''}
          </table>
        </td>
      </tr>
    </table>

    ${params.songs?.length ? `
    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.25);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">
      Song${params.songs.length > 1 ? 's' : ''} submitted
    </div>
    ${buildSongRows(params.songs)}` : ''}

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;">
      <tr>
        <td align="center">
          <a href="${params.dashboardUrl}"
             style="display:inline-block;background:linear-gradient(135deg,#0dc75e,#16A34A);color:#fff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px;box-shadow:0 6px 20px rgba(13,199,94,0.3);">
            Review in Dashboard →
          </a>
        </td>
      </tr>
    </table>
  `
  return emailShell(`New submission · ${params.eventName}`, body, params.eventName)
}

// ─── Template: approved ───────────────────────────────────────────────────────
function buildApprovedEmail(params: {
  eventName: string
  performerName: string
  songs: SongItem[]
  organizerEmail?: string
}): string {
  const body = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td style="width:48px;vertical-align:middle;">
          <div style="width:44px;height:44px;border-radius:50%;background:rgba(13,199,94,0.12);border:1.5px solid #0dc75e;text-align:center;line-height:44px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;">
              <path d="M20 6L9 17l-5-5" stroke="#0dc75e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </td>
        <td style="padding-left:14px;vertical-align:middle;">
          <div style="font-size:20px;font-weight:800;color:#fff;line-height:1.2;">You're approved! 🎉</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:2px;">${params.eventName}</div>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px 0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
      Hi <strong style="color:rgba(255,255,255,0.8);">${params.performerName}</strong>,
      great news — your entry for <strong style="color:#fff;">${params.eventName}</strong> has been
      <strong style="color:#0dc75e;">approved</strong>. You're on the lineup!
    </p>

    <!-- status pill -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:rgba(13,199,94,0.1);border:1px solid rgba(13,199,94,0.3);border-radius:8px;padding:8px 16px;">
          <span style="font-size:12px;font-weight:700;color:#0dc75e;letter-spacing:0.5px;">✓ APPROVED</span>
        </td>
      </tr>
    </table>

    ${params.songs?.length ? `
    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.25);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">
      Your approved song${params.songs.length > 1 ? 's' : ''}
    </div>
    ${buildSongRows(params.songs)}` : ''}

    ${params.organizerEmail ? `
    <p style="margin:24px 0 0 0;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.6;">
      Questions? Reply to this email or contact the organizer at
      <a href="mailto:${params.organizerEmail}" style="color:#14B8A6;">${params.organizerEmail}</a>.
    </p>` : ''}
  `
  return emailShell(`You're approved · ${params.eventName}`, body, params.eventName)
}

// ─── Template: rejected ───────────────────────────────────────────────────────
function buildRejectedEmail(params: {
  eventName: string
  performerName: string
  organizerEmail?: string
}): string {
  const body = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td style="width:48px;vertical-align:middle;">
          <div style="width:44px;height:44px;border-radius:50%;background:rgba(248,113,113,0.1);border:1.5px solid rgba(248,113,113,0.4);text-align:center;line-height:44px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;">
              <path d="M18 6L6 18M6 6l12 12" stroke="#F87171" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </td>
        <td style="padding-left:14px;vertical-align:middle;">
          <div style="font-size:20px;font-weight:800;color:#fff;line-height:1.2;">Submission update</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:2px;">${params.eventName}</div>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px 0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
      Hi <strong style="color:rgba(255,255,255,0.8);">${params.performerName}</strong>,
      unfortunately your entry for <strong style="color:#fff;">${params.eventName}</strong> was not selected this time.
      Thank you for submitting — we hope to see you at a future event.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:8px;padding:8px 16px;">
          <span style="font-size:12px;font-weight:700;color:#F87171;letter-spacing:0.5px;">✕ NOT SELECTED</span>
        </td>
      </tr>
    </table>

    ${params.organizerEmail ? `
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.6;">
      If you have questions, reach out to the organizer at
      <a href="mailto:${params.organizerEmail}" style="color:#14B8A6;">${params.organizerEmail}</a>.
    </p>` : ''}
  `
  return emailShell(`Submission update · ${params.eventName}`, body, params.eventName)
}

// ─── Cloud Function ───────────────────────────────────────────────────────────
export const sendSubmissionEmails = onRequest(
  { timeoutSeconds: 30, memory: '256MiB', secrets: ['RESEND_API_KEY'] },
  async (req, res) => {
    const RESEND_KEY = resendApiKey.value()
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

    const {
      type,
      eventId,
      eventName,
      performerName,
      groupName,
      performerEmail,
      organizerEmail,
      songs,
      dashboardUrl,
    } = req.body as {
      type: EmailType
      eventId: string
      eventName: string
      performerName: string
      groupName?: string
      performerEmail?: string
      organizerEmail?: string
      songs?: SongItem[]
      dashboardUrl?: string
    }

    if (!type || !eventName || !performerName) {
      res.status(400).json({ error: 'Missing required fields' }); return
    }

    const sendEmail = async (to: string, subject: string, html: string) => {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  })
  const body = await r.json()
  console.log('Resend response:', r.status, JSON.stringify(body))
  return r.ok
}

    const results: { to: string; ok: boolean }[] = []

    // ── submitted: email performer + organizer ────────────────────────────────
    if (type === 'submitted') {
      if (performerEmail) {
        const html = buildSubmittedEmail({ eventName, performerName, songs: songs || [] })
        const ok = await sendEmail(performerEmail, `Entry received · ${eventName}`, html)
        results.push({ to: performerEmail, ok })
      }

      if (organizerEmail) {
        const base = dashboardUrl || 'https://stagecheck-699c7.web.app'
        const html = buildOrganizerEmail({
          eventName, performerName,
          groupName: groupName || performerName,
          email: performerEmail || '',
          songs: songs || [],
          dashboardUrl: `${base}/event/${eventId}/songs`,
        })
        const ok = await sendEmail(organizerEmail, `New submission · ${eventName}`, html)
        results.push({ to: organizerEmail, ok })
      }
    }

    // ── approved ──────────────────────────────────────────────────────────────
    if (type === 'approved' && performerEmail) {
      const html = buildApprovedEmail({ eventName, performerName, songs: songs || [], organizerEmail })
      const ok = await sendEmail(performerEmail, `You're approved · ${eventName}`, html)
      results.push({ to: performerEmail, ok })
    }

    // ── rejected ──────────────────────────────────────────────────────────────
    if (type === 'rejected' && performerEmail) {
      const html = buildRejectedEmail({ eventName, performerName, organizerEmail })
      const ok = await sendEmail(performerEmail, `Submission update · ${eventName}`, html)
      results.push({ to: performerEmail, ok })
    }

    res.status(200).json({ success: true, results })
  }
)