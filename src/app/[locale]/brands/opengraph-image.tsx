import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'The Roster — Merchant Club SA';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
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
        <div style={{ width: 48, height: 1, background: '#D4AF37' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#D4AF37' }}>
            Merchant Club SA
          </p>
          <h1 style={{ margin: 0, fontSize: 64, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.05 }}>
            The Roster
          </h1>
          <p style={{ margin: 0, fontSize: 22, color: '#BFBFBF', fontWeight: 400 }}>
            Independent Saudi brands, curated for quality.
          </p>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: '#555555', letterSpacing: '0.1em' }}>
          merchantclubsa.com/brands
        </p>
      </div>
    ),
    { ...size }
  );
}
