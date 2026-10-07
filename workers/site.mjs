// Daikin articles moved from the original site's /<slug>.html pages to /blog/<slug>.
const legacyArticles = new Set([
  '7-reasons-to-choose-daikin-air-conditioner-for-your-malaysia-home',
  'reasons-to-choose-daikin-vrv-system-for-your-air-conditioning',
  'why-should-you-choose-daikin-air-conditioner',
  'reasons-to-choose-daikin-air-conditioning-for-your-malaysia-home',
]);

export default {
  async fetch(request, env) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    const legacy = url.pathname.match(/^\/([a-z0-9-]+)\.html$/);
    if (legacy && legacyArticles.has(legacy[1])) {
      return Response.redirect(`${url.origin}/blog/${legacy[1]}`, 301);
    }
    return env.ASSETS.fetch(request);
  },
};
