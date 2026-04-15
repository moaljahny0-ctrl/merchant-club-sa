import Script from 'next/script';

// Analytics scripts — activate by setting env vars:
//   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX      (GA4 Measurement ID)
//   NEXT_PUBLIC_HOTJAR_ID=1234567        (Hotjar numeric site ID only)
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // Hotjar requires a numeric site ID — guard against non-numeric values being set
  const rawHotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID;
  const hotjarId = rawHotjarId && /^\d+$/.test(rawHotjarId) ? rawHotjarId : null;

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
      {hotjarId && (
        <Script id="hotjar-init" strategy="afterInteractive">
          {`(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${hotjarId},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
        </Script>
      )}
    </>
  );
}
