import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

// TEMPORARY, ONE-OFF MAINTENANCE ROUTE — sends the Sirajah apology email using the
// real production RESEND_API_KEY, then must be deleted immediately after one successful use.
const ONE_TIME_TOKEN = 'aa3cf06619aa5f9bee6cdd95b0b68a8db22935efbbf62744'

const HTML = String.raw`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f2f2f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f0;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e4e0;max-width:600px;width:100%;">

        <tr>
          <td style="padding:28px 40px 22px;border-bottom:1px solid #efefed;text-align:center;">
            <p style="margin:0;font-size:9px;letter-spacing:0.38em;text-transform:uppercase;color:#b8975a;">
              Merchant Club SA
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px;" dir="rtl" lang="ar">
            <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#aaaaaa;">إشعار هام</p>
            <h1 style="margin:0 0 18px;font-size:20px;font-weight:400;color:#1a1a1a;">بخصوص طلبكم مع Merchant Club SA</h1>
            <p style="margin:0 0 16px;font-size:14px;color:#444444;line-height:1.9;">
              السلام عليكم ورحمة الله وبركاته،
            </p>
            <p style="margin:0 0 16px;font-size:14px;color:#444444;line-height:1.9;">
              نود أن نعتذر بصدق عن اللبس الذي حدث بخصوص طلبكم للانضمام إلى منصة Merchant Club SA. تمت معالجة طلبكم عن طريق الخطأ أثناء اختبارات داخلية للمنصة.
            </p>
            <p style="margin:0 0 16px;font-size:14px;color:#444444;line-height:1.9;">
              نود إعلامكم أن المنصة لا تزال قيد التطوير ولم يتم إطلاقها للجمهور بعد. طلبكم تم تسجيله وسيتم التواصل معكم شخصياً من قبل فريق إدارة المنصة عند اكتمال الاستعداد لإطلاق المنصة رسمياً.
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#444444;line-height:1.9;">
              نشكركم على صبركم واهتمامكم بالانضمام إلينا.
            </p>
            <p style="margin:0;font-size:14px;color:#444444;line-height:1.9;">
              مع خالص التقدير،<br />
              فريق Merchant Club SA
            </p>
          </td>
        </tr>

        <tr><td style="border-top:1px solid #efefed;"></td></tr>

        <tr>
          <td style="padding:36px 40px;" dir="ltr" lang="en">
            <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#aaaaaa;">Important Notice</p>
            <h1 style="margin:0 0 18px;font-size:20px;font-weight:400;color:#1a1a1a;">Regarding Your Application with Merchant Club SA</h1>
            <p style="margin:0 0 16px;font-size:14px;color:#444444;line-height:1.75;">
              Dear Sir/Madam,
            </p>
            <p style="margin:0 0 16px;font-size:14px;color:#444444;line-height:1.75;">
              We sincerely apologize for the confusion regarding your application to join the Merchant Club SA platform. Your application was processed by mistake during internal testing of the platform.
            </p>
            <p style="margin:0 0 16px;font-size:14px;color:#444444;line-height:1.75;">
              Please note that the platform is still under development and has not yet been publicly launched. Your application has been noted, and you will be personally contacted by the Platform Management Team once the platform is ready for official launch.
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#444444;line-height:1.75;">
              Thank you for your patience and your interest in joining us.
            </p>
            <p style="margin:0;font-size:14px;color:#444444;line-height:1.75;">
              Warm regards,<br />
              The Merchant Club SA Team
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:18px 40px;border-top:1px solid #efefed;text-align:center;">
            <p style="margin:0;font-size:11px;color:#aaaaaa;">
              <a href="https://www.merchantclubsa.com" style="color:#b8975a;text-decoration:none;">merchantclubsa.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${ONE_TIME_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set at runtime' }, { status: 500 })
  }

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: 'Merchant Club SA <applications@merchantclubsa.com>',
    to: ['info.seraja@gmail.com'],
    bcc: ['moaljahny0@gmail.com'],
    subject: 'Important Notice — Your Application with Merchant Club SA',
    html: HTML,
  })

  if (error) {
    return NextResponse.json({ error }, { status: 502 })
  }
  return NextResponse.json({ ok: true, id: data?.id })
}
