import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import fetch from 'node-fetch'

if (!admin.apps.length) admin.initializeApp()

const resendApiKey = defineSecret('RESEND_API_KEY')
const FROM_EMAIL = 'StageCheck <hello@verapixels.com>'
const APP_URL = 'https://stagecheck.verapixels.com' // ← update if needed

const LOGO_URL =
  'https://res.cloudinary.com/dr0qtfjjf/image/upload/q_auto/f_auto/v1780966404/ChatGPT_Image_Jun_8_2026_10_17_50_PM_phtfqg.png'

// ─── Scope label helper ───────────────────────────────────────────────────────
function buildScopeLabel(scope: 'all' | string[], scopeNames: string[]): string {
  if (scope === 'all') return 'Full Access — you can check in all attendees.'
  if (!scopeNames.length) return 'Scoped access to specific areas.'
  return `Scoped access to: <strong style="color:#fff;">${scopeNames.join(', ')}</strong>`
}

// ─── Email template ───────────────────────────────────────────────────────────
function buildInvitationEmail({
  eventName,
  eventImage,
  organizerName,
  invitedEmail,
  role,
  scope,
  scopeNames,
  acceptUrl,
}: {
  eventName: string
  eventImage?: string
  organizerName: string
  invitedEmail: string
  role: string
  scope: 'all' | string[]
  scopeNames: string[]
  acceptUrl: string
}): string {
  const scopeLabel = buildScopeLabel(scope, scopeNames)
  const roleLabel  = role === 'checkin_admin' ? 'Check-in Admin' : role

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>You've been invited · StageCheck</title>
  <style>
    * { box-sizing: border-box; }
    body { margin:0; padding:0; background:#000612; font-family:'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
    a { color:#6366F1; text-decoration:none; }
  </style>
</head>
<body style="margin:0;padding:0;background:#000612;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000612;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px 60px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:560px;background:linear-gradient(160deg,#0d1829 0%,#070e1c 100%);border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.6);">
          <!-- Top bar -->
          <tr><td style="height:3px;background:linear-gradient(90deg,#6366F1,#818CF8,#6366F1);"></td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:28px 36px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td><img src="${LOGO_URL}" alt="StageCheck" height="32" style="height:32px;width:auto;display:block;"/></td>
                  <td align="right">
                    <span style="display:inline-block;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:20px;padding:5px 14px;font-size:11px;font-weight:700;color:#818CF8;letter-spacing:0.6px;text-transform:uppercase;">
                      Team Invitation
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="padding:0 36px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

          ${eventImage ? `
          <!-- Event banner -->
          <tr>
            <td style="padding:0;">
              <img src="${eventImage}" alt="${eventName}" style="width:100%;height:180px;object-fit:cover;display:block;"/>
            </td>
          </tr>` : ''}

          <!-- Body -->
          <tr>
            <td style="padding:28px 36px 8px;">
              <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.4);">Hi there,</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#fff;line-height:1.2;">
                You've been invited to join a team
              </h1>
              <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
                <strong style="color:rgba(255,255,255,0.85);">${organizerName}</strong> has invited you to help manage
                <strong style="color:#fff;">${eventName}</strong> on StageCheck.
              </p>

              <!-- Role card -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.18);border-radius:14px;margin-bottom:22px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <div style="font-size:10px;font-weight:700;letter-spacing:0.9px;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">Your Role</div>
                    <div style="font-size:16px;font-weight:800;color:#818CF8;margin-bottom:10px;">${roleLabel}</div>
                    <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:10px;"></div>
                    <div style="font-size:10px;font-weight:700;letter-spacing:0.9px;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">Access Scope</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.5;">${scopeLabel}</div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 22px;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
                Click the button below to accept. If you don't have a StageCheck account yet, you'll be able to create one first — your invitation will be waiting for you.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 36px 28px;text-align:center;">
              <a href="${acceptUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;font-size:15px;font-weight:800;padding:14px 40px;border-radius:12px;text-decoration:none;letter-spacing:0.02em;box-shadow:0 6px 24px rgba(99,102,241,0.35);">
                Accept Invitation
              </a>
              <p style="margin:14px 0 0;font-size:11px;color:rgba(255,255,255,0.25);">
                Or copy this link: <a href="${acceptUrl}" style="color:#818CF8;word-break:break-all;">${acceptUrl}</a>
              </p>
            </td>
          </tr>

          <tr><td style="padding:0 36px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px 28px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.2);">
                Powered by <span style="color:#6366F1;">StageCheck</span>
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.18);line-height:1.6;">
                This invitation was sent to <strong style="color:rgba(255,255,255,0.28);">${invitedEmail}</strong>.<br/>
                If this was a mistake, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr><td style="height:3px;background:linear-gradient(90deg,#818CF8,#6366F1,#818CF8);"></td></tr>
        </table>
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
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

    const {
      invitedEmail,
      eventId,
      eventName,
      eventImage,
      organizerName,
      organizerUid,
      role,
      scope,        // 'all' | string[]  (array of nodeIds)
      scopeNames,   // human-readable names matching the nodeIds
    } = req.body as {
      invitedEmail: string
      eventId: string
      eventName: string
      eventImage?: string
      organizerName: string
      organizerUid: string
      role: string
      scope: 'all' | string[]
      scopeNames: string[]
    }

    if (!invitedEmail || !eventId || !eventName || !organizerUid) {
      res.status(400).json({ error: 'Missing required fields' }); return
    }

    try {
      // 1. Create the invitation doc in Firestore
      const invRef = await admin.firestore().collection('invitations').add({
        invitedEmail,
        eventId,
        eventName,
        eventImage: eventImage || null,
        organizerName,
        organizerUid,
        role,
        scope,       // 'all' or array of nodeIds
        scopeNames,  // human-readable
        status: 'pending',
        invitedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      const invitationId = invRef.id
      const acceptUrl    = `${APP_URL}/accept-invitation/${invitationId}`

      // 2. Send email via Resend
      const html = buildInvitationEmail({
        eventName,
        eventImage,
        organizerName,
        invitedEmail,
        role,
        scope,
        scopeNames,
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
          subject: `You've been invited to manage ${eventName} · StageCheck`,
          html,
        }),
      })

      if (!resendRes.ok) {
        const err = await resendRes.text()
        console.error('Resend error:', err)
        // Still return success — invitation doc was created, email can be retried
        res.status(200).json({ success: true, invitationId, emailSent: false })
        return
      }

      res.status(200).json({ success: true, invitationId, emailSent: true })
    } catch (e: any) {
      console.error('sendInvitation error:', e)
      res.status(500).json({ error: e.message ?? 'Internal error' })
    }
  }
)