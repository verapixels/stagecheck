import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import fetch from 'node-fetch'

const resendApiKey = defineSecret('RESEND_API_KEY')
const FROM_EMAIL = 'StageCheck <tickets@stagecheck.com.ng>'
const REPLY_TO = 'tickets@stagecheck.com.ng'
const ENQUIRIES_EMAIL = 'info@stagecheck.com.ng'

const LOGO_URL =
  'https://res.cloudinary.com/dr0qtfjjf/image/upload/v1780966404/ChatGPT_Image_Jun_8_2026_10_17_50_PM_phtfqg.png'

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
const ICON_TIKTOK    = 'https://cdn.simpleicons.org/tiktok/0dc75e'

function qrImageUrl(data: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=000000&bgcolor=ffffff&qzone=2&format=png`
}

function buildTicketEmail(params: {
  attendeeName: string
  phone: string
  ticketCode: string
  ticketType: string
  ticketQty: number
  eventName: string
  eventDate: string
  eventTime: string
  venueName: string
  venueAddress: string
  eventImage?: string
}): string {
  const {
    attendeeName, phone, ticketCode, ticketType,
    ticketQty, eventName, eventDate, eventTime,
    venueName, venueAddress, eventImage,
  } = params

  const qrData = JSON.stringify({ code: ticketCode, event: eventName, attendee: attendeeName })
  const qrUrl  = qrImageUrl(qrData, 240)
  const firstName = attendeeName.split(' ')[0] || attendeeName
  const banner = eventImage || LOGO_URL

  const socialIcons = [
    { href: SOCIALS.instagram, src: ICON_INSTAGRAM, alt: 'Instagram' },
    { href: SOCIALS.twitter,   src: ICON_X,         alt: 'X' },
    { href: SOCIALS.facebook,  src: ICON_FACEBOOK,  alt: 'Facebook' },
    { href: SOCIALS.tiktok,    src: ICON_TIKTOK,    alt: 'TikTok' },
  ].map(s => `
    <td style="padding:0 5px;">
      <a href="${s.href}" target="_blank" style="display:inline-block;text-decoration:none;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="width:32px;height:32px;border-radius:16px;background:rgba(13,199,94,0.12);text-align:center;vertical-align:middle;">
            <img src="${s.src}" alt="${s.alt}" width="14" height="14" style="width:14px;height:14px;display:inline-block;vertical-align:middle;border:0;"/>
          </td>
        </tr></table>
      </a>
    </td>`).join('')

  const detailRow = (glyph: string, label: string, value: string, subValue = '') => `
    <tr>
      <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td style="width:34px;vertical-align:top;padding-right:12px;">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="width:34px;height:34px;border-radius:10px;background:rgba(13,199,94,0.12);text-align:center;vertical-align:middle;">
                <span style="font-size:14px;color:#0dc75e;font-weight:700;font-family:Arial,sans-serif;">${glyph}</span>
              </td>
            </tr></table>
          </td>
          <td style="vertical-align:middle;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:2px;font-family:Arial,sans-serif;">${label}</div>
            <div style="font-size:14px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;">${value}</div>
            ${subValue ? `<div style="font-size:12px;color:rgba(255,255,255,0.45);margin-top:2px;font-family:Arial,sans-serif;">${subValue}</div>` : ''}
          </td>
        </tr></table>
      </td>
    </tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Your Ticket · ${eventName}</title>
  <style>
    [data-ogsc] img, [data-ogsb] img { background: transparent !important; }
    u + .body img { background: transparent !important; }
  </style>
</head>
<body style="margin:0;padding:0;background:#030d1a;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#030d1a;">
  <tr>
    <td align="center" style="padding:24px 12px 48px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:520px;background:#0a1424;border-radius:18px;border:1px solid rgba(13,199,94,0.15);overflow:hidden;">

        <!-- HEADER -->
        <tr>
          <td style="padding:20px 22px 0;background:#0a1424;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="vertical-align:middle;background:#0a1424;">
                <img src="${LOGO_URL}" alt="StageCheck" height="24" style="height:24px;width:auto;display:block;border:0;background:#0a1424;"/>
              </td>
              <td align="right" style="vertical-align:middle;">
                <table cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="background:rgba(13,199,94,0.12);border-radius:20px;padding:5px 12px;">
                    <span style="font-size:11px;color:#0dc75e;font-weight:700;font-family:Arial,sans-serif;">&#10003; Ticket Confirmed</span>
                  </td>
                </tr></table>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- BANNER -->
        <tr>
          <td style="padding:16px 22px 0;">
            <div style="position:relative;border-radius:14px;overflow:hidden;background:#0a1628;">
              <img src="${banner}" alt="${eventName}" width="476"
                   style="width:100%;max-width:476px;height:160px;object-fit:cover;display:block;border:0;border-radius:14px;"/>
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(3,13,26,0.95));">
                <tr>
                  <td style="padding:30px 16px 14px;">
                    <div style="font-size:20px;font-weight:900;color:#ffffff;font-family:Arial,sans-serif;">${eventName}</div>
                    <div style="margin-top:6px;font-size:12px;color:#0dc75e;font-weight:600;font-family:Arial,sans-serif;">
                      ${eventDate}${eventTime ? `&nbsp;&middot;&nbsp;${eventTime}` : ''}
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- HERO TEXT -->
        <tr>
          <td style="padding:24px 22px 4px;text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;font-family:Arial,sans-serif;">
              You're <span style="color:#0dc75e;">All Set!</span>
            </div>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;font-family:Arial,sans-serif;">
              Your ticket has been successfully confirmed.<br/>
              We can't wait to see you at the event, ${firstName}!
            </p>
          </td>
        </tr>

        <!-- TICKET DETAILS -->
        <tr>
          <td style="padding:18px 22px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background:rgba(255,255,255,0.03);border-radius:14px;overflow:hidden;">
              ${detailRow('&#127915;', 'Ticket Type', `${ticketType} &middot; ${ticketQty} Ticket${ticketQty > 1 ? 's' : ''}`)}
              ${detailRow('&#128100;', 'Attendee', attendeeName, phone || '')}
              ${detailRow('&#128197;', 'Date &amp; Time', eventDate, eventTime || '')}
              ${detailRow('&#128205;', 'Venue', venueName, venueAddress || '')}
            </table>
          </td>
        </tr>

        <!-- ENTRY PASS -->
        <tr>
          <td style="padding:18px 22px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background:rgba(13,199,94,0.06);border-radius:14px;">
              <tr><td style="padding:22px;text-align:center;">
                <div style="font-size:13px;font-weight:700;color:#0dc75e;margin-bottom:4px;font-family:Arial,sans-serif;">Your Entry Pass</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:18px;font-family:Arial,sans-serif;">Show this QR code at the entrance</div>
                <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 14px;"><tr>
                  <td style="background:#ffffff;border-radius:12px;padding:10px;">
                    <img src="${qrUrl}" alt="QR Code" width="200" height="200" style="width:200px;height:200px;display:block;border:0;"/>
                  </td>
                </tr></table>
                <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:4px;font-family:Arial,sans-serif;">Ticket Number</div>
                <div style="font-size:16px;font-weight:900;color:#0dc75e;letter-spacing:1.5px;font-family:'Courier New',monospace;">${ticketCode}</div>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- IMPORTANT INFO -->
        <tr>
          <td style="padding:18px 22px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.02);border-radius:14px;">
              <tr><td style="padding:16px 18px;">
                <div style="font-size:13px;font-weight:700;color:#ffffff;margin-bottom:10px;font-family:Arial,sans-serif;">Important Information</div>
                ${['Please arrive at least 30 minutes early.', 'Bring your QR code for a smooth check-in.', 'This ticket is non-transferable.'].map(tip => `
                <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:6px;"><tr>
                  <td style="color:#0dc75e;font-size:13px;padding-right:8px;vertical-align:top;">&#10003;</td>
                  <td style="font-size:12px;color:rgba(255,255,255,0.55);font-family:Arial,sans-serif;line-height:1.5;">${tip}</td>
                </tr></table>`).join('')}
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- ENQUIRIES -->
        <tr>
          <td style="padding:14px 22px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background:rgba(13,199,94,0.05);border:1px solid rgba(13,199,94,0.15);border-radius:14px;">
              <tr><td style="padding:16px 18px;text-align:center;">
                <div style="font-size:12px;font-weight:700;color:#ffffff;margin-bottom:4px;font-family:Arial,sans-serif;">Have a question?</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.45);font-family:Arial,sans-serif;">
                  You can reply to this email or reach us at<br/>
                  <a href="mailto:${ENQUIRIES_EMAIL}" style="color:#0dc75e;text-decoration:none;font-weight:700;">${ENQUIRIES_EMAIL}</a>
                </div>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:20px 22px 22px;background:#0a1424;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="vertical-align:top;background:#0a1424;">
                <img src="${LOGO_URL}" alt="StageCheck" height="20" style="height:20px;width:auto;display:block;margin-bottom:6px;border:0;opacity:0.5;background:#0a1424;"/>
                <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.2);line-height:1.5;font-family:Arial,sans-serif;">
                  Making events seamless, secure<br/>and unforgettable.
                </p>
              </td>
              <td align="right" style="vertical-align:top;">
                <table cellpadding="0" cellspacing="0" border="0"><tr>${socialIcons}</tr></table>
              </td>
            </tr></table>
            <p style="margin:14px 0 0;font-size:10px;color:rgba(255,255,255,0.15);text-align:center;font-family:Arial,sans-serif;">
              &copy; 2025 StageCheck. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

