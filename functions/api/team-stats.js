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

    // Helper: check if a PandaScore team object is CS:GO / CS2
    const isCSTeam = (t) =>
      t.current_videogame?.slug === 'cs-go' || t.current_videogame?.slug === 'cs-2' ||
      t.current_videogame?.id === 3 || t.current_videogame?.id === 14;

    // Helper: slim a raw PandaScore team object
    const slim = (t) => ({
      id: t.id, name: t.name, slug: t.slug, acronym: t.acronym, location: t.location,
      image: t.image_url, imageDark: t.dark_mode_image_url,
      players: (t.players || []).map(p => ({
        id: p.id, name: p.name, slug: p.slug, firstName: p.first_name, lastName: p.last_name,
        nationality: p.nationality, age: p.age, role: p.role, image: p.image_url, active: p.active,
      })),
    });

    // Direct ID lookup — use CSGO endpoint
    if (teamId) {
      const res = await fetch(
        `https://api.pandascore.co/csgo/teams/${teamId}?token=${apiKey}`,
        { headers: { 'Accept': 'application/json' }, cf: { cacheTtl: 3600 } }
      );
      if (!res.ok) {
        const errText = await res.text();
        return new Response(JSON.stringify({ error: 'PandaScore API error', status: res.status, detail: errText }), { status: res.status, headers: errorHeaders });
      }
      const raw = await res.json();
      return new Response(JSON.stringify(slim(Array.isArray(raw) ? raw[0] : raw)), { status: 200, headers });
    }

    if (!teamSlug && !teamName) {
      return new Response(JSON.stringify({ error: 'Provide ?id=, ?slug=, or ?name= parameter' }), { status: 400, headers: errorHeaders });
    }

    // Slug or name search — use generic endpoint, then filter for CS teams
    const apiUrl = teamSlug
      ? `https://api.pandascore.co/teams?filter[slug]=${encodeURIComponent(teamSlug)}&per_page=10&token=${apiKey}`
      : `https://api.pandascore.co/teams?search[name]=${encodeURIComponent(teamName)}&per_page=25&token=${apiKey}`;

    const res = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      cf: { cacheTtl: 3600 },
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: 'PandaScore API error', status: res.status, detail: errText }), { status: res.status, headers: errorHeaders });
    }

    let teams = await res.json();
    if (!Array.isArray(teams)) teams = [teams];

    // Filter for CS:GO/CS2 teams
    let csTeams = teams.filter(isCSTeam);

    // Fallback: if slug resolved to a non-CS team (e.g. Dota 2 "team-spirit"),
    // use its org name to search again for the CS team
    if (csTeams.length === 0 && teamSlug && teams.length > 0) {
      const orgName = teams[0].name; // e.g. "Team Spirit", "Natus Vincere"
      const nameUrl = `https://api.pandascore.co/teams?search[name]=${encodeURIComponent(orgName)}&per_page=25&token=${apiKey}`;
      const nameRes = await fetch(nameUrl, {
        headers: { 'Accept': 'application/json' },
        cf: { cacheTtl: 3600 },
      });
      if (nameRes.ok) {
        const nameResults = await nameRes.json();
        csTeams = (nameResults || []).filter(isCSTeam);
      }
    }

    // Use CS teams if found, otherwise fall back to original results
    if (csTeams.length > 0) teams = csTeams;

    const slimTeams = teams.map(slim);

    return new Response(JSON.stringify({ teams: slimTeams, count: slimTeams.length }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers: errorHeaders });
  }
}
