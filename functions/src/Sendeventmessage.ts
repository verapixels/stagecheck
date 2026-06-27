import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import fetch from 'node-fetch'

if (!admin.apps.length) admin.initializeApp()

const resendApiKey = defineSecret('RESEND_API_KEY')
const FROM_EMAIL = 'StageCheck <info@stagecheck.com.ng>'
const REPLY_TO = 'info@stagecheck.com.ng'
const ENQUIRIES_EMAIL = 'info@stagecheck.com.ng'

const SOCIALS = {
  instagram: 'https://instagram.com/stagecheckapp',
  twitter:   'https://x.com/stagecheckapp',
  tiktok:    'https://tiktok.com/@stagecheckapp',
}

function buildEmailHtml({
  eventName,
  messageText,
  senderName,
  senderEmail,
  recipientName,
  logoUrl,
}: {
  eventName: string
  messageText: string
  senderName: string
  senderEmail?: string
  recipientName?: string
  logoUrl: string
}): string {
  const escaped = messageText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map(line => `<p style="margin:0 0 12px 0;line-height:1.7;color:#c8d4e8;font-size:14px;">${line || '&nbsp;'}</p>`)
    .join('')

  const socialIcons = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="padding:0 6px;">
          <a href="${SOCIALS.instagram}" target="_blank" style="display:inline-block;text-decoration:none;">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="#0dc75e" stroke-width="1.8"/>
                <circle cx="12" cy="12" r="4" stroke="#0dc75e" stroke-width="1.8"/>
                <circle cx="17.5" cy="6.5" r="1" fill="#0dc75e"/>
              </svg>
            </div>
          </a>
        </td>
        <td style="padding:0 6px;">
          <a href="${SOCIALS.twitter}" target="_blank" style="display:inline-block;text-decoration:none;">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4L20 20M4 20L20 4" stroke="#0dc75e" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
          </a>
        </td>
        <td style="padding:0 6px;">
          <a href="${SOCIALS.tiktok}" target="_blank" style="display:inline-block;text-decoration:none;">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" stroke="#0dc75e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </a>
        </td>
      </tr>
    </table>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Message from ${senderName} · ${eventName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    body { margin:0; padding:0; background:#000612; font-family:'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
    a { color:#0dc75e; text-decoration:none; }
    a:hover { text-decoration:underline; }
  </style>
</head>
<body style="margin:0;padding:0;background:#000612;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000612;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px 60px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:580px;background:linear-gradient(160deg,#0d1829 0%,#070e1c 100%);border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.6);">
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#0dc75e,#14B8A6,#0dc75e);"></td>
          </tr>
          <tr>
            <td style="padding:32px 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                   <img src="https://res.cloudinary.com/dr0qtfjjf/image/upload/q_auto,f_auto,w_96,h_96,c_fit/v1782579896/logo.png_jn81nk.png" 
     alt="StageCheck" 
     width="48" height="48"
     style="width:48px;height:48px;display:block;border:0;border-radius:10px;"/>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;background:rgba(13,199,94,0.1);border:1px solid rgba(13,199,94,0.25);border-radius:20px;padding:5px 14px;font-size:11px;font-weight:600;color:#0dc75e;letter-spacing:0.6px;text-transform:uppercase;">
                      Event Message
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding:0 40px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <table cellpadding="0" cellspacing="0" border="0" style="background:rgba(13,199,94,0.06);border:1px solid rgba(13,199,94,0.14);border-radius:12px;width:100%;">
                <tr>
                  <td style="padding:14px 18px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:32px;vertical-align:middle;">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="4" width="18" height="18" rx="3" stroke="#0dc75e" stroke-width="1.8"/>
                            <path d="M3 9h18" stroke="#0dc75e" stroke-width="1.8"/>
                            <path d="M8 2v4M16 2v4" stroke="#0dc75e" stroke-width="1.8" stroke-linecap="round"/>
                          </svg>
                        </td>
                        <td style="padding-left:10px;">
                          <span style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.9px;font-weight:600;display:block;margin-bottom:2px;">Event</span>
                          <span style="font-size:15px;font-weight:700;color:#fff;">${eventName}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 8px;">
              ${recipientName
                ? `<p style="margin:0 0 18px 0;font-size:14px;color:rgba(255,255,255,0.45);">Hi <strong style="color:rgba(255,255,255,0.75);">${recipientName}</strong>,</p>`
                : `<p style="margin:0 0 18px 0;font-size:14px;color:rgba(255,255,255,0.45);">Hi there,</p>`
              }
              <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #14B8A6;border-radius:0 12px 12px 0;padding:20px 22px;margin-bottom:8px;">
                ${escaped}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 0;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#14B8A6,#0dc75e);display:inline-block;font-size:13px;font-weight:700;color:#000612;text-align:center;line-height:32px;">
                      ${senderName[0].toUpperCase()}
                    </div>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:12px;color:rgba(255,255,255,0.35);">Sent by </span>
                    <span style="font-size:13px;font-weight:600;color:#14B8A6;">${senderName}</span>
                    <span style="font-size:12px;color:rgba(255,255,255,0.35);"> · Event Organiser</span>
                    ${senderEmail
                      ? `<br/><span style="font-size:11px;color:rgba(255,255,255,0.25);">Reply to: <a href="mailto:${senderEmail}" style="color:#14B8A6;">${senderEmail}</a></span>`
                      : ''
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ENQUIRIES -->
          <tr>
            <td style="padding:20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:rgba(13,199,94,0.05);border:1px solid rgba(13,199,94,0.15);border-radius:12px;">
                <tr><td style="padding:14px 18px;text-align:center;">
                  <div style="font-size:12px;font-weight:700;color:#ffffff;margin-bottom:4px;font-family:Arial,sans-serif;">Have a question?</div>
                  <div style="font-size:12px;color:rgba(255,255,255,0.45);font-family:Arial,sans-serif;">
                    You can reply to this email or reach us at<br/>
                    <a href="mailto:${ENQUIRIES_EMAIL}" style="color:#0dc75e;text-decoration:none;font-weight:700;">${ENQUIRIES_EMAIL}</a>
                  </div>
                </td></tr>
              </table>
            </td>
          </tr>

          <tr><td style="padding:20px 40px 0;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>
          <tr>
            <td style="padding:24px 40px 20px;text-align:center;">
              <p style="margin:0 0 16px 0;font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:0.8px;text-transform:uppercase;font-weight:600;">Follow StageCheck</p>
              ${socialIcons}
            </td>
          </tr>
          <tr><td style="padding:0 40px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>
          <tr>
            <td style="padding:20px 40px 30px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;color:rgba(255,255,255,0.2);letter-spacing:0.4px;">
                Powered by <span style="color:#0dc75e;">StageCheck</span>
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.18);line-height:1.6;">
                You received this because you submitted to <strong style="color:rgba(255,255,255,0.28);">${eventName}</strong>.<br/>
                If you believe this is a mistake, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#14B8A6,#0dc75e,#14B8A6);"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Cloud Function ───────────────────────────────────────────────────────────
export const sendEventMessage = onRequest(
  { timeoutSeconds: 30, memory: '256MiB', secrets: ['RESEND_API_KEY'] },
  async (req, res) => {
    const RESEND_API_KEY = resendApiKey.value()
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

    const { eventId, eventName, messageText, senderName, senderEmail, recipientEmails } = req.body as {
      eventId: string
      eventName: string
      messageText: string
      senderName: string
      senderEmail: string
      recipientEmails: string[]
    }

    if (!eventId || !messageText || !recipientEmails?.length) {
      res.status(400).json({ error: 'Missing required fields' }); return
    }

    const LOGO_URL = 'https://res.cloudinary.com/dr0qtfjjf/image/upload/q_auto/f_auto/v1780966404/ChatGPT_Image_Jun_8_2026_10_17_50_PM_phtfqg.png'

    let performerMap: Record<string, string> = {}
    try {
      const snap = await admin.firestore()
        .collection('events').doc(eventId).collection('submissions').get()
      snap.docs.forEach(d => {
        const data = d.data()
        if (data.email) performerMap[data.email] = data.groupName || data.performerName || ''
      })
    } catch { /* continue without names */ }

    const results: { email: string; ok: boolean }[] = []

    for (const email of recipientEmails) {
      const recipientName = performerMap[email] || undefined
      const html = buildEmailHtml({
        eventName, messageText, senderName, senderEmail, recipientName, logoUrl: LOGO_URL,
      })

      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [email],
            reply_to: REPLY_TO,
            subject: `Message from ${senderName} · ${eventName}`,
            html,
          }),
        })
        results.push({ email, ok: resendRes.ok })
      } catch {
        results.push({ email, ok: false })
      }
    }

    const successCount = results.filter(r => r.ok).length
    const failCount    = results.filter(r => !r.ok).length

    try {
      const msgsRef = admin.firestore()
        .collection('events').doc(eventId).collection('messages')
      const recent = await msgsRef.orderBy('sentAt', 'desc').limit(1).get()
      if (!recent.empty) {
        await recent.docs[0].ref.update({
          emailStatus: failCount === 0 ? 'sent' : successCount > 0 ? 'partial' : 'failed',
          emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
    } catch { /* non-critical */ }

    res.status(200).json({ success: true, sent: successCount, failed: failCount, results })
  }
)