// ─── Cloud Function ───────────────────────────────────────────────────────────
export const sendTicketConfirmation = onRequest(
  { timeoutSeconds: 30, memory: '256MiB', secrets: ['RESEND_API_KEY'] },
  async (req, res) => {
    const RESEND_KEY = resendApiKey.value()
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

    const {
      attendeeName,
      attendeeEmail,
      phone,
      ticketCode,
      ticketType,
      ticketQty,
      eventName,
      eventDate,
      eventTime,
      venueName,
      venueAddress,
      eventImage,
    } = req.body as {
      attendeeName: string
      attendeeEmail: string
      phone: string
      ticketCode: string
      ticketType?: string
      ticketQty?: number
      eventName: string
      eventDate: string
      eventTime: string
      venueName: string
      venueAddress: string
      eventImage?: string
    }

    if (!attendeeName || !attendeeEmail || !ticketCode || !eventName) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    const html = buildTicketEmail({
      attendeeName,
      phone: phone || '',
      ticketCode,
      ticketType: ticketType || 'General Admission',
      ticketQty: ticketQty || 1,
      eventName,
      eventDate,
      eventTime,
      venueName,
      venueAddress,
      eventImage,
    })

    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [attendeeEmail],
          reply_to: REPLY_TO,
          subject: `Your ticket for ${eventName} · StageCheck`,
          html,
        }),
      })

      const body = await r.json()
      if (!r.ok) {
        res.status(500).json({ error: 'Failed to send email', details: body })
        return
      }

      res.status(200).json({ success: true })
    } catch (err) {
      console.error('sendTicketConfirmation error:', err)
      res.status(500).json({ error: 'Internal error' })
    }
  }
)