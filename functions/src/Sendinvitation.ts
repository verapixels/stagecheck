import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import fetch from 'node-fetch'

if (!admin.apps.length) admin.initializeApp()

const resendApiKey = defineSecret('RESEND_API_KEY')
const FROM_EMAIL = 'StageCheck <events@stagecheck.com.ng>'
const REPLY_TO = 'events@stagecheck.com.ng'
const ENQUIRIES_EMAIL = 'info@stagecheck.com.ng'

const APP_URL = 'https://stagecheck.com.ng'


const SOCIALS = {
  facebook:  'https://facebook.com/stagecheckapp',
  instagram: 'https://instagram.com/stagecheckapp',
  twitter:   'https://x.com/stagecheckapp',
  youtube:   'https://youtube.com/@stagecheckapp',
  tiktok:    'https://tiktok.com/@stagecheckapp',
}

const ICON_FACEBOOK  = 'https://cdn.simpleicons.org/facebook/0dc75e'
const ICON_INSTAGRAM = 'https://cdn.simpleicons.org/instagram/0dc75e'
const ICON_X         = 'https://cdn.simpleicons.org/x/0dc75e'
const ICON_YOUTUBE   = 'https://cdn.simpleicons.org/youtube/0dc75e'
const ICON_TIKTOK    = 'https://cdn.simpleicons.org/tiktok/0dc75e'

const socialIconsHtml = [
  { href: SOCIALS.facebook,  src: ICON_FACEBOOK,  alt: 'Facebook'  },
  { href: SOCIALS.instagram, src: ICON_INSTAGRAM, alt: 'Instagram' },
  { href: SOCIALS.twitter,   src: ICON_X,         alt: 'X / Twitter' },
  { href: SOCIALS.youtube,   src: ICON_YOUTUBE,   alt: 'YouTube'   },
  { href: SOCIALS.tiktok,    src: ICON_TIKTOK,    alt: 'TikTok'    },
].map(s => `
  <td style="padding:0 5px;">
    <a href="${s.href}" target="_blank" style="display:inline-block;text-decoration:none;">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="width:40px;height:40px;border-radius:20px;background:rgba(13,199,94,0.15);border:1.5px solid rgba(13,199,94,0.35);text-align:center;vertical-align:middle;">
          <img src="${s.src}" alt="${s.alt}" width="18" height="18"
               style="width:18px;height:18px;display:inline-block;vertical-align:middle;border:0;"/>
        </td>
      </tr></table>
    </a>
  </td>`).join('')

function buildScopeHtml(scope: any, scopeNames: string[]): string {
  if (!scope || scope === 'all') {
    return `<span style="color:#0dc75e;font-weight:bold;">Full Access</span> — you can check in all attendees.`
  }
  const names = scopeNames.length ? scopeNames : []
  if (!names.length) return 'Scoped access to specific areas.'
  return `Scoped to: <strong style="color:#ffffff;">${names.join(', ')}</strong>`
}

