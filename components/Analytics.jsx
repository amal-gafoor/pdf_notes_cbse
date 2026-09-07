"use client";

// ---------------------------------------------------------------------------
// Marketing / analytics tags. Everything lives here so there is exactly one
// place to look when a pixel misfires.
//
// IDs come from lib/config.js (TRACKING). A tag with no ID simply does not
// render — that is how the GA4 / Ads / GTM placeholders stay harmless until
// the real IDs are filled in.
//
// If you set a GTM container ID, prefer adding GA4, Ads and Meta as *tags
// inside GTM* and leave the other IDs blank here, otherwise every event fires
// twice — once from this file and once from the container.
// ---------------------------------------------------------------------------

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { TRACKING } from "@/lib/config";

export default function Analytics() {
  const { eduport, gtmId, metaPixelId, ga4Id, googleAdsId } = TRACKING;
  const gtagId = ga4Id || googleAdsId;

  return (
    <>
      {/* Google Tag Manager — must sit as early in <body> as possible. */}
      {gtmId ? (
        <>
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      ) : null}

      {/* Eduport tracker — visitor -> lead + engagement into Salesforce. */}
      {eduport ? <Script src={eduport} strategy="afterInteractive" /> : null}

      {/* GA4 and Google Ads share one gtag.js loader. */}
      {gtagId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
${ga4Id ? `gtag('config', '${ga4Id}');` : ""}
${googleAdsId ? `gtag('config', '${googleAdsId}');` : ""}`}
          </Script>
        </>
      ) : null}

      {/* Meta Pixel — retargeting + the CAPI dataset. */}
      {metaPixelId ? (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              alt=""
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}

      <RouteChangePageViews />
    </>
  );
}

// Client-side navigation never reloads the document, so the snippets above
// only ever see the first URL. GA4 picks up the rest through enhanced
// measurement, but the Meta Pixel does not — it needs a manual PageView.
function RouteChangePageViews() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    // The init snippet already counted the landing page.
    if (first.current) {
      first.current = false;
      return;
    }
    if (typeof window.fbq === "function") window.fbq("track", "PageView");
  }, [pathname]);

  return null;
}
