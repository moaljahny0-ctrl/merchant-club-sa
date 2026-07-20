'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin, esc } from './_admin-utils'

function buildCreatorApprovalEmailHtml(name: string, email: string, tempPassword: string, siteUrl: string): string {
  const loginUrl = `${siteUrl}/auth/login`
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1A1A1A;border:1px solid #252525;">

          <tr>
            <td style="padding:40px 40px 28px;border-bottom:1px solid #252525;">
              <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#D4AF37;">
                Merchant Club SA
              </p>
              <h1 style="margin:0 0 6px;font-size:26px;font-weight:400;color:#FFFFFF;letter-spacing:-0.02em;">
                You're in.
              </h1>
              <p style="margin:0;font-size:14px;color:#777777;">
                ${esc(name)}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 40px 0;">
              <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#D4AF37;">
                Your creator account is ready
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#FFFFFF;line-height:1.7;font-weight:400;">
                Use the credentials below to log in for the first time.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2A2A2A;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #2A2A2A;background:#141414;">
                    <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Email</p>
                    <p style="margin:0;font-size:14px;color:#FFFFFF;font-family:monospace,Georgia,serif;">${esc(email)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;background:#141414;">
                    <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Temporary password</p>
                    <p style="margin:0;font-size:14px;color:#FFFFFF;font-family:monospace,Georgia,serif;">${esc(tempPassword)}</p>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:#D4AF37;">
                    <a href="${esc(loginUrl)}"
                       style="display:inline-block;padding:18px 40px;font-size:12px;font-family:Georgia,serif;letter-spacing:0.2em;text-transform:uppercase;color:#0D0D0D;text-decoration:none;font-weight:600;">
                      Log in to your dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;font-size:12px;color:#555555;line-height:1.6;">
                After logging in, go to your profile to set your own password.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #252525;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #252525;background:#141414;">
                    <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#D4AF37;">Step 1 — Log in</p>
                    <p style="margin:0;font-size:13px;color:#CCCCCC;line-height:1.6;">Use the email and temporary password above at <a href="${esc(loginUrl)}" style="color:#D4AF37;text-decoration:none;">merchantclubsa.com/auth/login</a>.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;background:#141414;">
                    <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Step 2 — Generate your first link</p>
                    <p style="margin:0;font-size:13px;color:#CCCCCC;line-height:1.6;">From your dashboard, pick a live brand and generate your personal referral link. Every sale through it is tracked to you.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;border-top:1px solid #252525;">
              <p style="margin:0;font-size:10px;color:#444444;letter-spacing:0.1em;">
                merchantclubsa.com &nbsp;·&nbsp; info@merchantclubsa.com
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

export async function updateMemberStatus(
  memberId: string,
  status: 'approved' | 'rejected'
): Promise<{ error: string | null }> {
  try {
    await assertAdmin()
    const service = createServiceClient()

    const { data: member, error: fetchErr } = await service
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (fetchErr || !member) return { error: fetchErr?.message ?? 'Member not found' }

    const now = new Date().toISOString()

    // ── Reject / Revoke ──────────────────────────────────────────────────────
    if (status === 'rejected') {
      const { error } = await service
        .from('members')
        .update({ status: 'rejected', reviewed_at: now })
        .eq('id', memberId)

      if (error) return { error: error.message }

      // If this member was previously approved (a revoke, not a fresh reject),
      // pull their creator access — role and active links — rather than
      // leaving a revoked applicant with a working dashboard login.
      if (member.status === 'approved' && member.user_id) {
        const { data: roleRow } = await service
          .from('roles')
          .select('id')
          .eq('name', 'creator')
          .single()

        if (roleRow) {
          await service
            .from('user_roles')
            .delete()
            .eq('user_id', member.user_id)
            .eq('role_id', roleRow.id)
        }

        await service
          .from('creator_links')
          .update({ is_active: false })
          .eq('creator_id', member.user_id)
      }

      revalidatePath('/dashboard/admin/members')
      return { error: null }
    }

    // ── Approve ───────────────────────────────────────────────────────────────
    if (!member.email) return { error: 'Member has no email on file' }
    if (member.status === 'approved') return { error: null } // already approved, no-op

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

    const tempPassword = Array.from(
      { length: 12 },
      () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
        Math.floor(Math.random() * 62)
      ]
    ).join('')

    let userId: string
    if (member.user_id) {
      // Already has an account (applied while logged in) — just reset the password
      userId = member.user_id
      await service.auth.admin.updateUserById(userId, { password: tempPassword })
    } else {
      const { data: newUser, error: createErr } = await service.auth.admin.createUser({
        email: member.email,
        password: tempPassword,
        email_confirm: true,
      })

      if (createErr) {
        // User already exists under this email — reuse the account
        const { data: listData, error: listErr } = await service.auth.admin.listUsers({ perPage: 1000 })
        if (listErr) return { error: listErr.message }
        const existing = listData.users.find(u => u.email === member.email)
        if (!existing) return { error: `Could not create or locate user: ${createErr.message}` }
        userId = existing.id
        await service.auth.admin.updateUserById(userId, { password: tempPassword })
      } else {
        userId = newUser.user.id
      }
    }

    // Assign the 'creator' role
    const { data: roleRow } = await service
      .from('roles')
      .select('id')
      .eq('name', 'creator')
      .single()

    if (roleRow) {
      await service
        .from('user_roles')
        .upsert({ user_id: userId, role_id: roleRow.id }, { onConflict: 'user_id,role_id' })
    }

    // Mark the member row approved and link it to the auth account
    const { error: updateErr } = await service
      .from('members')
      .update({ status: 'approved', reviewed_at: now, user_id: userId })
      .eq('id', memberId)

    if (updateErr) return { error: updateErr.message }

    // Send credentials
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      try {
        const resend = new Resend(apiKey)
        await resend.emails.send({
          from: 'Merchant Club SA <applications@merchantclubsa.com>',
          to: [member.email],
          subject: 'Your Merchant Club SA creator account is ready',
          html: buildCreatorApprovalEmailHtml(member.full_name ?? 'there', member.email, tempPassword, siteUrl),
        })
      } catch (emailErr) {
        console.error('[admin] Creator approval email failed (account created):', emailErr)
        console.error('[admin] Temp password for manual delivery:', tempPassword)
      }
    } else {
      console.warn('[admin] RESEND_API_KEY not set — temp password for manual delivery:', tempPassword)
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/members')
  return { error: null }
}
