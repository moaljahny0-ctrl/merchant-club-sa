import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Merchant Club SA — Curated Saudi Brands';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0D0D0D',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${baseUrl}/logo.png`} width={80} height={80} alt="" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#D4AF37' }}>
            Merchant Club SA
          </p>
          <h1 style={{ margin: 0, fontSize: 68, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.04, maxWidth: 760 }}>
            Not every brand belongs here.
          </h1>
          <p style={{ margin: 0, fontSize: 22, color: '#BFBFBF', fontWeight: 400 }}>
            We select the ones that do.
          </p>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: '#555555', letterSpacing: '0.1em' }}>
          merchantclubsa.com
        </p>
      </div>
    ),
    { ...size }
  );
}
