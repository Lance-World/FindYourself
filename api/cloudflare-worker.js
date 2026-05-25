/**
 * Cloudflare Worker: Awareness Coordinate AI Backend
 *
 * Required secret:
 * - GEMINI_API_KEY
 *
 * Optional variables:
 * - GEMINI_MODEL = gemini-2.0-flash
 * - ALLOWED_ORIGIN = https://yourname.github.io
 */

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

export default {
  async fetch(request, env) {
    const cors = buildCorsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);
    if (url.pathname !== '/api/analyze') {
      return json({ error: 'Not found. Use POST /api/analyze' }, 404, cors);
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);
    if (!env.GEMINI_API_KEY) return json({ error: 'Missing GEMINI_API_KEY secret.' }, 500, cors);

    let payload;
    try { payload = await request.json(); }
    catch { return json({ error: 'Invalid JSON body.' }, 400, cors); }

    const input = String(payload.input || '').trim();
    const localResult = payload.localResult || {};
    if (!input) return json({ error: 'Missing input.' }, 400, cors);
    if (input.length > 2800) return json({ error: 'Input too long. Limit is 2800 characters.' }, 413, cors);

    const prompt = buildPrompt(input, localResult);
    const model = env.GEMINI_MODEL || 'gemini-2.0-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const aiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.55,
          topP: 0.9,
          maxOutputTokens: 900,
          responseMimeType: 'application/json'
        }
      })
    });

    const aiData = await aiRes.json().catch(() => ({}));
    if (!aiRes.ok) {
      return json({ error: aiData.error?.message || `Gemini error ${aiRes.status}` }, 502, cors);
    }

    const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let result;
    try { result = JSON.parse(text); }
    catch { result = safeParseLooseJson(text); }

    return json({ result: sanitizeResult(result) }, 200, cors);
  }
};

function buildCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '*';
  const allowed = env.ALLOWED_ORIGIN || '*';
  const allowOrigin = allowed === '*' || allowed === origin ? origin : allowed;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}
function json(obj, status = 200, cors = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { ...JSON_HEADERS, ...cors } });
}
function buildPrompt(input, localResult) {
  const r = localResult || {};
  return `你是一位溫柔但清晰的自我覺察文字整合助手。請根據使用者輸入，以及本機規則已判斷出的 X/Y/Z 座標，產生簡短、具體、可行的回覆。

限制：
- 不要宣稱自己是心理師、醫師或診斷。
- 不要推翻本機座標，除非用「可能」語氣提出微調。
- 不要長篇說教。
- 文字要繁體中文。
- 只輸出 JSON，不要 markdown。

本機座標：
X=${r.x} ${r.labels?.x || ''}
Y=${r.y} ${r.labels?.y || ''}
Z=${r.z} ${r.labels?.z || ''}
本機卡片：${r.card?.name || ''}
本機建議：${r.card?.next || ''}

使用者輸入：
${input}

請輸出格式：
{
  "summary":"80字以內，指出現在主要卡住的點",
  "coordinate_reason":{
    "x":"為什麼 X 軸這樣判斷，40字內",
    "y":"為什麼 Y 軸這樣判斷，40字內",
    "z":"為什麼 Z 軸這樣判斷，40字內"
  },
  "suggestions":["具體建議1", "具體建議2", "具體建議3"],
  "higher_self":"一句高我式提醒，溫柔但不逃避",
  "caution":"必要時提醒使用者若有嚴重痛苦可尋求專業協助；沒有就空字串"
}`;
}
function safeParseLooseJson(text) {
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return {};
  try { return JSON.parse(m[0]); } catch { return {}; }
}
function sanitizeResult(result) {
  const r = result || {};
  return {
    summary: String(r.summary || '').slice(0, 180),
    coordinate_reason: {
      x: String(r.coordinate_reason?.x || '').slice(0, 120),
      y: String(r.coordinate_reason?.y || '').slice(0, 120),
      z: String(r.coordinate_reason?.z || '').slice(0, 120)
    },
    suggestions: Array.isArray(r.suggestions) ? r.suggestions.slice(0, 4).map(s => String(s).slice(0, 120)) : [],
    higher_self: String(r.higher_self || '').slice(0, 160),
    caution: String(r.caution || '').slice(0, 160)
  };
}
