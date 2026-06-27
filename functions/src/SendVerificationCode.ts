import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import fetch from 'node-fetch'
import * as crypto from 'crypto'

if (!admin.apps.length) admin.initializeApp()

const resendApiKey = defineSecret('RESEND_API_KEY')
const FROM_EMAIL = 'StageCheck <events@stagecheck.com.ng>'
const SUPPORT_EMAIL = 'support@stagecheck.com.ng'
const APP_URL = 'https://stagecheck.com.ng'

const ICON_FACEBOOK  = 'https://cdn.simpleicons.org/facebook/22C55E'
const ICON_INSTAGRAM = 'https://cdn.simpleicons.org/instagram/22C55E'
const ICON_X         = 'https://cdn.simpleicons.org/x/22C55E'
const ICON_YOUTUBE   = 'https://cdn.simpleicons.org/youtube/22C55E'
const ICON_TIKTOK    = 'https://cdn.simpleicons.org/tiktok/22C55E'

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

function buildVerificationEmail(params: {
  firstName: string
  code: string
  email: string
}): string {
  const { firstName, code, email } = params
  const digits = code.split('').map(d =>
    `<td style="padding:0 5px;">
      <div style="width:52px;height:64px;background:#0a1628;border:1.5px solid rgba(34,197,94,0.4);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;text-align:center;line-height:64px;">
        <span style="font-size:34px;font-weight:900;color:#22C55E;font-family:Arial,sans-serif;letter-spacing:0;">${d}</span>
      </div>
    </td>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Verify Your Email · StageCheck</title>
</head>
<body style="margin:0;padding:0;background:#030d1a;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#030d1a;min-height:100vh;">
  <tr>
    <td align="center" style="padding:32px 12px 60px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:580px;background:#061220;border-radius:20px;border:1px solid rgba(34,197,94,0.2);overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.7);">

        <!-- top bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#22C55E,#14B8A6,#22C55E);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- header -->
        <tr>
          <td style="padding:28px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <img src="https://res.cloudinary.com/dr0qtfjjf/image/upload/q_auto,f_auto,w_96,h_96,c_fit/v1782579896/logo.png_jn81nk.png"
                       alt="StageCheck" width="44" height="44"
                       style="width:44px;height:44px;display:block;border:0;border-radius:10px;"/>
                </td>
                <td align="right">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:20px;padding:5px 14px;">
                      <span style="font-size:11px;font-weight:bold;color:#22C55E;letter-spacing:0.5px;text-transform:uppercase;">Email Verification</span>
                    </td>
                  </tr></table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:20px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        <!-- hero text -->
        <tr>
          <td style="padding:28px 32px 0;text-align:center;">
            <!-- ticket icon -->
            <div style="display:inline-block;width:72px;height:72px;background:rgba(34,197,94,0.1);border:1.5px solid rgba(34,197,94,0.3);border-radius:20px;text-align:center;line-height:72px;margin-bottom:20px;">
              <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.383.0/icons/ticket.svg"
                   width="32" height="32"
                   style="width:32px;height:32px;vertical-align:middle;filter:invert(58%) sepia(98%) saturate(400%) hue-rotate(95deg);border:0;"/>
            </div>
            <div style="font-size:34px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1.1;font-family:Arial,sans-serif;">
              Verify Your<br/><span style="color:#22C55E;">Email</span>
            </div>
            <p style="margin:14px 0 0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;max-width:400px;margin-left:auto;margin-right:auto;">
              Hi <strong style="color:#ffffff;">${firstName}</strong>, welcome to StageCheck! 🎉<br/>
              Use the verification code below to complete your account setup.
            </p>
          </td>
        </tr>

        <!-- code box -->
        <tr>
          <td style="padding:28px 32px 0;text-align:center;">
            <table cellpadding="0" cellspacing="0" border="0"
                   style="margin:0 auto;background:rgba(34,197,94,0.05);border:1.5px solid rgba(34,197,94,0.25);border-radius:16px;padding:24px 28px;">
              <tr>
                <td style="text-align:center;">
                  <div style="font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:16px;font-family:Arial,sans-serif;">
                    Your Verification Code
                  </div>
                  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                    <tr>${digits}</tr>
                  </table>
                  <div style="margin-top:16px;font-size:12.5px;color:rgba(255,255,255,0.4);font-family:Arial,sans-serif;">
                    This code expires in <strong style="color:#22C55E;">10 minutes.</strong>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- security tip -->
        <tr>
          <td style="padding:20px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.15);border-radius:12px;">
              <tr>
                <td style="padding:16px 18px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="vertical-align:top;padding-right:12px;">
                        <div style="width:36px;height:36px;background:rgba(34,197,94,0.1);border-radius:10px;text-align:center;line-height:36px;">
                          <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.383.0/icons/shield-check.svg"
                               width="18" height="18"
                               style="width:18px;height:18px;vertical-align:middle;filter:invert(58%) sepia(98%) saturate(400%) hue-rotate(95deg);border:0;"/>
                        </div>
                      </td>
                      <td>
                        <div style="font-size:12px;font-weight:700;color:#22C55E;margin-bottom:4px;font-family:Arial,sans-serif;">Security Tip</div>
                        <div style="font-size:12px;color:rgba(255,255,255,0.45);line-height:1.6;font-family:Arial,sans-serif;">
                          Never share this verification code with anyone. StageCheck will never ask for your verification code by phone, email, or chat.
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- didn't request -->
        <tr>
          <td style="padding:16px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;">
              <tr>
                <td style="padding:14px 18px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="vertical-align:top;padding-right:12px;">
                        <div style="width:32px;height:32px;background:rgba(255,255,255,0.05);border-radius:50%;text-align:center;line-height:32px;font-size:15px;color:rgba(255,255,255,0.3);">?</div>
                      </td>
                      <td>
                        <div style="font-size:12px;font-weight:700;color:#ffffff;margin-bottom:3px;font-family:Arial,sans-serif;">Didn't request this?</div>
                        <div style="font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6;font-family:Arial,sans-serif;">
                          You can safely ignore this email if you didn't create a StageCheck account.
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:24px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        <!-- socials -->
        <tr>
          <td style="padding:20px 32px 0;text-align:center;">
            <p style="margin:0 0 14px;font-size:11px;font-weight:bold;color:rgba(255,255,255,0.3);letter-spacing:0.7px;text-transform:uppercase;font-family:Arial,sans-serif;">Stay Connected</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>${socialIconsHtml}</tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:20px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>

        <!-- footer -->
        <tr>
          <td style="padding:18px 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:top;">
                  <img src="https://res.cloudinary.com/dr0qtfjjf/image/upload/q_auto,f_auto,w_48,h_48,c_fit/v1782579896/logo.png_jn81nk.png"
                       alt="StageCheck" width="22" height="22"
                       style="width:22px;height:22px;display:block;border:0;border-radius:6px;opacity:0.4;margin-bottom:6px;"/>
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.7;font-family:Arial,sans-serif;">
                    &copy; ${new Date().getFullYear()} StageCheck. All rights reserved.<br/>
                    Making events seamless, secure and unforgettable.
                  </p>
                </td>
                <td style="vertical-align:top;text-align:right;">
                  <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.3);font-family:Arial,sans-serif;">
                    Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:#22C55E;text-decoration:none;font-weight:bold;">Contact us</a>
                  </p>
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.7;font-family:Arial,sans-serif;">
                    ${SUPPORT_EMAIL}<br/>
                    <a href="${APP_URL}" style="color:rgba(255,255,255,0.2);text-decoration:none;">stagecheck.com.ng</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- bottom bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#14B8A6,#22C55E,#14B8A6);font-size:0;line-height:0;">&nbsp;</td></tr>

      </table>

      <p style="margin:20px 0 0;font-size:11px;color:rgba(255,255,255,0.2);font-family:Arial,sans-serif;">
        This email was sent to <strong style="color:rgba(255,255,255,0.35);">${email}</strong>.
        If this was a mistake, you can safely ignore it.
      </p>
    </td>
  </tr>
</table>
</body>
</html>`
}

// ─── sendVerificationCode ─────────────────────────────────────────────────────
export const sendVerificationCode = onRequest(
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

    const code    = crypto.randomInt(100000, 999999).toString()
    const expires = Date.now() + 10 * 60 * 1000 // 10 min

    // Store in Firestore
    await admin.firestore()
      .collection('emailVerifications')
      .doc(email.toLowerCase())
      .set({ code, expires, email: email.toLowerCase(), createdAt: admin.firestore.FieldValue.serverTimestamp() })

    const html = buildVerificationEmail({ firstName, code, email })

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Verify your StageCheck account',
        html,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.json()
      console.error('Resend error:', err)
      res.status(500).json({ error: 'Failed to send email' }); return
    }

    res.status(200).json({ success: true })
  }
)

// ─── verifyEmailCode ──────────────────────────────────────────────────────────
export const verifyEmailCode = onRequest(
  { timeoutSeconds: 15, memory: '128MiB' },
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST')   { res.status(405).json({ error: 'Method not allowed' }); return }

    const { email, code } = req.body as { email: string; code: string }
    if (!email || !code) {
      res.status(400).json({ error: 'Missing email or code' }); return
    }

    const docRef  = admin.firestore().collection('emailVerifications').doc(email.toLowerCase())
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      res.status(400).json({ error: 'No verification found for this email' }); return
    }

    const { code: stored, expires } = docSnap.data()!

    if (Date.now() > expires) {
      await docRef.delete()
      res.status(400).json({ error: 'Code has expired' }); return
    }

    if (stored !== code) {
      res.status(400).json({ error: 'Incorrect code' }); return
    }

    // Valid — delete it so it can't be reused
    await docRef.delete()
    res.status(200).json({ success: true })
  }
)