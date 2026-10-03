const PREFIX = '/example/setia-aircond';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // A Cloudflare prefix wildcard also matches neighbouring names.
    if (url.pathname !== PREFIX && !url.pathname.startsWith(`${PREFIX}/`)) return fetch(request);
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    if (url.pathname === PREFIX) {
      url.pathname += '/';
      return Response.redirect(url.href, 308);
    }
    return env.ASSETS.fetch(request);
  },
};
