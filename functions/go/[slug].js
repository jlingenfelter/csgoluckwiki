/**
 * Affiliate link redirect handler — /go/:slug
 * Shows a branded interstitial page before redirecting to the affiliate URL.
 * Links are masked behind clean /go/ paths and noindexed.
 */

const AFFILIATE_LINKS = {
  // ── Marketplaces & Trading Sites ──────────────────────────────────────
  'skinport':     { url: 'https://skinport.com/?r=csdb', name: 'Skinport' },
  'tradeit':      { url: 'https://tradeit.gg/?aff=csdb', name: 'Tradeit.gg' },
  'dmarket':      { url: 'https://dmarket.com/?ref=buxspwDmkT', name: 'DMarket' },
  'whitemarket':  { url: 'https://white.market/invite/20af6cde65006df8', name: 'White Market' },
  'waxpeer':      { url: 'https://waxpeer.com/r/csdb', name: 'Waxpeer' },
  'gamerpay':     { url: 'https://gamerpay.gg/partner/6b3f857168', name: 'GamerPay' },
  'shadowpay':    { url: 'https://shadowpay.com?utm_campaign=s6wabwMeiZTG2T1', name: 'ShadowPay' },
  'skinbaron':    { url: 'https://www.idevaffiliate.com/33102/idevaffiliate.php?id=785', name: 'SkinBaron' },
  'lis-skins':    { url: 'https://lis-skins.ru/?rf=2486484', name: 'LIS-SKINS' },
  'swap-gg':      { url: 'https://swap.gg/?r=BI6pXM6imV', name: 'Swap.gg' },
  'skinswap':     { url: 'https://skinswap.com/r/csdb', name: 'SkinSwap' },
  'farmskins':    { url: 'https://farmskins.com/ref-csdb', name: 'Farmskins' },
  'hellcase':     { url: 'https://hellcase.com/fcsdb', name: 'Hellcase' },
  'insane':       { url: 'https://insane.gg/ref/CSDBGG', name: 'Insane.gg' },
  'clash':        { url: 'https://clash.gg/r/CSDB', name: 'Clash.gg' },
  'chicken':      { url: 'https://chicken.gg/r/csdb', name: 'Chicken.gg' },
  'rain':         { url: 'https://rain.gg/r/iGI7mtV2HM', name: 'Rain.gg' },
  'r1-skins':     { url: 'https://r1-skins.com/ref-csdb', name: 'R1 Skins' },

  // ── Case / Gambling Sites ─────────────────────────────────────────────
  'csgocases':    { url: 'https://csgocases.com/r/csdb', name: 'CSGOCases' },
  'g4skins':      { url: 'https://g4skins.com/ref/csdb', name: 'G4Skins' },
  'knifex':       { url: 'https://knifex.com/ref/csdbgg', name: 'Knifex' },
  'csgoempire':   { url: 'https://csgoempire.com/r/csdb', name: 'CSGOEmpire' },
  'gamdom':       { url: 'https://gamdom.com/landing?aff=csdb', name: 'Gamdom' },
  'bloodycase':   { url: 'https://bloodycase.com/?promocode=csdb', name: 'BloodyCase' },
  'datdrop':      { url: 'https://datdrop.com/p/csdb', name: 'Datdrop' },
  'csgorun':      { url: 'https://cs2run.vip/ref/nvvybt', name: 'CSGORun' },
  'csgoroll':     { url: 'https://www.csgoroll.com/r/CSDB', name: 'CSGORoll' },
  'hotpizza':     { url: 'https://hotpizza.click/p/csdb', name: 'HotPizza' },
  'plg':          { url: 'https://plg.bet/?r=CSDBGG', name: 'PLG.bet' },
  'cs2points':    { url: 'https://cs2points.net/?ref=76561199686832020', name: 'CS2Points' },
  'csgobig':      { url: 'https://csgobig.com/r/csdb', name: 'CSGOBig' },
  'csgoluck':     { url: 'https://csgoluck.com/r/CSDB', name: 'CSGOLuck' },
  'hellstore':    { url: 'https://hellstore.me/r/2464229', name: 'Hellstore' },
  'csgo500':      { url: 'https://500.casino/r/CSDB', name: 'CSGO500' },
  'keydrop':      { url: 'https://keydrop.com/?code=CSDBGG', name: 'KeyDrop' },
  'stake':        { url: 'https://stake.com/?c=rapbeZ8s', name: 'Stake' },
  'gamivo':       { url: 'https://www.gamivo.com/?glv=csdb', name: 'Gamivo' },
  'gamehag':      { url: 'https://gamehag.com/r/10711852', name: 'Gamehag' },
  'skinbet':      { url: 'https://skinbet.gg/r/csdb', name: 'Skinbet' },
  'daddyskins':   { url: 'https://daddyskins.com/promo-code/1821552', name: 'DaddySkins' },
  'howl':         { url: 'https://howl.gg/r/csdb', name: 'Howl.gg' },
  'skins-cash':   { url: 'https://skins.cash/user/ref/76561199686832020', name: 'Skins.Cash' },
  'skincashier':  { url: 'https://skincashier.com/r/CSDB', name: 'SkinCashier' },
  'csgostake':    { url: 'https://csgostake.com/r/csdb', name: 'CSGOStake' },
  'skinrave':     { url: 'https://skinrave.gg/r/csdbgg', name: 'SkinRave' },
  'csgofast':     { url: 'https://csgofast.com?ref=CSDB', name: 'CSGOFast' },
  'ggdrop':       { url: 'https://ggband.gg/referral/csdb?utm_source=CSDB', name: 'GGDrop' },
  'csgogem':      { url: 'https://csgogem.com/r/csdb', name: 'CSGOGem' },
  'lootbox':      { url: 'https://lootbox.com/r/csdbgg', name: 'Lootbox' },
  'opcases':      { url: 'https://opcases.com/r/csdbgg', name: 'OPCases' },
  'skin-fans':    { url: 'https://skin.fans/r/csdbgg', name: 'Skin.Fans' },
  'bountystars':  { url: 'https://bountystars.com/?r=csdb', name: 'BountyStars' },
  'xfun':         { url: 'https://x.fun/r/csdb', name: 'X.Fun' },
  'csgold':       { url: 'https://csgold.gg/r/CSDB', name: 'CSGOLD' },
  'cases-gg':     { url: 'https://cases.gg/r/CSDB', name: 'Cases.GG' },
  'skincade':     { url: 'https://skincade.com/r/CSDB', name: 'Skincade' },
  'casehug':      { url: 'https://casehug.com/r/CSDB', name: 'CaseHug' },
  'rapidskins':   { url: 'https://rapidskins.com/a/csdb', name: 'Rapid Skins' },
  'avan-market':  { url: 'https://avan.market/en?r=csdb', name: 'Avan Market' },
  'skincantor':   { url: 'https://skincantor.com/?code=CSDB', name: 'Skin Cantor' },
  'pirateswap':   { url: 'https://pirateswap.com/?ref=csdb', name: 'PirateSwap' },
  'csgocasino':   { url: 'https://csgocasino.gg/?r=csdb', name: 'CSGOCasino' },
  'cs-fail':      { url: 'https://ggband.gg/referral/csdbgg', name: 'CS.Fail' },
};

