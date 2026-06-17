import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import fetch from 'node-fetch'

const resendApiKey = defineSecret('RESEND_API_KEY')
const FROM_EMAIL = 'StageCheck <hello@verapixels.com>'

const LOGO_URL =
  'https://res.cloudinary.com/dr0qtfjjf/image/upload/q_auto/f_auto/v1780966404/ChatGPT_Image_Jun_8_2026_10_17_50_PM_phtfqg.png'

const RIBBON_URL =
  'https://res.cloudinary.com/dr0qtfjjf/image/upload/q_auto/f_auto/v1780966404/ChatGPT_Image_Jun_8_2026_10_17_50_PM_phtfqg.png'

const SOCIALS = {
  facebook:  'https://facebook.com/yourpage',
  instagram: 'https://instagram.com/yourhandle',
  twitter:   'https://x.com/yourhandle',
  youtube:   'https://youtube.com/@yourhandle',
  tiktok:    'https://tiktok.com/@yourhandle',
}

// Email-safe hosted PNG icons (white on transparent, will tint green via background circle)
// Using Simple Icons CDN which serves reliable PNGs
const ICON_FACEBOOK  = 'https://cdn.simpleicons.org/facebook/0dc75e'
const ICON_INSTAGRAM = 'https://cdn.simpleicons.org/instagram/0dc75e'
const ICON_X         = 'https://cdn.simpleicons.org/x/0dc75e'
const ICON_YOUTUBE   = 'https://cdn.simpleicons.org/youtube/0dc75e'
const ICON_TIKTOK    = 'https://cdn.simpleicons.org/tiktok/0dc75e'

