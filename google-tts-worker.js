// Optional Google Cloud Text-to-Speech proxy for Cloudflare Workers.
// Configure worker SECRETS: GOOGLE_TTS_API_KEY, TTS_ACCESS_TOKEN, ALLOWED_ORIGIN.
// WARNING: Google Cloud requires billing; usage beyond free quotas may cost money.
// Set ALLOWED_ORIGIN to your GitHub Pages origin, e.g. https://username.github.io
// Create a strong TTS_ACCESS_TOKEN and enter it in the reader settings (never in source).
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '';
    const headers = {'Access-Control-Allow-Origin': allowed, 'Vary': 'Origin',
      'Access-Control-Allow-Headers': 'Content-Type, X-Reader-Token',
      'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store'};
    if (origin !== allowed) return new Response('Forbidden', {status:403});
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
    if (request.method !== 'POST') return new Response('Method Not Allowed',{status:405,headers});
    if (!env.GOOGLE_TTS_API_KEY || !env.TTS_ACCESS_TOKEN || request.headers.get('X-Reader-Token') !== env.TTS_ACCESS_TOKEN)
      return new Response('Unauthorized',{status:401,headers});
    let payload;
    try {payload = await request.json()} catch {return new Response('Bad JSON',{status:400,headers})}
    const text = String(payload.text||'').slice(0,450), language = payload.language === 'zh-CN' ? 'zh-CN' : 'en-US';
    if (!text.trim()) return new Response('Empty text',{status:400,headers});
    const upstream = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize',{
      method:'POST', headers:{'Content-Type':'application/json','X-Goog-Api-Key':env.GOOGLE_TTS_API_KEY},
      body:JSON.stringify({input:{text},voice:{languageCode:language},audioConfig:{audioEncoding:'MP3',speakingRate:Math.max(.5,Math.min(2,Number(payload.rate)||1))}})
    });
    if (!upstream.ok) return new Response('Google Cloud TTS error',{status:502,headers});
    const data = await upstream.json();
    if (!data.audioContent) return new Response('No audio',{status:502,headers});
    const binary = atob(data.audioContent), bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return new Response(bytes,{status:200,headers:{...headers,'Content-Type':'audio/mpeg'}});
  }
};
