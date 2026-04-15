'use server';

import { Resend } from 'resend';

export type ApplicationState = {
  success: boolean;
  error: string | null;
};

// Sanitize user input before embedding in HTML
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEmailHtml(fields: {
  brandName: string;
  category: string;
  story: string;
  instagram: string;
  email: string;
  website: string;
}): string {
  const { brandName, category, story, instagram, email, website } = fields;

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
                New Brand Application
              </h1>
            </td>
          </tr>

          <!-- Fields -->
          <tr>
            <td style="padding:32px 40px 0;">

              <table width="100%" cellpadding="0" cellspacing="0">

                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Brand Name</p>
                    <p style="margin:0;font-size:20px;color:#FFFFFF;font-weight:400;">${esc(brandName)}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:28px;border-top:1px solid #252525;padding-top:28px;">
                    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Category</p>
                    <p style="margin:0;font-size:15px;color:#FFFFFF;">${esc(category)}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:28px;border-top:1px solid #252525;padding-top:28px;">
                    <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Brand Story</p>
                    <p style="margin:0;font-size:14px;color:#AAAAAA;line-height:1.7;">${esc(story).replace(/\n/g, '<br />')}</p>
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

                ${website ? `
                <tr>
                  <td style="padding-bottom:28px;border-top:1px solid #252525;padding-top:28px;">
                    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Website</p>
                    <a href="${esc(website)}" style="color:#D4AF37;font-size:13px;text-decoration:none;">${esc(website)}</a>
                  </td>
                </tr>` : ''}

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px 36px;border-top:1px solid #252525;margin-top:8px;">
              <p style="margin:0;font-size:10px;color:#555555;letter-spacing:0.1em;">
                Submitted via merchantclubsa.com/apply
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

export async function submitApplication(
  _prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  const brandName = (formData.get('brandName') as string)?.trim();
  const category  = (formData.get('category')  as string)?.trim();
  const story     = (formData.get('story')      as string)?.trim();
  const instagram = (formData.get('instagram')  as string)?.trim() ?? '';
  const email     = (formData.get('email')       as string)?.trim();
  const website   = (formData.get('website')    as string)?.trim() ?? '';

  if (!brandName || !category || !story || !email) {
    return { success: false, error: 'required' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Key not yet configured — log and succeed silently so the form UX still works
    console.warn('[apply] RESEND_API_KEY not set — application not emailed:', { brandName, email });
    return { success: true, error: null };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: 'Merchant Club SA <applications@merchantclubsa.com>',
      to:   ['info@merchantclubsa.com'],
      replyTo: email,
      subject: `New Application: ${brandName}`,
      html: buildEmailHtml({ brandName, category, story, instagram, email, website }),
    });

    if (error) {
      console.error('[apply] Resend error:', error);
      return { success: false, error: 'send_failed' };
    }
  } catch (err) {
    console.error('[apply] Unexpected error:', err);
    return { success: false, error: 'send_failed' };
  }

  return { success: true, error: null };
}
