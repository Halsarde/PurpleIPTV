export default async (req) => {
  const url = new URL(req.url).searchParams.get('url');
  if (!url) return new Response('Missing url', { status: 400 });
  try {
    const r = await fetch(url, { headers: { "User-Agent": "PurpleIPTV/1.0" } });
    const body = await r.arrayBuffer();
    return new Response(body, {
      status: r.status,
      headers: {
        'content-type': r.headers.get('content-type') || 'application/octet-stream',
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=300'
      }
    });
  } catch (e) {
    return new Response('Proxy error', { status: 502 });
  }
}