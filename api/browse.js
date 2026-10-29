/**
 * Page browse / extract — Think Deeper tool backend.
 * Deploy as: /api/browse
 *
 * GET /api/browse?url=https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
 * Optional: &max_chars=12000
 *
 * Returns: { ok, url, title, text, status }
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// Block obvious non-public / dangerous schemes and a few sensitive hosts
function assertSafeUrl(raw) {
  let u;
  try {
    u = new URL(String(raw || '').trim());
  } catch (e) {
    throw new Error('Invalid URL');
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new Error('Only http(s) URLs allowed');
  }
  const host = u.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    /^(10\.|127\.|192\.168\.|169\.254\.|0\.)/.test(host)
  ) {
    throw new Error('Private/localhost URLs blocked');
  }
  return u;
}

function htmlToText(html) {
  let s = String(html || '');
  // drop noise
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');
  // prefer main/article if present
  const main =
    s.match(/<main[\s\S]*?<\/main>/i) ||
    s.match(/<article[\s\S]*?<\/article>/i) ||
    s.match(/id=["']content["'][\s\S]*?>[\s\S]*$/i);
  if (main) s = main[0];
  // strip tags
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>/gi, '\n\n');
  s = s.replace(/<\/h[1-6]>/gi, '\n\n');
  s = s.replace(/<\/li>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
  s = s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  s = s.replace(/[ \t]{2,}/g, ' ').trim();
  return s;
}

function extractTitle(html) {
  const m =
    String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i) ||
    String(html || '').match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return '';
  return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });

  const raw = String((req.query && req.query.url) || '').trim();
  if (!raw) return res.status(400).json({ ok: false, error: 'Missing url' });

  let u;
  try {
    u = assertSafeUrl(raw);
  } catch (e) {
    return res.status(400).json({ ok: false, error: e.message || String(e) });
  }

  const maxChars = Math.min(
    50000,
    Math.max(1000, parseInt((req.query && req.query.max_chars) || '12000', 10) || 12000)
  );

  try {
    const upstream = await fetch(u.toString(), {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    const ct = (upstream.headers.get('content-type') || '').toLowerCase();
    const buf = Buffer.from(await upstream.arrayBuffer());

    // JSON APIs — return pretty text
    if (ct.includes('application/json') || ct.includes('+json')) {
      let text = buf.toString('utf8');
      try {
        text = JSON.stringify(JSON.parse(text), null, 2);
      } catch (e) {}
      return res.status(200).json({
        ok: upstream.ok,
        status: upstream.status,
        url: u.toString(),
        title: '',
        content_type: ct,
        text: text.slice(0, maxChars),
        truncated: text.length > maxChars,
      });
    }

    const html = buf.toString('utf8');
    const title = extractTitle(html);
    const text = htmlToText(html);

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    res.status(200).json({
      ok: upstream.ok && text.length > 40,
      status: upstream.status,
      url: u.toString(),
      title,
      content_type: ct,
      text: text.slice(0, maxChars),
      truncated: text.length > maxChars,
      chars: Math.min(text.length, maxChars),
    });
  } catch (e) {
    res.status(200).json({
      ok: false,
      url: u.toString(),
      error: String(e.message || e),
      text: '',
    });
  }
};
