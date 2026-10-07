// Every URL in the original site's sitemap and navigation, moved permanently to its closest new page
// so existing rankings and backlinks carry over.
const legacyRedirects = new Map([
  ['/index.html', '/'],
  ['/about-us.html', '/about-us/'],
  ['/brands.html', '/about-us/'],
  ['/contact-us.html', '/about-us/#company-contact'],
  ['/enquiry.html', '/get-a-quote/'],
  ['/certifications.html', '/commercial/'],
  ['/clientele.html', '/commercial/'],
  ['/projects.html', '/commercial/projects/'],
  ['/air-conditioner-services.html', '/residential/'],
  ['/air-conditioners.html', '/residential/'],
  ['/aircon-repairs.html', '/residential/'],
  ['/aircond-services.html', '/residential/'],
  ['/york-air-cond-services.html', '/residential/'],
  ['/electrical-services.html', '/residential/'],
  // Daikin articles now live under /blog/.
  ['/7-reasons-to-choose-daikin-air-conditioner-for-your-malaysia-home.html', '/blog/7-reasons-to-choose-daikin-air-conditioner-for-your-malaysia-home/'],
  ['/reasons-to-choose-daikin-vrv-system-for-your-air-conditioning.html', '/blog/reasons-to-choose-daikin-vrv-system-for-your-air-conditioning/'],
  ['/why-should-you-choose-daikin-air-conditioner.html', '/blog/why-should-you-choose-daikin-air-conditioner/'],
  ['/reasons-to-choose-daikin-air-conditioning-for-your-malaysia-home.html', '/blog/reasons-to-choose-daikin-air-conditioning-for-your-malaysia-home/'],
]);

// Preview hosts must not compete with the production domain in search results.
const isPreviewHost = hostname => hostname.endsWith('.workers.dev');

export default {
  async fetch(request, env) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    const legacy = legacyRedirects.get(url.pathname.toLowerCase());
    if (legacy) return Response.redirect(new URL(legacy, url.origin).href, 301);

    let response = await env.ASSETS.fetch(request);
    // The asset layer adds a page's trailing slash with a temporary 307; search engines should see it as permanent.
    if (response.status === 307) {
      const location = new URL(response.headers.get('Location') ?? '', url);
      if (location.origin === url.origin && location.pathname === `${url.pathname}/`) {
        return Response.redirect(location.href, 301);
      }
    }
    if (isPreviewHost(url.hostname)) {
      response = new Response(response.body, response);
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return response;
  },
};
