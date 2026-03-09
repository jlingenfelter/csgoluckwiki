/**
 * Cloudflare Pages Function: /api/team-logos
 * Fetches ALL CS2 teams from PandaScore (paginated) and returns
 * a name → logo URL mapping. Used to build static team logo data.
 *
 * Uses /csgo/teams list endpoint which is reliable.
 * Caches for 24h since team logos rarely change.
 */
export async function onRequestGet(context) {
  const { env } = context;
  const apiKey = env.PANDASCORE_API_KEY;

  const errorHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No PandaScore API key configured' }), { status: 500, headers: errorHeaders });
  }

  try {
    const allTeams = [];
    let page = 1;
    const perPage = 100;
    const maxPages = 20; // safety limit

    while (page <= maxPages) {
      const apiUrl = `https://api.pandascore.co/csgo/teams?per_page=${perPage}&page=${page}&sort=name&token=${apiKey}`;
      const res = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
        cf: { cacheTtl: 86400 },
      });

      if (!res.ok) break;

      const teams = await res.json();
      if (!teams.length) break;

      teams.forEach(t => {
        if (t.image_url || t.dark_mode_image_url) {
          allTeams.push({
            id: t.id,
            name: t.name,
            slug: t.slug,
            acronym: t.acronym,
            image: t.image_url,
            imageDark: t.dark_mode_image_url,
          });
        }
      });

      if (teams.length < perPage) break;
      page++;
    }

    // Build a lookup: lowercase name → { image, imageDark }
    // Also index by acronym for fuzzy matching
    const lookup = {};
    allTeams.forEach(t => {
      const key = t.name.toLowerCase();
      if (!lookup[key]) {
        lookup[key] = { image: t.image, imageDark: t.imageDark, id: t.id };
      }
      if (t.acronym) {
        const aKey = t.acronym.toLowerCase();
        if (!lookup[aKey]) {
          lookup[aKey] = { image: t.image, imageDark: t.imageDark, id: t.id };
        }
      }
    });

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    };

    return new Response(JSON.stringify({
      count: allTeams.length,
      teams: allTeams,
      lookup,
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers: errorHeaders });
  }
}
