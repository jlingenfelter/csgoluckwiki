/**
 * Cloudflare Pages Function: /api/team-stats
 * Fetches team data and player roster from PandaScore.
 *
 * Query params:
 *   ?id=12345          (PandaScore team ID)
 *   ?slug=natus-vincere (PandaScore team slug)
 *   ?name=NAVI          (search by name)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const apiKey = env.PANDASCORE_API_KEY;

  const baseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };
  const errorHeaders = { ...baseHeaders, 'Cache-Control': 'no-store' };
  const headers = { ...baseHeaders, 'Cache-Control': 'public, max-age=3600, s-maxage=3600' };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No PandaScore API key configured' }), { status: 500, headers: errorHeaders });
  }

  try {
    const url = new URL(request.url);
    const teamId = url.searchParams.get('id');
    const teamSlug = url.searchParams.get('slug');
    const teamName = url.searchParams.get('name');

    // Endpoint strategy:
    // - /csgo/teams/{id} for individual lookup (works)
    // - Generic /teams?filter[slug]= for slug search (no videogame filter — slug is unique)
    // - Generic /teams?search[name]= for name search (no videogame filter)
    // Note: /csgo/teams doesn't support filter[slug] or search[name] params,
    // and generic endpoints don't support filter[videogame].
    let apiUrl;
    if (teamId) {
      apiUrl = `https://api.pandascore.co/csgo/teams/${teamId}?token=${apiKey}`;
    } else if (teamSlug) {
      apiUrl = `https://api.pandascore.co/teams?filter[slug]=${encodeURIComponent(teamSlug)}&per_page=1&token=${apiKey}`;
    } else if (teamName) {
      apiUrl = `https://api.pandascore.co/teams?search[name]=${encodeURIComponent(teamName)}&per_page=10&token=${apiKey}`;
    } else {
      return new Response(JSON.stringify({ error: 'Provide ?id=, ?slug=, or ?name= parameter' }), { status: 400, headers: errorHeaders });
    }

    const res = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      cf: { cacheTtl: 3600 },
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: 'PandaScore API error', status: res.status, detail: errText }), { status: res.status, headers: errorHeaders });
    }

    const raw = await res.json();

    // Handle both single team and array responses
    const teams = Array.isArray(raw) ? raw : [raw];

    const slimTeams = teams.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      acronym: t.acronym,
      location: t.location,
      image: t.image_url,
      imageDark: t.dark_mode_image_url,
      players: (t.players || []).map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        firstName: p.first_name,
        lastName: p.last_name,
        nationality: p.nationality,
        age: p.age,
        role: p.role,
        image: p.image_url,
        active: p.active,
      })),
    }));

    return new Response(JSON.stringify(teamId ? slimTeams[0] : { teams: slimTeams, count: slimTeams.length }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers: errorHeaders });
  }
}
