import Script from 'next/script';

// Analytics scripts — activate by setting env vars:
//   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX      (GA4 Measurement ID)
//   ContentSquare script is hardcoded (no env var needed — single site ID)
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      )}
      <Script
        src="https://t.contentsquare.net/uxa/c62e72063f4f4.js"
        strategy="afterInteractive"
      />
    </>
  );
}