function buildInvitationEmail(params: {
  eventName: string
  eventImage?: string | null
  organizerName: string
  invitedEmail: string
  scope: any
  scopeNames: string[]
  acceptUrl: string
}): string {
  const { eventName, eventImage, organizerName, invitedEmail, scope, scopeNames, acceptUrl } = params
  const scopeHtml = buildScopeHtml(scope, scopeNames)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>You've been invited · StageCheck</title>
</head>
<body style="margin:0;padding:0;background:#030d1a;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#030d1a;min-height:100vh;">
  <tr>
    <td align="center" style="padding:32px 12px 60px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:600px;background:#061220;border-radius:20px;border:1px solid rgba(13,199,94,0.2);overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.7);">

        <tr><td style="height:4px;background:linear-gradient(90deg,#0dc75e,#14B8A6,#0dc75e);font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="https://res.cloudinary.com/dr0qtfjjf/image/upload/q_auto,f_auto,w_96,h_96,c_fit/v1782579896/logo.png_jn81nk.png" 
     alt="StageCheck" 
     width="48" height="48"
     style="width:48px;height:48px;display:block;border:0;border-radius:10px;"/>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="background:rgba(13,199,94,0.1);border:1px solid rgba(13,199,94,0.35);border-radius:20px;padding:5px 14px;">
                      <span style="font-size:11px;font-weight:bold;color:#0dc75e;font-family:Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Team Invitation</span>
                    </td>
                  </tr></table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:20px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        ${eventImage ? `
        <tr>
          <td style="padding:20px 32px 0;">
            <img src="${eventImage}" alt="${eventName}" width="536"
                 style="width:100%;max-width:536px;height:auto;border-radius:12px;display:block;border:0;"/>
          </td>
        </tr>` : ''}

        <tr>
          <td style="padding:24px 32px 0;">
            <div style="font-size:36px;font-weight:900;color:#ffffff;line-height:1.05;letter-spacing:-1px;font-family:Arial,sans-serif;">
              You've Been<br/>
              <span style="color:#0dc75e;">Invited!</span>
            </div>
            <p style="margin:12px 0 0;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;font-family:Arial,sans-serif;">
              Hey there,<br/>
              <strong style="color:#0dc75e;">${organizerName}</strong> has invited you to join the team managing
              <strong style="color:#ffffff;">${eventName}</strong> on StageCheck.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background:rgba(13,199,94,0.06);border:1px solid rgba(13,199,94,0.2);border-radius:14px;">
              <tr>
                <td style="padding:20px 22px;">
                  <div style="font-size:10px;font-weight:bold;letter-spacing:0.9px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:5px;font-family:Arial,sans-serif;">Your Role</div>
                  <div style="font-size:18px;font-weight:900;color:#0dc75e;margin-bottom:14px;font-family:Arial,sans-serif;">Check-in Admin</div>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
                    <tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr>
                  </table>
                  <div style="font-size:10px;font-weight:bold;letter-spacing:0.9px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:5px;font-family:Arial,sans-serif;">Access Scope</div>
                  <div style="font-size:13px;color:rgba(255,255,255,0.65);line-height:1.6;font-family:Arial,sans-serif;">${scopeHtml}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 0;">
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;font-family:Arial,sans-serif;">
              Click the button below to accept. If you don't have a StageCheck account yet,
              you'll be guided to create one first — your invitation will be waiting.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:22px 32px 0;text-align:center;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>
                <td style="background:#0dc75e;border-radius:12px;padding:14px 36px;text-align:center;">
                  <a href="${acceptUrl}"
                     style="font-size:15px;font-weight:bold;color:#000000;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.02em;">
                    &#x2192; Accept Invitation
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,0.25);font-family:Arial,sans-serif;">
              Or copy this link:<br/>
              <a href="${acceptUrl}" style="color:#0dc75e;word-break:break-all;">${acceptUrl}</a>
            </p>
          </td>
        </tr>

        <tr><td style="padding:22px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        <!-- ENQUIRIES -->
        <tr>
          <td style="padding:20px 32px 0;">
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

        <tr><td style="padding:20px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        <tr>
          <td style="padding:20px 32px 0;text-align:center;">
            <p style="margin:0 0 14px;font-size:11px;font-weight:bold;color:rgba(255,255,255,0.3);letter-spacing:0.7px;text-transform:uppercase;font-family:Arial,sans-serif;">Stay Connected</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>${socialIconsHtml}</tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:20px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        <tr>
          <td style="padding:18px 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:top;">
                 <img src="https://res.cloudinary.com/dr0qtfjjf/image/upload/q_auto,f_auto,w_48,h_48,c_fit/v1782579896/logo.png_jn81nk.png" 
     alt="StageCheck" 
     width="24" height="24"
     style="width:24px;height:24px;display:block;border:0;border-radius:6px;opacity:0.5;margin-bottom:6px;"/>
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.6;font-family:Arial,sans-serif;">
                    &copy; 2025 StageCheck. All rights reserved.<br/>
                    Making events seamless, secure and unforgettable.
                  </p>
                </td>
                <td style="vertical-align:top;text-align:right;">
                  <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.3);font-family:Arial,sans-serif;">
                    Need help? <a href="mailto:${ENQUIRIES_EMAIL}" style="color:#0dc75e;text-decoration:none;font-weight:bold;">Contact us</a>
                  </p>
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.7;font-family:Arial,sans-serif;">
                    ${ENQUIRIES_EMAIL}<br/>
                    stagecheck.com.ng
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="height:4px;background:linear-gradient(90deg,#14B8A6,#0dc75e,#14B8A6);font-size:0;line-height:0;">&nbsp;</td></tr>

      </table>

      <p style="margin:20px 0 0;font-size:11px;color:rgba(255,255,255,0.2);font-family:Arial,sans-serif;">
        This invitation was sent to <strong style="color:rgba(255,255,255,0.35);">${invitedEmail}</strong>.
        If this was a mistake, you can safely ignore this email.
      </p>

    </td>
  </tr>
</table>
</body>
</html>`
}

// ─── Cloud Function ───────────────────────────────────────────────────────────
export const sendInvitation = onRequest(
  { timeoutSeconds: 30, memory: '256MiB', secrets: ['RESEND_API_KEY'] },
  async (req, res) => {
    const RESEND_KEY = resendApiKey.value()

    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST')   { res.status(405).json({ error: 'Method not allowed' }); return }

    const {
      invitedEmail,
      eventId,
      eventName,
      eventImage,
      organizerName,
      organizerUid,
      role,
      scope,
      scopeNames,
    } = req.body as {
      invitedEmail: string
      eventId: string
      eventName?: string
      eventImage?: string
      organizerName: string
      organizerUid: string
      role: string
      scope: any
      scopeNames: string[]
    }

    if (!invitedEmail || !eventId || !organizerUid) {
      res.status(400).json({ error: 'Missing required fields: invitedEmail, eventId, organizerUid' })
      return
    }

    const safeEventName = eventName?.trim() || 'this event'

    try {
      const invRef = await admin.firestore().collection('invitations').add({
        invitedEmail: invitedEmail.toLowerCase(),
        eventId,
        eventName: safeEventName,
        eventImage: eventImage || null,
        organizerName,
        organizerUid,
        role,
        scope,
        scopeNames: scopeNames || [],
        status: 'pending',
        invitedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      const acceptUrl = `${APP_URL}/accept-invitation/${invRef.id}`

      const html = buildInvitationEmail({
        eventName: safeEventName,
        eventImage,
        organizerName,
        invitedEmail,
        scope,
        scopeNames: scopeNames || [],
        acceptUrl,
      })

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [invitedEmail],
          reply_to: REPLY_TO,
          subject: `You've been invited to manage ${safeEventName} · StageCheck`,
          html,
        }),
      })

      const emailBody = await resendRes.json()
      if (!resendRes.ok) {
        console.error('Resend error:', emailBody)
      }

      res.status(200).json({
        success: true,
        invitationId: invRef.id,
        emailSent: resendRes.ok,
      })
    } catch (e: any) {
      console.error('sendInvitation error:', e)
      res.status(500).json({ error: e.message ?? 'Internal error' })
    }
  }
)