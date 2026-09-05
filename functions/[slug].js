/*
 * Cloudflare Pages Function - AMP dinamis multi-slug
 *
 * Cukup ubah:
 *   CANONICAL_ORIGIN
 *   CANONICAL_BASE
 *   ACTION_URL
 *
 * Contoh:
 * CANONICAL_ORIGIN = "https://sunsuranceagency.com"
 * CANONICAL_BASE   = "/contact"
 *
 * Maka:
 * https://project.pages.dev/kage303/
 * canonical -> https://sunsuranceagency.com/contact/kage303/
 */

const CANONICAL_ORIGIN = "https://sunsuranceagency.com";
const CANONICAL_BASE = "/contact";
const ACTION_URL = "https://t.ly/303kg";

const LOGO_URL = "https://ik.imagekit.io/dumh9mbpy/game/slot.png";
const BANNER_URL = "https://ik.imagekit.io/dumh9mbpy/game/1011.png";

export async function onRequest(context) {
  const rawSlug = String(context.params.slug || "");
  const slug = normalizeSlug(rawSlug);

  if (!slug) {
    return notFound();
  }

  const canonicalUrl = buildCanonicalUrl(slug);
  const currentOrigin = new URL(context.request.url).origin;
  const ampUrl = `${currentOrigin}/${encodeURIComponent(slug)}/`;

  const fallbackBrand = formatBrandName(slug);

  let title = fallbackBrand;
  let description = `Halaman AMP untuk ${fallbackBrand}.`;
  let brand = fallbackBrand;

  try {
    const response = await fetch(canonicalUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AMPMetadataFetcher/1.0)",
        "Accept": "text/html,application/xhtml+xml"
      },
      cf: {
        cacheTtl: 300,
        cacheEverything: true
      }
    });

    if (response.ok) {
      const sourceHtml = await response.text();

      const sourceTitle = extractTitle(sourceHtml);
      const sourceDescription = extractMetaDescription(sourceHtml);
      const sourceSiteName = extractOgSiteName(sourceHtml);

      if (sourceTitle) title = sourceTitle;
      if (sourceDescription) description = sourceDescription;
      if (sourceSiteName) brand = sourceSiteName;
    }
  } catch (_) {
    // Jika canonical tidak bisa di-fetch, fallback tetap dipakai.
  }

  const html = renderAmp({
    slug,
    brand,
    title,
    description,
    canonicalUrl,
    ampUrl
  });

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function notFound() {
  return new Response("Halaman tidak ditemukan.", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=UTF-8",
      "X-Robots-Tag": "noindex"
    }
  });
}

function buildCanonicalUrl(slug) {
  const origin = CANONICAL_ORIGIN.replace(/\/+$/, "");
  const base = CANONICAL_BASE
    ? "/" + CANONICAL_BASE.replace(/^\/+|\/+$/g, "")
    : "";

  return `${origin}${base}/${encodeURIComponent(slug)}/`;
}

function normalizeSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatBrandName(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map(part => part.toUpperCase())
    .join(" ");
}

