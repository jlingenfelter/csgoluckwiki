/**
 * Cloudflare Pages Function — GitHub OAuth for Decap CMS
 *
 * This handles the OAuth callback from GitHub and returns the token
 * to Decap CMS so it can commit to your repo.
 *
 * Environment variables needed (set in Cloudflare Pages dashboard):
 *   GITHUB_CLIENT_ID     — from GitHub OAuth App settings
 *   GITHUB_CLIENT_SECRET  — from GitHub OAuth App settings
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Step 1: Redirect to GitHub for authorization
  if (!url.searchParams.has('code')) {
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', `${url.origin}/api/auth`);
    authUrl.searchParams.set('scope', 'repo,user');
    authUrl.searchParams.set('state', crypto.randomUUID());

    return Response.redirect(authUrl.toString(), 302);
  }

  // Step 2: Exchange code for access token
  const code = url.searchParams.get('code');

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return new Response(`Auth error: ${tokenData.error_description}`, { status: 400 });
  }

  // Step 3: Return token to Decap CMS via postMessage
  const token = tokenData.access_token;
  const provider = 'github';

  const html = `<!DOCTYPE html>
<html>
<head><title>Authenticating...</title></head>
<body>
<script>
(function() {
  function receiveMessage(e) {
    console.log("receiveMessage %o", e);
    window.opener.postMessage(
      'authorization:${provider}:success:${JSON.stringify({ token, provider })}',
      e.origin
    );
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:${provider}", "*");
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
