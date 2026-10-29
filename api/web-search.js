/**
 * Vercel serverless proxy for Google-style web search.
 * Deploy as: /api/web-search
 *
 * Same-origin from https://think-deeper-app.vercel.app → no CORS issues.
 *
 * GET /api/web-search?q=WebGPU
 * Optional: &gl=us&hl=en
 *
 * Returns JSON: { ok, query, overview?, results[], errors[] }
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function stripHtml(s) {
  return String(s || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanQuery(s) {
  let t = String(s || '').trim();
  t = t.replace(/[?!.]+$/g, '').trim();
  t = t.replace(
    /^(what\s+is|what\s+are|who\s+is|who\s+are|what's|whats|how\s+does|how\s+do|how\s+to|where\s+is|when\s+was|why\s+is|why\s+does|tell\s+me\s+about|explain|define|definition\s+of)\s+/i,
    ''
  );
  t = t.replace(/\s+and\s+how\s+(does|do|is|are|can|to)\b.*$/i, '');
  return t.replace(/\s+/g, ' ').trim() || s;
}

function extractOverview(html) {
  const patterns = [
    /AI Overview[\s\S]{0,160}?<(?:div|span)[^>]*>([\s\S]{40,2500}?)<\/(?:div|span)>/i,
    /data-attrid="wa:\/description"[\s\S]{0,240}?<span[^>]*>([\s\S]{40,1800}?)<\/span>/i,
    /class="kno-rdesc"[\s\S]{0,160}?<span[^>]*>([\s\S]{40,1800}?)<\/span>/i,
    /class="hgKElc"[^>]*>([\s\S]{40,1800}?)<\/div>/i,
    /class="IZ6rdc"[^>]*>([\s\S]{40,1800}?)<\/div>/i,
    /data-sgrd="true"[\s\S]{0,400}?<(?:div|span)[^>]*>([\s\S]{40,2000}?)<\/(?:div|span)>/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) {
      const text = stripHtml(m[1]);
      if (text.length > 50) {
        return {
          title: 'Google AI Overview',
          text: text.slice(0, 1800),
          source: 'Google',
          type: 'ai_overview',
        };
      }
    }
  }
  return null;
}

function extractOrganic(html) {
  const out = [];
  const seen = new Set();

  const push = (title, url, snippet) => {
    if (!title || !url || !/^https?:/i.test(url)) return;
    if (/google\./i.test(url) || /webcache/i.test(url) || /accounts\.google/i.test(url)) return;
    if (seen.has(url)) return;
    seen.add(url);
    out.push({
      title: stripHtml(title).slice(0, 200),
      snippet: stripHtml(snippet || '').slice(0, 400),
      url,
      source: 'google',
    });
  };

  // /url?q= pattern
  const re1 =
    /<a[^>]+href="\/url\?q=([^&"]+)[^"]*"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  let m;
  while ((m = re1.exec(html)) && out.length < 10) {
    try {
      push(m[2], decodeURIComponent(m[1]), '');
    } catch (_) {}
  }

  // direct https in result anchors
  if (out.length < 3) {
    const re2 =
      /<a[^>]+href="(https?:\/\/(?!www\.google\.)[^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/gi;
    while ((m = re2.exec(html)) && out.length < 10) {
      push(m[2], m[1], '');
    }
  }

  // muRaaaa / data-ved blocks sometimes wrap cite + snippet
  if (out.length < 3) {
    const re3 =
      /<a[^>]+href="\/url\?q=([^&"]+)[^"]*"[^>]*aria-label="([^"]+)"/gi;
    while ((m = re3.exec(html)) && out.length < 10) {
      try {
        push(m[2], decodeURIComponent(m[1]), '');
      } catch (_) {}
    }
  }

  return out;
}

async function fetchGoogle(q, { hl = 'en', gl = 'us' } = {}) {
  const url =
    'https://www.google.com/search?q=' +
    encodeURIComponent(q) +
    '&hl=' +
    encodeURIComponent(hl) +
    '&gl=' +
    encodeURIComponent(gl) +
    '&num=10&pws=0&brd=1';

  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
  });

  const html = await res.text();
  return { status: res.status, html, finalUrl: res.url || url };
}

module.exports = async function handler(req, res) {
  // CORS for local testing; same-origin on vercel.app does not need it
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'GET only' });
    return;
  }

  const qRaw = String((req.query && req.query.q) || '').trim();
  if (!qRaw) {
    res.status(400).json({ ok: false, error: 'Missing q' });
    return;
  }

  const hl = String((req.query && req.query.hl) || 'en');
  const gl = String((req.query && req.query.gl) || 'us');
  const cleaned = cleanQuery(qRaw);
  const errors = [];

  try {
    const { status, html, finalUrl } = await fetchGoogle(qRaw, { hl, gl });

    // Bot / consent / captcha heuristics
    const lower = html.slice(0, 8000).toLowerCase();
    if (
      lower.includes('unusual traffic') ||
      lower.includes('/sorry/') ||
      lower.includes('captcha') ||
      lower.includes('consent.google')
    ) {
      errors.push('Google returned consent/CAPTCHA/unusual-traffic page');
    }
    if (status >= 400) errors.push('HTTP ' + status);

    const overview = extractOverview(html);
    if (overview) overview.url = finalUrl;

    const results = extractOrganic(html);

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    res.status(200).json({
      ok: !!(overview || results.length),
      query: qRaw,
      cleaned_query: cleaned,
      google_available: !!(overview || results.length),
      overview: overview || undefined,
      results,
      errors,
      note:
        !overview && !results.length
          ? 'Google HTML fetched but nothing parsed — likely bot interstitial. Try again later or use web mode fallbacks.'
          : undefined,
      source: 'vercel-proxy',
    });
  } catch (e) {
    res.status(200).json({
      ok: false,
      query: qRaw,
      cleaned_query: cleaned,
      google_available: false,
      results: [],
      errors: [String(e.message || e)],
      source: 'vercel-proxy',
    });
  }
};
