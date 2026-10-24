// Clean addresses for the site: blindsidenetwork.com/timeline is timeline.html.
//
// Runs ONLY when no file matches the path (wrangler-site.toml keeps
// html_handling = "none", so a real file is served straight from the assets
// layer, free, and never reaches this). That leaves extensionless pages, the
// bare root, and genuine 404s -- a handful of requests per visit, well inside
// the free plan.
//
// Why not html_handling = "auto-trailing-slash", which does this for free: it
// answers /timeline.html with a 307 to /timeline, and sw.js fetches pages with
// redirect: 'manual' -- every cached copy of the site keys pages by their .html
// name. Both spellings answering 200 keeps every old link, bookmark and cache
// working while the address bar shows the clean one (js/site-header.js).
const APEX = 'blindsidenetwork.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // One home: www is the same site under a second storage origin, which would
    // split saves and settings in two. Only reaches here for paths no file
    // matches -- which includes the bare www.blindsidenetwork.com people type.
    if (url.hostname === 'www.' + APEX) {
      url.hostname = APEX;
      return Response.redirect(url.toString(), 301);
    }

    // No extension: a page. "/" and "/seasons/" are their index.
    if (!/\.[a-z0-9]+$/i.test(url.pathname)) {
      const page = new URL(url);
      page.pathname = (url.pathname.endsWith('/') ? url.pathname + 'index' : url.pathname) + '.html';
      const res = await env.ASSETS.fetch(new Request(page, request));
      if (res.status !== 404) return res;
    }

    return env.ASSETS.fetch(request);
  },
};