function qrImageUrl(data: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=0dc75e&bgcolor=060e1c&qzone=2&format=png`
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
  organizerEmail?: string
}): string {
  const {
    attendeeName, phone, ticketCode, ticketType,
    ticketQty, eventName, eventDate, eventTime,
    venueName, venueAddress, organizerEmail,
  } = params

  const qrData = JSON.stringify({ code: ticketCode, event: eventName, attendee: attendeeName, ticket: ticketType })
  const qrUrl  = qrImageUrl(qrData, 180)
  const firstName = attendeeName.split(' ')[0] || attendeeName

  const socialIcons = [
    { href: SOCIALS.facebook,  src: ICON_FACEBOOK,  alt: 'Facebook' },
    { href: SOCIALS.instagram, src: ICON_INSTAGRAM, alt: 'Instagram' },
    { href: SOCIALS.twitter,   src: ICON_X,         alt: 'X' },
    { href: SOCIALS.youtube,   src: ICON_YOUTUBE,   alt: 'YouTube' },
    { href: SOCIALS.tiktok,    src: ICON_TIKTOK,    alt: 'TikTok' },
  ].map(s => `
    <td style="padding:0 5px;">
      <a href="${s.href}" target="_blank" style="display:inline-block;text-decoration:none;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:40px;height:40px;border-radius:20px;background:rgba(13,199,94,0.15);border:1.5px solid rgba(13,199,94,0.35);text-align:center;vertical-align:middle;">
              <img src="${s.src}" alt="${s.alt}" width="18" height="18"
                   style="width:18px;height:18px;display:inline-block;vertical-align:middle;border:0;"/>
            </td>
          </tr>
        </table>
      </a>
    </td>`).join('')


  // Use simple colored square bullets instead of icon images for the detail rows
  // (most reliable across all email clients)
  const bullet = `<td style="width:10px;height:10px;vertical-align:middle;padding-right:12px;">
    <div style="width:8px;height:8px;border-radius:50%;background:#0dc75e;"></div>
  </td>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your Ticket · ${eventName}</title>
</head>
<body style="margin:0;padding:0;background:#030d1a;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#030d1a;min-height:100vh;">
  <tr>
    <td align="center" style="padding:32px 12px 60px;">

      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:600px;background:#061220;border-radius:20px;border:1px solid rgba(13,199,94,0.2);overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.7);">

        <!-- top green bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#0dc75e,#14B8A6,#0dc75e);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- ── HEADER: logo + confirmed badge ── -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="${LOGO_URL}" alt="StageCheck" height="32"
                       style="height:32px;width:auto;display:block;border:0;"/>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="background:rgba(13,199,94,0.1);border:1px solid rgba(13,199,94,0.35);border-radius:20px;padding:5px 12px;">
                        <span style="font-size:12px;color:rgba(255,255,255,0.7);font-family:Arial,sans-serif;">Your Ticket is </span>
                        <span style="font-size:12px;color:#0dc75e;font-weight:bold;font-family:Arial,sans-serif;">Confirmed &#10003;</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── HERO: You're All Set + ribbon ── -->
        <tr>
          <td style="padding:20px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:top;padding-right:10px;">
                  <div style="font-size:38px;font-weight:900;color:#ffffff;line-height:1.05;letter-spacing:-1px;font-family:Arial,sans-serif;">
                    You're<br/>
                    <span style="color:#0dc75e;">All Set!</span>
                  </div>
                  <p style="margin:12px 0 0;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;font-family:Arial,sans-serif;">
                    Hey <strong style="color:#0dc75e;">${firstName}</strong>,<br/>
                    We can't wait to see you at the event!
                  </p>
                </td>
                <td style="vertical-align:top;width:130px;text-align:right;">
                  <img src="${RIBBON_URL}" alt="" width="120"
                       style="width:120px;height:auto;display:inline-block;border:0;border-radius:10px;opacity:0.85;"/>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── TICKET CARD ── -->
        <tr>
          <td style="padding:20px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background:rgba(255,255,255,0.04);border:1px solid rgba(13,199,94,0.2);border-radius:14px;">
              <tr>
                <td style="padding:20px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>

                      <!-- Left: detail rows -->
                      <td style="vertical-align:top;padding-right:16px;">

                        <!-- Attendee Name -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:13px;width:100%;">
                          <tr>
                            ${bullet}
                            <td style="vertical-align:middle;">
                              <div style="font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.08em;font-weight:bold;margin-bottom:2px;font-family:Arial,sans-serif;">Attendee Name</div>
                              <div style="font-size:14px;font-weight:bold;color:#0dc75e;font-family:Arial,sans-serif;">${attendeeName}</div>
                            </td>
                          </tr>
                        </table>

                        <!-- Phone -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:13px;width:100%;">
                          <tr>
                            ${bullet}
                            <td style="vertical-align:middle;">
                              <div style="font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.08em;font-weight:bold;margin-bottom:2px;font-family:Arial,sans-serif;">Phone Number</div>
                              <div style="font-size:14px;font-weight:bold;color:#0dc75e;font-family:Arial,sans-serif;">${phone}</div>
                            </td>
                          </tr>
                        </table>

                        <!-- Ticket Number -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:13px;width:100%;">
                          <tr>
                            ${bullet}
                            <td style="vertical-align:middle;">
                              <div style="font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.08em;font-weight:bold;margin-bottom:2px;font-family:Arial,sans-serif;">Ticket Number</div>
                              <div style="font-size:13px;font-weight:bold;color:#0dc75e;letter-spacing:0.07em;font-family:'Courier New',monospace;">${ticketCode}</div>
                            </td>
                          </tr>
                        </table>

                        <!-- Date & Time -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:13px;width:100%;">
                          <tr>
                            ${bullet}
                            <td style="vertical-align:middle;">
                              <div style="font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.08em;font-weight:bold;margin-bottom:2px;font-family:Arial,sans-serif;">Date &amp; Time</div>
                              <div style="font-size:13px;font-weight:bold;color:#0dc75e;font-family:Arial,sans-serif;">${eventDate}${eventTime ? ' &middot; ' + eventTime : ''}</div>
                            </td>
                          </tr>
                        </table>

                        <!-- Venue -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:13px;width:100%;">
                          <tr>
                            ${bullet}
                            <td style="vertical-align:top;">
                              <div style="font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.08em;font-weight:bold;margin-bottom:2px;font-family:Arial,sans-serif;">Venue</div>
                              <div style="font-size:13px;font-weight:bold;color:#ffffff;font-family:Arial,sans-serif;">${venueName}</div>
                              ${venueAddress ? `<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;font-family:Arial,sans-serif;">${venueAddress}</div>` : ''}
                            </td>
                          </tr>
                        </table>

                        <!-- Important -->
                        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                          <tr>
                            ${bullet}
                            <td style="vertical-align:top;">
                              <div style="font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.08em;font-weight:bold;margin-bottom:2px;font-family:Arial,sans-serif;">Important</div>
                              <div style="font-size:12px;color:rgba(255,255,255,0.55);line-height:1.55;font-family:Arial,sans-serif;">
                                Please arrive early and bring your QR code for a smooth check-in.
                              </div>
                            </td>
                          </tr>
                        </table>

                      </td>

                      <!-- Right: ticket count + QR -->
                      <td style="vertical-align:top;width:150px;text-align:center;">
                        <!-- ticket count pill -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12px;">
                          <tr>
                            <td style="background:rgba(13,199,94,0.15);border:1.5px solid rgba(13,199,94,0.4);border-radius:20px;padding:6px 14px;text-align:center;">
                              <span style="font-size:12px;font-weight:bold;color:#0dc75e;font-family:Arial,sans-serif;">&#x2022; ${ticketQty} TICKET${ticketQty > 1 ? 'S' : ''}</span>
                            </td>
                          </tr>
                        </table>

                        <!-- QR -->
                        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 10px;background:#060e1c;border:2px solid rgba(13,199,94,0.3);border-radius:12px;">
                          <tr>
                            <td style="padding:8px;">
                              <img src="${qrUrl}" alt="QR Code" width="130" height="130"
                                   style="width:130px;height:130px;display:block;border:0;border-radius:6px;"/>
                            </td>
                          </tr>
                        </table>

                        <div style="font-size:12px;font-style:italic;color:rgba(255,255,255,0.5);font-family:Arial,sans-serif;">
                          &#x2197; Scan to Check-In
                        </div>
                      </td>

                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── REPLY CTA ── -->
        <tr>
          <td style="padding:22px 32px 0;text-align:center;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>
                <td style="background:#0dc75e;border-radius:10px;padding:13px 28px;text-align:center;">
                  <a href="mailto:${organizerEmail || 'hello@verapixels.com'}"
                     style="font-size:14px;font-weight:bold;color:#000000;text-decoration:none;font-family:Arial,sans-serif;">
                    &#x21A9; Reply to this email
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:10px 0 0;font-size:12px;color:rgba(255,255,255,0.3);font-family:Arial,sans-serif;">We're here to help!</p>
          </td>
        </tr>

        <!-- divider -->
        <tr><td style="padding:22px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        <!-- ── SOCIAL ICONS ── -->
        <tr>
          <td style="padding:20px 32px 0;text-align:center;">
            <p style="margin:0 0 14px;font-size:12px;font-weight:bold;color:rgba(255,255,255,0.35);letter-spacing:0.6px;font-family:Arial,sans-serif;text-transform:uppercase;">Stay Connected</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>${socialIcons}</tr>
            </table>
          </td>
        </tr>

        <!-- divider -->
        <tr><td style="padding:20px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="padding:18px 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:top;">
                  <img src="${LOGO_URL}" alt="StageCheck" height="22" style="height:22px;width:auto;display:block;margin-bottom:8px;border:0;opacity:0.5;"/>
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.6;font-family:Arial,sans-serif;">
                    &copy; 2025 StageCheck. All rights reserved.<br/>
                    Making events seamless, secure and unforgettable.
                  </p>
                </td>
                <td style="vertical-align:top;text-align:right;">
                  <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.3);font-family:Arial,sans-serif;">
                    Need help? <a href="mailto:hello@verapixels.com" style="color:#0dc75e;text-decoration:none;font-weight:bold;">Contact us</a>
                  </p>
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.7;font-family:Arial,sans-serif;">
                    hello@stagecheck.com<br/>
                    +234 701 000 0000
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- bottom bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#14B8A6,#0dc75e,#14B8A6);font-size:0;line-height:0;">&nbsp;</td></tr>

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
      organizerEmail,
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
      organizerEmail?: string
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
      organizerEmail,
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
          reply_to: organizerEmail || undefined,
          subject: `Your ticket for ${eventName} · StageCheck`,
          html,
        }),
      })

      const body = await r.json()
      console.log('Resend response:', r.status, JSON.stringify(body))

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