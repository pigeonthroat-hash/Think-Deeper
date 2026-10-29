/**
 * Generic same-origin fetch proxy for Think Deeper.
 * Deploy as: /api/fetch
 *
 * GET /api/fetch?url=https://en.wikipedia.org/api/rest_v1/page/mobile-sections/WebGPU
 *
 * Only allows https URLs to a small allowlist of hosts (search / reference).
 */

const ALLOW = [
  'en.wikipedia.org',
  'www.wikipedia.org',
  'wikipedia.org',
  'developer.mozilla.org',
  'api.duckduckgo.com',
  'lite.duckduckgo.com',
  'html.duckduckgo.com',
  'duckduckgo.com',
  'www.wikidata.org',
  'commons.wikimedia.org',
  'hn.algolia.com',
  'api.github.com',
  'www.google.com',
  'google.com',
  'searx.be',
  'search.sapti.me',
  'searx.tiekoetter.com',
];

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function hostAllowed(hostname) {
  const h = String(hostname || '').toLowerCase();
  return ALLOW.some((a) => h === a || h.endsWith('.' + a));
}

module.exports = async function handler(req, res) {
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

  let raw = String((req.query && req.query.url) || '').trim();
  // Fallback: some runtimes mangle nested query strings
  if (!raw && req.url) {
    try {
      const q = req.url.split('?').slice(1).join('?');
      const params = new URLSearchParams(q);
      raw = String(params.get('url') || '').trim();
    } catch (e) {}
  }
  if (!raw) {
    res.status(400).json({ ok: false, error: 'Missing url' });
    return;
  }

  let u;
  try {
    u = new URL(raw);
  } catch (e) {
    res.status(400).json({ ok: false, error: 'Invalid url' });
    return;
  }
  if (u.protocol !== 'https:') {
    res.status(400).json({ ok: false, error: 'Only https URLs allowed' });
    return;
  }
  if (!hostAllowed(u.hostname)) {
    res.status(403).json({ ok: false, error: 'Host not allowlisted: ' + u.hostname });
    return;
  }

  try {
    const upstream = await fetch(u.toString(), {
      headers: {
        'User-Agent': UA,
        Accept: 'application/json,text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    const ct = upstream.headers.get('content-type') || 'application/octet-stream';
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(upstream.status).send(buf);
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e.message || e) });
  }
};
