import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import fetch from 'node-fetch'

if (!admin.apps.length) admin.initializeApp()

const resendApiKey = defineSecret('RESEND_API_KEY')

const FROM_EMAIL = 'StageCheck <info@stagecheck.com.ng>'
const SUPPORT_EMAIL = 'support@stagecheck.com.ng'
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

function buildWelcomeEmail(params: { firstName: string; email: string }): string {
  const { firstName, email } = params

  const features = [
    {
      bg: 'rgba(34,197,94,0.12)',
      border: 'rgba(34,197,94,0.3)',
      icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.383.0/icons/ticket.svg',
      filter: 'invert(58%) sepia(98%) saturate(400%) hue-rotate(95deg)',
      title: 'Discover Events',
      desc: 'Find events that match your interests.',
    },
    {
      bg: 'rgba(139,92,246,0.14)',
      border: 'rgba(139,92,246,0.3)',
      icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.383.0/icons/calendar.svg',
      filter: 'invert(70%) sepia(40%) saturate(2000%) hue-rotate(225deg)',
      title: 'Book & Attend',
      desc: 'Book tickets easily and attend with confidence.',
    },
    {
      bg: 'rgba(59,130,246,0.14)',
      border: 'rgba(59,130,246,0.3)',
      icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.383.0/icons/scan-line.svg',
      filter: 'invert(60%) sepia(80%) saturate(1500%) hue-rotate(190deg)',
      title: 'Seamless Check-In',
      desc: 'Quick and secure check-in at every event.',
    },
  ].map(f => `
    <tr>
      <td style="padding-bottom:18px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td style="width:48px;vertical-align:top;padding-right:14px;">
            <div style="width:44px;height:44px;background:${f.bg};border:1.5px solid ${f.border};border-radius:12px;text-align:center;line-height:44px;">
              <img src="${f.icon}" width="20" height="20" style="width:20px;height:20px;vertical-align:middle;filter:${f.filter};border:0;"/>
            </div>
          </td>
          <td style="vertical-align:middle;">
            <div style="font-size:14.5px;font-weight:700;color:#ffffff;margin-bottom:3px;font-family:Arial,sans-serif;">${f.title}</div>
            <div style="font-size:12.5px;color:rgba(255,255,255,0.78);line-height:1.55;font-family:Arial,sans-serif;">${f.desc}</div>
          </td>
        </tr></table>
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Welcome to StageCheck</title>
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

        <!-- top logo + wordmark -->
        <tr>
          <td style="padding:32px 32px 0;text-align:center;">
            <img src="${LOGO_URL}" alt="StageCheck" width="56" height="56"
                 style="width:56px;height:56px;display:inline-block;border:0;border-radius:14px;margin-bottom:14px;"/>
            <div style="font-size:22px;font-weight:900;letter-spacing:-0.5px;font-family:Arial,sans-serif;">
              <span style="color:#ffffff;">STAGE</span><span style="color:#22C55E;">CHECK</span>
            </div>
          </td>
        </tr>

        <!-- success check -->
        <tr>
          <td style="padding:24px 32px 0;text-align:center;">
            <div style="width:60px;height:60px;background:rgba(34,197,94,0.1);border:2px solid rgba(34,197,94,0.4);border-radius:50%;display:inline-block;text-align:center;line-height:58px;">
              <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.383.0/icons/check.svg" width="26" height="26"
                   style="width:26px;height:26px;vertical-align:middle;filter:invert(58%) sepia(98%) saturate(400%) hue-rotate(95deg);border:0;"/>
            </div>
          </td>
        </tr>

        <!-- hero text -->
        <tr>
          <td style="padding:18px 32px 0;text-align:center;">
            <div class="sc-hero-title" style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1.2;font-family:Arial,sans-serif;">
              Welcome to <span style="color:#22C55E;">StageCheck!</span>
            </div>
            <p class="sc-hero-sub" style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-family:Arial,sans-serif;">
              Your account has been created successfully.
            </p>
          </td>
        </tr>

        <!-- greeting body -->
        <tr>
          <td style="padding:20px 32px 0;text-align:center;">
            <p class="sc-body-text" style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.75;font-family:Arial,sans-serif;">
              <strong style="color:#22C55E;">Hi ${firstName},</strong><br/>
              We're excited to have you on board. StageCheck is your all-in-one platform for discovering amazing events, booking tickets, and creating unforgettable experiences.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:24px 32px 0;text-align:center;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>
                <td style="background:#22C55E;border-radius:12px;">
                  <a href="${APP_URL}/events" target="_blank"
                     style="display:inline-block;padding:13px 28px;font-size:14.5px;font-weight:700;color:#050d0a;text-decoration:none;font-family:Arial,sans-serif;">
                    Explore Events &nbsp;→
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:28px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        <!-- what you can do -->
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0 0 16px;font-size:14px;font-weight:800;color:#ffffff;text-align:center;font-family:Arial,sans-serif;">
              What you can do with StageCheck
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${features}
            </table>
          </td>
        </tr>

        <!-- help -->
        <tr>
          <td style="padding:6px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.18);border-radius:12px;">
              <tr>
                <td style="padding:14px 18px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="vertical-align:top;width:36px;padding-right:12px;">
                        <div style="width:32px;height:32px;background:rgba(34,197,94,0.12);border-radius:50%;text-align:center;line-height:32px;">
                          <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.383.0/icons/shield-check.svg" width="16" height="16"
                               style="width:16px;height:16px;vertical-align:middle;filter:invert(58%) sepia(98%) saturate(400%) hue-rotate(95deg);border:0;"/>
                        </div>
                      </td>
                      <td>
                        <div style="font-size:12.5px;font-weight:700;color:#22C55E;margin-bottom:3px;font-family:Arial,sans-serif;">Need help getting started?</div>
                        <div class="sc-body-text" style="font-size:12.5px;color:rgba(255,255,255,0.8);line-height:1.6;font-family:Arial,sans-serif;">
                          Check out our Help Center or reach out to our support team.
                          <a href="${APP_URL}/help" style="color:#22C55E;font-weight:700;text-decoration:none;">Visit Help Center →</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:26px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        <!-- thank you -->
        <tr>
          <td style="padding:22px 32px 0;text-align:center;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;">Thank you for choosing StageCheck.</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.75);font-family:Arial,sans-serif;">Let's make every event unforgettable.</p>
          </td>
        </tr>

        <!-- socials -->
        <tr>
          <td style="padding:18px 32px 0;text-align:center;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>${socialIconsHtml}</tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:22px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        <!-- footer -->
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
                    <a href="mailto:${SUPPORT_EMAIL}" style="color:#22C55E;text-decoration:none;font-weight:bold;">${SUPPORT_EMAIL}</a>
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
        © ${new Date().getFullYear()} StageCheck. All rights reserved.<br/>
        This email was sent to <strong style="color:rgba(255,255,255,0.7);">${email}</strong>.
        If you didn't create this account, you can safely ignore this email.
      </p>
    </td>
  </tr>
</table>
</body>
</html>`
}

// ─── sendWelcomeEmail ──────────────────────────────────────────────────────
export const sendWelcomeEmail = onRequest(
  { timeoutSeconds: 30, memory: '256MiB', secrets: ['RESEND_API_KEY'] },
  async (req, res) => {
    const RESEND_KEY = resendApiKey.value()

    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST')   { res.status(405).json({ error: 'Method not allowed' }); return }

    const { email, firstName } = req.body as { email: string; firstName: string }
    if (!email || !firstName) {
      res.status(400).json({ error: 'Missing email or firstName' }); return
    }

    const html = buildWelcomeEmail({ firstName, email })

    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject: 'Welcome to StageCheck! Your account is ready 🎉',
          html,
          reply_to: SUPPORT_EMAIL,
        }),
      })

      if (!resendRes.ok) {
        const err = await resendRes.json()
        console.error('Resend error:', err)
        res.status(500).json({ error: 'Failed to send email' }); return
      }

      res.status(200).json({ success: true })
    } catch (err) {
      console.error('sendWelcomeEmail error:', err)
      res.status(500).json({ error: 'Failed to send email' })
    }
  }
)