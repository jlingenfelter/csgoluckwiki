import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Build RSS XML with recent "patch notes" or updates
  const items = [
    { title: 'CSGOLuck Wiki Launch', link: '/', date: '2026-03-01' },
    { title: 'Skin Database — 21,000+ Skins with Live Prices', link: '/cs2-skins/', date: '2026-03-01' },
    { title: 'Pro Player Settings — 860+ Configs Added', link: '/pro-players/', date: '2026-03-02' },
    { title: '30+ Free CS2 Tools Now Available', link: '/cs2-tools/', date: '2026-03-02' },
    { title: 'Case Simulator & Odds Calculator Live', link: '/case-simulator/', date: '2026-03-03' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>CSGOLuck Wiki Updates</title>
  <link>https://wiki.csgoluck.com</link>
  <description>Latest CS2 updates, patch notes, and wiki additions</description>
  <language>en-us</language>
  <atom:link href="https://wiki.csgoluck.com/rss.xml" rel="self" type="application/rss+xml"/>
  ${items.map(i => `<item><title>${i.title}</title><link>https://wiki.csgoluck.com${i.link}</link><pubDate>${new Date(i.date).toUTCString()}</pubDate></item>`).join('\n  ')}
</channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
