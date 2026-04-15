'use server';

import { Resend } from 'resend';

export type MemberEnquiryState = {
  success: boolean;
  error: string | null;
};

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMemberEmailHtml(fields: {
  name: string;
  type: string;
  platform: string;
  audience: string;
  idea: string;
  email: string;
  instagram: string;
}): string {
  const { name, type, platform, audience, idea, email, instagram } = fields;

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

          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 32px;border-bottom:1px solid #252525;">
              <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#D4AF37;">
                Merchant Club SA
              </p>
              <h1 style="margin:0;font-size:24px;font-weight:400;color:#FFFFFF;letter-spacing:-0.02em;">
                New Member Enquiry
              </h1>
            </td>
          </tr>

          <!-- Fields -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Name / Channel</p>
                    <p style="margin:0;font-size:20px;color:#FFFFFF;font-weight:400;">${esc(name)}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:28px;border-top:1px solid #252525;padding-top:28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-right:16px;">
                          <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Type</p>
                          <p style="margin:0;font-size:14px;color:#FFFFFF;">${esc(type)}</p>
                        </td>
                        <td width="50%">
                          <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Primary Platform</p>
                          <p style="margin:0;font-size:14px;color:#FFFFFF;">${esc(platform)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:28px;border-top:1px solid #252525;padding-top:28px;">
                    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Audience Size</p>
                    <p style="margin:0;font-size:14px;color:#FFFFFF;">${esc(audience)}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:28px;border-top:1px solid #252525;padding-top:28px;">
                    <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Collaboration Idea</p>
                    <p style="margin:0;font-size:14px;color:#AAAAAA;line-height:1.7;">${esc(idea).replace(/\n/g, '<br />')}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:28px;border-top:1px solid #252525;padding-top:28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-right:16px;">
                          <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Email</p>
                          <a href="mailto:${esc(email)}" style="color:#D4AF37;font-size:13px;text-decoration:none;">${esc(email)}</a>
                        </td>
                        <td width="50%">
                          <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Instagram</p>
                          <p style="margin:0;font-size:13px;color:#FFFFFF;">${instagram ? esc(instagram) : '—'}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px 36px;border-top:1px solid #252525;margin-top:8px;">
              <p style="margin:0;font-size:10px;color:#555555;letter-spacing:0.1em;">
                Submitted via merchantclubsa.com/apply/member
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function submitMemberEnquiry(
  _prevState: MemberEnquiryState,
  formData: FormData
): Promise<MemberEnquiryState> {
  const name      = (formData.get('name')      as string)?.trim();
  const type      = (formData.get('type')      as string)?.trim();
  const platform  = (formData.get('platform')  as string)?.trim();
  const audience  = (formData.get('audience')  as string)?.trim();
  const idea      = (formData.get('idea')      as string)?.trim();
  const email     = (formData.get('email')     as string)?.trim();
  const instagram = (formData.get('instagram') as string)?.trim() ?? '';

  if (!name || !type || !platform || !idea || !email) {
    return { success: false, error: 'required' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[member] RESEND_API_KEY not set — enquiry not emailed:', { name, email });
    return { success: true, error: null };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: 'Merchant Club SA <applications@merchantclubsa.com>',
      to:   ['info@merchantclubsa.com'],
      replyTo: email,
      subject: `New Member Enquiry: ${name}`,
      html: buildMemberEmailHtml({ name, type, platform, audience: audience ?? '', idea, email, instagram }),
    });

    if (error) {
      console.error('[member] Resend error:', error);
      return { success: false, error: 'send_failed' };
    }
  } catch (err) {
    console.error('[member] Unexpected error:', err);
    return { success: false, error: 'send_failed' };
  }

  return { success: true, error: null };
}
