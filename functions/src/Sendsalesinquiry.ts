import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import fetch from 'node-fetch'

if (!admin.apps.length) admin.initializeApp()

const resendApiKey = defineSecret('RESEND_API_KEY')

const FROM_EMAIL = 'StageCheck Sales <sales@stagecheck.com.ng>'  
const SALES_INBOX = 'info@stagecheck.com.ng'
const APP_URL = 'https://stagecheck.com.ng'

const ICON_FACEBOOK  = 'https://cdn.simpleicons.org/facebook/22C55E'
const ICON_INSTAGRAM = 'https://cdn.simpleicons.org/instagram/22C55E'
const ICON_X         = 'https://cdn.simpleicons.org/x/22C55E'
const ICON_YOUTUBE   = 'https://cdn.simpleicons.org/youtube/22C55E'
const ICON_TIKTOK    = 'https://cdn.simpleicons.org/tiktok/22C55E'

const LOGO_URL = 'https://res.cloudinary.com/dr0qtfjjf/image/upload/q_auto,f_auto,w_96,h_96,c_fit/v1782579896/logo.png_jn81nk.png'

const socialIconsHtml = [
  { href: 'https://facebook.com/stagecheckapp',  src: ICON_FACEBOOK,  alt: 'Facebook'  },
  { href: 'https://instagram.com/stagecheckapp', src: ICON_INSTAGRAM, alt: 'Instagram' },
  { href: 'https://x.com/stagecheckapp',         src: ICON_X,         alt: 'X'         },
  { href: 'https://youtube.com/@stagecheckapp',  src: ICON_YOUTUBE,   alt: 'YouTube'   },
  { href: 'https://tiktok.com/@stagecheckapp',   src: ICON_TIKTOK,    alt: 'TikTok'    },
].map(s => `
  <td style="padding:0 5px;">
    <a href="${s.href}" target="_blank" style="display:inline-block;text-decoration:none;">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="width:38px;height:38px;border-radius:19px;background:rgba(34,197,94,0.12);border:1.5px solid rgba(34,197,94,0.3);text-align:center;vertical-align:middle;">
          <img src="${s.src}" alt="${s.alt}" width="16" height="16"
               style="width:16px;height:16px;display:inline-block;vertical-align:middle;border:0;"/>
        </td>
      </tr></table>
    </a>
  </td>`).join('')

