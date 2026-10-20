import { guides } from '../data/guides';
export function GET({ site }: { site: URL }) {
 const paths = ['/', '/ink/', '/frame/', '/docs/', '/releases/', ...guides.map(g=>`/docs/${g.slug}/`)];
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p=>`<url><loc>${new URL(p,site)}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml'}});
}