function extractTitle(html) {
  const og =
    html.match(/<meta\b[^>]*property\s*=\s*["']og:title["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/i) ||
    html.match(/<meta\b[^>]*content\s*=\s*["']([^"']*)["'][^>]*property\s*=\s*["']og:title["'][^>]*>/i);

  if (og?.[1]) return decodeHtml(og[1]).trim();

  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return title?.[1] ? decodeHtml(stripTags(title[1])).trim() : "";
}

function extractMetaDescription(html) {
  const match =
    html.match(/<meta\b[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/i) ||
    html.match(/<meta\b[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']description["'][^>]*>/i);

  return match?.[1] ? decodeHtml(match[1]).trim() : "";
}

function extractOgSiteName(html) {
  const match =
    html.match(/<meta\b[^>]*property\s*=\s*["']og:site_name["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/i) ||
    html.match(/<meta\b[^>]*content\s*=\s*["']([^"']*)["'][^>]*property\s*=\s*["']og:site_name["'][^>]*>/i);

  return match?.[1] ? decodeHtml(match[1]).trim() : "";
}

function stripTags(value) {
  return String(value).replace(/<[^>]*>/g, " ");
}

function decodeHtml(value) {
  return String(value)
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderAmp({ brand, title, description, canonicalUrl, ampUrl }) {
  const safeBrand = escapeHtml(brand);
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeCanonical = escapeHtml(canonicalUrl);
  const safeAmpUrl = escapeHtml(ampUrl);
  const safeActionUrl = escapeHtml(ACTION_URL);
  const safeLogoUrl = escapeHtml(LOGO_URL);
  const safeBannerUrl = escapeHtml(BANNER_URL);

  return `<!DOCTYPE html>
<html amp lang="id-ID">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">

  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta name="robots" content="index,follow">

  <link rel="canonical" href="${safeCanonical}">
  <link rel="alternate" hreflang="id" href="${safeCanonical}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${safeBrand}">
  <meta property="og:url" content="${safeAmpUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeBannerUrl}">
  <meta property="og:image:alt" content="${safeBrand}">

  <link rel="shortcut icon" href="${safeLogoUrl}" type="image/x-icon">

  <script async src="https://cdn.ampproject.org/v0.js"></script>

  <style amp-boilerplate>
    body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;
    -moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;
    -ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;
    animation:-amp-start 8s steps(1,end) 0s 1 normal both}
    @-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
    @-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
    @-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
    @-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
    @keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}
  </style>

  <noscript>
    <style amp-boilerplate>
      body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}
    </style>
  </noscript>

  <style amp-custom>
    *{box-sizing:border-box}

    html,body{
      margin:0;
      padding:0;
      background:#050805;
      color:#fff;
      font-family:Arial,Helvetica,sans-serif;
    }

    body{
      min-height:100vh;
      background:
        radial-gradient(circle at 50% 0,rgba(53,255,75,.18),transparent 36%),
        linear-gradient(180deg,#071008 0%,#020402 55%,#000 100%);
    }

    .page{
      width:100%;
      max-width:430px;
      margin:0 auto;
      padding:18px 14px 30px;
    }

    .card{
      border:1px solid rgba(62,255,91,.35);
      background:rgba(8,16,9,.94);
      border-radius:22px;
      padding:15px;
      box-shadow:0 0 28px rgba(30,255,70,.12);
    }

    .logo-wrap{
      display:flex;
      justify-content:center;
      align-items:center;
      padding:7px 0 12px;
    }

    .welcome{
      margin:0 0 12px;
      text-align:center;
      font-size:12px;
      font-weight:700;
      letter-spacing:1.1px;
      line-height:1.5;
      color:#d8ffe0;
    }

    .hero{
      overflow:hidden;
      border-radius:18px;
      border:1px solid rgba(77,255,105,.38);
      box-shadow:0 0 22px rgba(53,255,77,.18);
      margin-bottom:14px;
    }

    .main-button{
      display:block;
      width:100%;
      padding:14px 12px;
      margin:0 0 14px;
      border-radius:12px;
      text-decoration:none;
      text-align:center;
      font-size:17px;
      font-weight:900;
      letter-spacing:.3px;
      color:#041006;
      background:linear-gradient(90deg,#b7ff37,#27ff73,#0be69a);
      box-shadow:0 5px 18px rgba(39,255,115,.24);
      animation:pulse 1.1s ease-in-out infinite alternate;
    }

    @keyframes pulse{
      from{transform:scale(1);opacity:.9}
      to{transform:scale(1.015);opacity:1}
    }

    .section-title{
      margin:3px 0 10px;
      padding:10px 12px;
      text-align:center;
      border-radius:10px;
      font-size:14px;
      font-weight:800;
      background:linear-gradient(90deg,#173d1f,#245f30);
      border:1px solid rgba(79,255,112,.35);
      color:#effff2;
    }

    .links{
      width:100%;
      border-collapse:separate;
      border-spacing:0 8px;
      margin:0;
    }

    .links th{
      padding:10px 8px;
      font-size:13px;
      color:#031007;
      background:linear-gradient(90deg,#baff3c,#25ff75);
    }

    .links th:first-child{border-radius:9px 0 0 9px}
    .links th:last-child{border-radius:0 9px 9px 0}

    .links td{
      padding:9px 7px;
      font-size:13px;
      text-align:center;
      background:#101712;
      border-top:1px solid rgba(255,255,255,.06);
      border-bottom:1px solid rgba(255,255,255,.06);
    }

    .links td:first-child{
      border-radius:10px 0 0 10px;
      font-weight:700;
      color:#e8ffec;
    }

    .links td:last-child{border-radius:0 10px 10px 0}

    .link-button{
      display:inline-block;
      padding:8px 10px;
      border-radius:8px;
      color:#031007;
      background:linear-gradient(90deg,#c6ff44,#27ff78);
      text-decoration:none;
      font-size:11px;
      font-weight:900;
      white-space:nowrap;
    }

    .notice{
      margin-top:12px;
      padding:10px;
      border-radius:10px;
      text-align:center;
      background:#09130b;
      border:1px dashed rgba(85,255,115,.32);
      color:#bdeec6;
      font-size:11px;
      line-height:1.5;
    }

    .copyright{
      margin:17px 0 0;
      text-align:center;
      color:#93a697;
      font-size:11px;
      line-height:1.6;
    }

    .copyright a{
      color:#55ff78;
      text-decoration:none;
      font-weight:700;
    }
  </style>
</head>

<body>
  <main class="page">
    <section class="card">

      <div class="logo-wrap">
        <amp-img
          src="${safeLogoUrl}"
          alt="${safeBrand}"
          width="230"
          height="60"
          layout="intrinsic">
        </amp-img>
      </div>

      <p class="welcome">SELAMAT DATANG DI ${safeBrand}</p>

      <a
        class="main-button"
        href="${safeActionUrl}"
        role="button"
        target="_blank"
        rel="noreferrer noopener">
        LOGIN | DAFTAR | RTP GACOR
      </a>

      <div class="hero">
        <amp-img
          src="${safeBannerUrl}"
          alt="${safeBrand}"
          width="500"
          height="500"
          layout="responsive">
        </amp-img>
      </div>

      <div class="section-title">LINK ALTERNATIF ${safeBrand}</div>

      <table class="links">
        <thead>
          <tr>
            <th>SITUS ${safeBrand}</th>
            <th>LINK ALTERNATIF</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>DAFTAR VIP</td>
            <td>
              <a
                class="link-button"
                href="${safeActionUrl}"
                target="_blank"
                rel="noreferrer noopener">
                KLIK DISINI
              </a>
            </td>
          </tr>

          <tr>
            <td>DAFTAR ${safeBrand}</td>
            <td>
              <a
                class="link-button"
                href="${safeActionUrl}"
                target="_blank"
                rel="noreferrer noopener">
                KLIK DISINI
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="notice">
        Gunakan link yang tersedia di halaman ini untuk akses ${safeBrand}.
      </div>

      <p class="copyright">
        2026 • SEO 303 ©
        <a href="${safeCanonical}">${safeBrand}</a>
        • All Rights Reserved
      </p>

    </section>
  </main>
</body>
</html>`;
}
