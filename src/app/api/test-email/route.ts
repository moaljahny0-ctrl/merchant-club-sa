import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// GET /api/test-email
// Only works in development. Confirms Resend key + domain are configured correctly.
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development.' }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not set in .env.local' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: 'Merchant Club SA <applications@merchantclubsa.com>',
    to: ['info@merchantclubsa.com'],
    subject: '[TEST] Resend delivery confirmed',
    html: `
      <div style="background:#0A0A0A;padding:40px;font-family:Georgia,serif;color:#F5F0E8;">
        <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 16px;">
          Merchant Club SA
        </p>
        <h2 style="margin:0 0 12px;font-weight:400;font-size:20px;">Test email — delivery confirmed.</h2>
        <p style="color:#777777;font-size:13px;margin:0;">
          Resend is configured correctly. The Apply form will now deliver real applications to this inbox.
        </p>
      </div>
    `,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id });
}
