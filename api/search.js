/**
 * Unified multi-source search — Think Deeper tool backend.
 * Deploy as: /api/search
 *
 * GET /api/search?q=WebGPU+vs+WebGL
 * Optional: &sources=wiki,mdn,ddg,hn,github  (default: all free sources)
 *
 * Returns structured JSON similar to product AI search tools:
 * { ok, query, cleaned_query, overview?, results:[{title,url,snippet,source}], errors[] }
 */

const UA =
  'Mozilla/5.0 (compatible; ThinkDeeperBot/1.0; +https://think-deeper-app.vercel.app)';

const STOP = new Set(
  'what whats what\'s is are was were the a an and or how does do did to from for of in on with about tell me please explain define definition difference between compared compare vs versus differ differs it its this that than then can could should would into over under as by at be been being if when where which who whom why not no yes'.split(
    ' '
  )
);

function extractTerms(s) {
  const raw = String(s || '');
  const camel = raw.match(/\b[A-Z][a-z]+[A-Z][A-Za-z0-9+#.-]*\b/g) || [];
  const words = raw.replace(/[?!.(),:;]+/g, ' ').split(/\s+/).filter(Boolean);
  const out = [];
  const seen = new Set();
  for (const w of camel.concat(words)) {
    const k = w.toLowerCase();
    if (seen.has(k) || STOP.has(k) || w.length < 2) continue;
    if (!/^[A-Za-z][A-Za-z0-9.+#-]{1,48}$/.test(w) && !/[A-Z].*[A-Z]/.test(w)) {
      if (w.length < 3) continue;
    }
    seen.add(k);
    out.push(w);
  }
  if (!out.length) {
    for (const w of words) {
      const k = w.toLowerCase();
      if (STOP.has(k) || k.length < 3 || seen.has(k)) continue;
      seen.add(k);
      out.push(w);
    }
  }
  return out.slice(0, 6);
}

function stripHtml(s) {
  return String(s || '')
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

async function fetchJSON(url, ms = 10000) {
  const ctrl = AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined;
  const res = await fetch(url, {
    signal: ctrl,
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });

  const qRaw = String((req.query && req.query.q) || '').trim();
  if (!qRaw) return res.status(400).json({ ok: false, error: 'Missing q' });

  const terms = extractTerms(qRaw);
  const q = terms.join(' ') || qRaw;
  const wanted = String((req.query && req.query.sources) || 'wiki,mdn,ddg,hn,github,wikidata')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const results = [];
  const errors = [];
  let overview = null;
  const seenUrl = new Set();

  const push = (item) => {
    if (!item || !item.title) return;
    const url = item.url || '';
    if (url && seenUrl.has(url)) return;
    if (url) seenUrl.add(url);
    results.push({
      title: stripHtml(item.title).slice(0, 200),
      snippet: stripHtml(item.snippet || '').slice(0, 480),
      url,
      source: item.source || 'web',
    });
  };

  // --- Wikipedia summaries (per term) + search ---
  if (wanted.includes('wiki') || wanted.includes('wikipedia')) {
    for (const t of terms.slice(0, 3)) {
      try {
        const slug = encodeURIComponent(t.replace(/ /g, '_'));
        const data = await fetchJSON(
          'https://en.wikipedia.org/api/rest_v1/page/summary/' + slug,
          8000
        );
        if (data && data.extract && data.type !== 'disambiguation') {
          const url =
            (data.content_urls &&
              data.content_urls.desktop &&
              data.content_urls.desktop.page) ||
            'https://en.wikipedia.org/wiki/' + slug;
          push({
            title: data.title || t,
            snippet: data.extract,
            url,
            source: 'wikipedia',
          });
          if (!overview) {
            overview = {
              title: data.title || t,
              text: String(data.extract).slice(0, 1600),
              source: 'Wikipedia',
              url,
              type: 'instant_answer',
            };
          }
        }
      } catch (e) {
        errors.push('wiki_summary(' + t + '): ' + (e.message || e));
      }
    }
    try {
      const data = await fetchJSON(
        'https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=6&srsearch=' +
          encodeURIComponent(q) +
          '&format=json&origin=*',
        9000
      );
      for (const hit of (data.query && data.query.search) || []) {
        push({
          title: hit.title,
          snippet: stripHtml(hit.snippet || ''),
          url:
            'https://en.wikipedia.org/wiki/' +
            encodeURIComponent(String(hit.title).replace(/ /g, '_')),
          source: 'wikipedia',
        });
      }
    } catch (e) {
      errors.push('wiki_search: ' + (e.message || e));
    }
  }

  // --- MDN ---
  if (wanted.includes('mdn')) {
    try {
      const data = await fetchJSON(
        'https://developer.mozilla.org/api/v1/search?q=' +
          encodeURIComponent(q) +
          '&locale=en-US',
        10000
      );
      for (const d of (data.documents || []).slice(0, 6)) {
        const url = d.mdn_url
          ? 'https://developer.mozilla.org' + d.mdn_url
          : d.url || '';
        push({
          title: d.title || 'MDN',
          snippet: d.summary || d.excerpt || '',
          url,
          source: 'mdn',
        });
        if (!overview && d.summary) {
          overview = {
            title: d.title || 'MDN',
            text: String(d.summary).slice(0, 1600),
            source: 'MDN',
            url,
            type: 'instant_answer',
          };
        }
      }
    } catch (e) {
      errors.push('mdn: ' + (e.message || e));
    }
  }

  // --- DuckDuckGo Instant Answer ---
  if (wanted.includes('ddg') || wanted.includes('duckduckgo')) {
    try {
      const data = await fetchJSON(
        'https://api.duckduckgo.com/?q=' +
          encodeURIComponent(q) +
          '&format=json&no_html=1&skip_disambig=1',
        9000
      );
      const abs = String(data.AbstractText || '').trim();
      if (abs) {
        overview = {
          title: data.Heading || q,
          text: abs.slice(0, 1600),
          source: data.AbstractSource || 'DuckDuckGo',
          url: data.AbstractURL || '',
          type: 'instant_answer',
        };
      }
      const related = data.RelatedTopics || [];
      for (const t of related.slice(0, 8)) {
        if (t && t.Text && t.FirstURL) {
          push({
            title: String(t.Text).split(' - ')[0].slice(0, 120),
            snippet: t.Text,
            url: t.FirstURL,
            source: 'duckduckgo',
          });
        }
        if (t && t.Topics) {
          for (const st of t.Topics.slice(0, 3)) {
            if (st && st.Text && st.FirstURL) {
              push({
                title: String(st.Text).split(' - ')[0].slice(0, 120),
                snippet: st.Text,
                url: st.FirstURL,
                source: 'duckduckgo',
              });
            }
          }
        }
      }
    } catch (e) {
      errors.push('ddg: ' + (e.message || e));
    }
  }

  // --- Hacker News ---
  if (wanted.includes('hn')) {
    try {
      const data = await fetchJSON(
        'https://hn.algolia.com/api/v1/search?hitsPerPage=5&query=' +
          encodeURIComponent(q),
        9000
      );
      for (const h of data.hits || []) {
        const url =
          h.url || 'https://news.ycombinator.com/item?id=' + h.objectID;
        push({
          title: h.title || h.story_title || 'HN',
          snippet: stripHtml(h.story_text || h.comment_text || '').slice(0, 240),
          url,
          source: 'hn',
        });
      }
    } catch (e) {
      errors.push('hn: ' + (e.message || e));
    }
  }

  // --- GitHub repos ---
  if (wanted.includes('github')) {
    try {
      const data = await fetchJSON(
        'https://api.github.com/search/repositories?per_page=5&q=' +
          encodeURIComponent(q),
        9000
      );
      for (const r of data.items || []) {
        push({
          title: r.full_name,
          snippet: (r.description || '') + ' ★' + (r.stargazers_count || 0),
          url: r.html_url,
          source: 'github',
        });
      }
    } catch (e) {
      errors.push('github: ' + (e.message || e));
    }
  }

  // --- Wikidata ---
  if (wanted.includes('wikidata')) {
    try {
      const data = await fetchJSON(
        'https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&origin=*&limit=4&search=' +
          encodeURIComponent(terms[0] || q),
        8000
      );
      for (const s of data.search || []) {
        push({
          title: s.label || q,
          snippet: s.description || '',
          url: s.concepturi || 'https://www.wikidata.org/wiki/' + s.id,
          source: 'wikidata',
        });
      }
    } catch (e) {
      errors.push('wikidata: ' + (e.message || e));
    }
  }

  // Optional Google CSE if env configured on Vercel
  if (
    (wanted.includes('google') || wanted.includes('cse')) &&
    process.env.GOOGLE_CSE_KEY &&
    process.env.GOOGLE_CSE_CX
  ) {
    try {
      const data = await fetchJSON(
        'https://www.googleapis.com/customsearch/v1?key=' +
          encodeURIComponent(process.env.GOOGLE_CSE_KEY) +
          '&cx=' +
          encodeURIComponent(process.env.GOOGLE_CSE_CX) +
          '&q=' +
          encodeURIComponent(qRaw),
        10000
      );
      for (const r of data.items || []) {
        push({
          title: r.title,
          snippet: r.snippet || '',
          url: r.link,
          source: 'google_cse',
        });
      }
    } catch (e) {
      errors.push('google_cse: ' + (e.message || e));
    }
  }

  // Optional Brave Search API
  if (wanted.includes('brave') && process.env.BRAVE_SEARCH_KEY) {
    try {
      const ctrl = AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined;
      const r = await fetch(
        'https://api.search.brave.com/res/v1/web/search?q=' +
          encodeURIComponent(qRaw) +
          '&count=8',
        {
          signal: ctrl,
          headers: {
            Accept: 'application/json',
            'X-Subscription-Token': process.env.BRAVE_SEARCH_KEY,
          },
        }
      );
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      for (const item of (data.web && data.web.results) || []) {
        push({
          title: item.title,
          snippet: item.description || '',
          url: item.url,
          source: 'brave',
        });
      }
    } catch (e) {
      errors.push('brave: ' + (e.message || e));
    }
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  res.status(200).json({
    ok: results.length > 0 || !!overview,
    query: qRaw,
    cleaned_query: q,
    overview: overview || undefined,
    results: results.slice(0, 16),
    errors: errors.slice(0, 12),
    source: 'think-deeper-search',
    hint: 'Use browse_url on the best 1–3 links for full page text. Prefer primary sources (MDN, official docs, Wikipedia).',
  });
};