function buildPage(siteName, targetUrl) {
  const domain = new URL(targetUrl).hostname.replace('www.', '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Redirecting to ${siteName} — CSDB.gg</title>
  <meta http-equiv="refresh" content="3;url=${targetUrl}">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f1923;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    .card{text-align:center;max-width:440px;padding:3rem 2.5rem;background:#1a2332;border:1px solid #2a3a4e;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.4)}
    .logo{font-size:1.4rem;font-weight:800;color:#d4956e;margin-bottom:2rem;letter-spacing:.02em}
    .logo span{opacity:.6}
    h1{font-size:1.1rem;font-weight:600;color:#fff;margin-bottom:.5rem}
    .domain{color:#8899aa;font-size:.85rem;margin-bottom:2rem}
    .spinner{width:36px;height:36px;border:3px solid #2a3a4e;border-top-color:#d4956e;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 1.5rem}
    @keyframes spin{to{transform:rotate(360deg)}}
    .progress{width:100%;height:3px;background:#2a3a4e;border-radius:2px;overflow:hidden;margin-bottom:1.5rem}
    .progress-bar{height:100%;background:linear-gradient(90deg,#d4956e,#e8b88a);border-radius:2px;animation:fill 3s ease-out forwards}
    @keyframes fill{from{width:0}to{width:100%}}
    .manual{color:#667788;font-size:.78rem}
    .manual a{color:#d4956e;text-decoration:none}
    .manual a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">CSDB<span>.gg</span></div>
    <div class="spinner"></div>
    <h1>Redirecting you to ${siteName}</h1>
    <p class="domain">${domain}</p>
    <div class="progress"><div class="progress-bar"></div></div>
    <p class="manual">Not redirected? <a href="${targetUrl}" rel="noopener noreferrer nofollow">Click here</a></p>
  </div>
  <script>setTimeout(function(){window.location.href="${targetUrl}"},3000)</script>
</body>
</html>`;
}

export function onRequestGet({ params }) {
  const slug = params.slug?.toLowerCase();
  const entry = AFFILIATE_LINKS[slug];

  if (!entry) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/trading-sites/' },
    });
  }

  return new Response(buildPage(entry.name, entry.url), {
    status: 200,
    headers: {
      'Content-Type': 'text/html;charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