function emailShell(opts: { badgeText: string; bodyHtml: string }): string {
  const { badgeText, bodyHtml } = opts
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>StageCheck Sales</title>
  <style>
    @media only screen and (max-width: 480px) {
      .sc-hero-title { font-size: 26px !important; }
      .sc-hero-sub { font-size: 14px !important; }
      .sc-body-text { font-size: 13px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#030d1a;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#030d1a;min-height:100vh;">
  <tr>
    <td align="center" style="padding:32px 12px 60px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:580px;background:#061220;border-radius:20px;border:1px solid rgba(34,197,94,0.2);overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.7);">

        <tr><td style="height:4px;background:linear-gradient(90deg,#22C55E,#14B8A6,#22C55E);font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr>
          <td style="padding:28px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <img src="${LOGO_URL}" alt="StageCheck" width="44" height="44"
                       style="width:44px;height:44px;display:block;border:0;border-radius:10px;"/>
                </td>
                <td align="right">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:20px;padding:5px 14px;">
                      <span style="font-size:11px;font-weight:bold;color:#22C55E;letter-spacing:0.5px;text-transform:uppercase;">${badgeText}</span>
                    </td>
                  </tr></table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:20px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        ${bodyHtml}

        <tr><td style="padding:24px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        <tr>
          <td style="padding:20px 32px 0;text-align:center;">
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
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="vertical-align:middle;padding-right:6px;">
                      <img src="${LOGO_URL}" alt="StageCheck" width="20" height="20"
                           style="width:20px;height:20px;display:block;border:0;border-radius:6px;"/>
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="font-size:13px;font-weight:800;font-family:Arial,sans-serif;">
                        <span style="color:#ffffff;">STAGE</span><span style="color:#22C55E;">CHECK</span>
                      </span>
                    </td>
                  </tr></table>
                  <p style="margin:6px 0 0;font-size:11.5px;color:rgba(255,255,255,0.55);font-family:Arial,sans-serif;">
                    Discover. Book. Experience.
                  </p>
                </td>
                <td style="vertical-align:top;text-align:right;">
                  <p style="margin:0 0 4px;font-size:11.5px;color:rgba(255,255,255,0.8);font-family:Arial,sans-serif;">
                    <a href="mailto:${SALES_INBOX}" style="color:#22C55E;text-decoration:none;font-weight:bold;">${SALES_INBOX}</a>
                  </p>
                  <p style="margin:0;font-size:11.5px;color:rgba(255,255,255,0.6);font-family:Arial,sans-serif;">
                    <a href="${APP_URL}" style="color:rgba(255,255,255,0.6);text-decoration:none;">stagecheck.com.ng</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="height:4px;background:linear-gradient(90deg,#14B8A6,#22C55E,#14B8A6);font-size:0;line-height:0;">&nbsp;</td></tr>

      </table>

      <p style="margin:20px 0 0;font-size:11px;color:rgba(255,255,255,0.5);font-family:Arial,sans-serif;">
        &copy; ${new Date().getFullYear()} StageCheck. All rights reserved.
      </p>
    </td>
  </tr>
</table>
</body>
</html>`
}

function buildAdminNotificationEmail(params: {
  fullName: string; workEmail: string; eventType: string; message: string
}): string {
  const { fullName, workEmail, eventType, message } = params

  const bodyHtml = `
    <tr>
      <td style="padding:28px 32px 0;text-align:center;">
        <div style="display:inline-block;width:64px;height:64px;background:rgba(34,197,94,0.1);border:1.5px solid rgba(34,197,94,0.3);border-radius:18px;text-align:center;line-height:64px;margin-bottom:16px;">
          <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.383.0/icons/inbox.svg" width="28" height="28"
               style="width:28px;height:28px;vertical-align:middle;filter:invert(58%) sepia(98%) saturate(400%) hue-rotate(95deg);border:0;"/>
        </div>
        <div class="sc-hero-title" style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;font-family:Arial,sans-serif;">
          New <span style="color:#22C55E;">Sales Inquiry</span>
        </div>
        <p class="sc-hero-sub" style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.8);font-family:Arial,sans-serif;">
          A new message was received via the Create Event page.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:24px 32px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
          <tr><td style="padding:18px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding-bottom:10px;font-size:12.5px;color:rgba(255,255,255,0.55);font-family:Arial,sans-serif;">Full Name</td></tr>
              <tr><td style="padding-bottom:14px;font-size:14.5px;color:#fff;font-weight:700;font-family:Arial,sans-serif;">${fullName}</td></tr>
              <tr><td style="padding-bottom:10px;font-size:12.5px;color:rgba(255,255,255,0.55);font-family:Arial,sans-serif;">Work Email</td></tr>
              <tr><td style="padding-bottom:14px;font-size:14.5px;font-family:Arial,sans-serif;"><a href="mailto:${workEmail}" style="color:#22C55E;font-weight:700;text-decoration:none;">${workEmail}</a></td></tr>
              <tr><td style="padding-bottom:10px;font-size:12.5px;color:rgba(255,255,255,0.55);font-family:Arial,sans-serif;">Event Type</td></tr>
              <tr><td style="padding-bottom:14px;font-size:14.5px;color:#fff;font-weight:700;font-family:Arial,sans-serif;">${eventType || 'Not specified'}</td></tr>
              <tr><td style="padding-bottom:6px;font-size:12.5px;color:rgba(255,255,255,0.55);font-family:Arial,sans-serif;">Message</td></tr>
              <tr><td style="font-size:13.5px;color:rgba(255,255,255,0.85);line-height:1.6;font-family:Arial,sans-serif;">${message || '<em style="color:rgba(255,255,255,0.5);">No additional message provided.</em>'}</td></tr>
            </table>
          </td></tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 32px 0;text-align:center;">
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td style="background:#22C55E;border-radius:12px;">
              <a href="mailto:${workEmail}" target="_blank"
                 style="display:inline-block;padding:13px 28px;font-size:14.5px;font-weight:700;color:#050d0a;text-decoration:none;font-family:Arial,sans-serif;">
                Reply to ${fullName.split(' ')[0]} &nbsp;→
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`

  return emailShell({ badgeText: 'Sales Inquiry', bodyHtml })
}

function buildUserAutoReplyEmail(params: { firstName: string; email: string }): string {
  const { firstName } = params

  const bodyHtml = `
    <tr>
      <td style="padding:28px 32px 0;text-align:center;">
        <div style="display:inline-block;width:64px;height:64px;background:rgba(34,197,94,0.1);border:1.5px solid rgba(34,197,94,0.3);border-radius:18px;text-align:center;line-height:64px;margin-bottom:16px;">
          <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.383.0/icons/check.svg" width="26" height="26"
               style="width:26px;height:26px;vertical-align:middle;filter:invert(58%) sepia(98%) saturate(400%) hue-rotate(95deg);border:0;"/>
        </div>
        <div class="sc-hero-title" style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;font-family:Arial,sans-serif;">
          We've got your <span style="color:#22C55E;">message!</span>
        </div>
        <p class="sc-hero-sub" style="margin:12px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-family:Arial,sans-serif;">
          <strong style="color:#22C55E;">Hi ${firstName},</strong><br/>
          Thanks for reaching out to StageCheck Sales. We've received your request and one of our event specialists will get back to you within 1 business day.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:24px 32px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.18);border-radius:12px;">
          <tr>
            <td style="padding:16px 18px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:top;width:36px;padding-right:12px;">
                    <div style="width:32px;height:32px;background:rgba(34,197,94,0.12);border-radius:50%;text-align:center;line-height:32px;">
                      <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.383.0/icons/clock.svg" width="16" height="16"
                           style="width:16px;height:16px;vertical-align:middle;filter:invert(58%) sepia(98%) saturate(400%) hue-rotate(95deg);border:0;"/>
                    </div>
                  </td>
                  <td>
                    <div style="font-size:12.5px;font-weight:700;color:#22C55E;margin-bottom:3px;font-family:Arial,sans-serif;">What happens next?</div>
                    <div class="sc-body-text" style="font-size:12.5px;color:rgba(255,255,255,0.8);line-height:1.6;font-family:Arial,sans-serif;">
                      Our team will review your event details and reach out by email to discuss how StageCheck can support your event.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 32px 0;text-align:center;">
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td style="background:#22C55E;border-radius:12px;">
              <a href="${APP_URL}/how-it-works" target="_blank"
                 style="display:inline-block;padding:13px 28px;font-size:14.5px;font-weight:700;color:#050d0a;text-decoration:none;font-family:Arial,sans-serif;">
                See How StageCheck Works &nbsp;→
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:6px 32px 0;text-align:center;">
        <p style="margin:0;font-size:12.5px;color:rgba(255,255,255,0.6);font-family:Arial,sans-serif;">
          Need to add anything? Just reply to this email — it goes straight to our sales team.
        </p>
      </td>
    </tr>`

  return emailShell({ badgeText: 'Request Received', bodyHtml })
}

// ─── sendSalesInquiry ──────────────────────────────────────────────────────
export const sendSalesInquiry = onRequest(
  { timeoutSeconds: 30, memory: '256MiB', secrets: ['RESEND_API_KEY'] },
  async (req, res) => {
    const RESEND_KEY = resendApiKey.value()

    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST')   { res.status(405).json({ error: 'Method not allowed' }); return }

    const { fullName, workEmail, eventType, message } = req.body as {
      fullName: string; workEmail: string; eventType: string; message: string
    }

    if (!fullName?.trim() || !workEmail?.trim()) {
      res.status(400).json({ error: 'Missing fullName or workEmail' }); return
    }

    const firstName = fullName.trim().split(' ')[0]

    try {
      // Save to Firestore for the admin dashboard
      await admin.firestore().collection('salesInquiries').add({
        fullName, workEmail, eventType: eventType || null, message: message || null,
        status: 'new',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // Notify admin/sales team
      const adminRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [SALES_INBOX],
          subject: `New sales inquiry from ${fullName}`,
          html: buildAdminNotificationEmail({ fullName, workEmail, eventType, message }),
          reply_to: workEmail,
        }),
      })
      if (!adminRes.ok) {
        const err = await adminRes.json()
        console.error('Resend admin email error:', err)
      }

      // Auto-reply to the user
      const userRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [workEmail],
          subject: 'We\'ve received your message — StageCheck Sales',
          html: buildUserAutoReplyEmail({ firstName, email: workEmail }),
          reply_to: SALES_INBOX,
        }),
      })
      if (!userRes.ok) {
        const err = await userRes.json()
        console.error('Resend user auto-reply error:', err)
      }

      res.status(200).json({ success: true })
    } catch (err) {
      console.error('sendSalesInquiry error:', err)
      res.status(500).json({ error: 'Failed to process sales inquiry' })
    }
  }
)