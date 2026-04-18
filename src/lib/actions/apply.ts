'use server';

import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/server';

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
  applicationId: string;
  submittedAt: string;
}): string {
  const { brandName, category, story, instagram, email, website, applicationId, submittedAt } = fields;

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
                        ${instagram ? `
                        <td width="50%">
                          <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Instagram</p>
                          <p style="margin:0;font-size:13px;color:#FFFFFF;">${esc(instagram)}</p>
                        </td>` : '<td width="50%"></td>'}
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

                <tr>
                  <td style="padding-bottom:28px;border-top:1px solid #252525;padding-top:28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-right:16px;">
                          <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Submitted</p>
                          <p style="margin:0;font-size:13px;color:#AAAAAA;">${esc(submittedAt)}</p>
                        </td>
                        <td width="50%">
                          <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#777777;">Application ID</p>
                          <p style="margin:0;font-size:11px;color:#555555;font-family:monospace;">${esc(applicationId)}</p>
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
                Submitted via merchantclubsa.com/apply/partner
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

  // Insert into brand_applications — this is the source of truth for the admin queue
  const supabase = createServiceClient();
  const { data: inserted, error: dbError } = await supabase
    .from('brand_applications')
    .insert({
      brand_name_en:     brandName,
      category,
      brand_description: story,
      contact_name:      brandName,
      contact_email:     email,
      instagram_url:     instagram || null,
      website_url:       website   || null,
    })
    .select('id, created_at')
    .single();

  if (dbError || !inserted) {
    console.error('[apply] DB insert error:', dbError);
    return { success: false, error: 'send_failed' };
  }

  const applicationId = inserted.id as string;
  const submittedAt   = new Date(inserted.created_at as string).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Riyadh',
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[apply] RESEND_API_KEY not set — application saved to DB but not emailed:', applicationId);
    return { success: true, error: null };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: 'Merchant Club SA <applications@merchantclubsa.com>',
      to:   ['applications@merchantclubsa.com'],
      replyTo: email,
      subject: `New Application: ${brandName}`,
      html: buildEmailHtml({ brandName, category, story, instagram, email, website, applicationId, submittedAt }),
    });

    if (error) {
      // DB row already saved — log email failure but don't fail the user
      console.error('[apply] Resend error (DB row saved):', error);
    }
  } catch (err) {
    console.error('[apply] Resend threw (DB row saved):', err);
  }

  return { success: true, error: null };
}
