/** Minimal HTML landing page served at `/` — handy for quick checks in a browser. */
export const landingPage = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>App Mobile Collège — API</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, sans-serif; max-width: 640px; margin: 8vh auto; padding: 0 24px; line-height: 1.6; }
  h1 { font-size: 1.6rem; }
  code { background: rgba(128,128,128,.15); padding: 2px 6px; border-radius: 6px; }
  a { color: #274690; }
  ul { padding-left: 1.2rem; }
  .badge { display:inline-block; font-size:.8rem; padding:2px 10px; border-radius:999px; background:#2e7d32; color:#fff; vertical-align:middle; }
</style>
</head>
<body>
  <h1>App Mobile Collège — API <span class="badge">en ligne</span></h1>
  <p>Serveur Express 5 / TypeScript au service de l'application Flutter.</p>
  <p>👉 <a href="/app"><strong>Ouvrir la démo de l'application</strong></a>
  (interface web fidèle à l'app Flutter, branchée sur cette API).</p>
  <ul>
    <li><a href="/api"><code>GET /api</code></a> — index de l'API</li>
    <li><a href="/api/health"><code>GET /api/health</code></a> — sonde de vie</li>
    <li><a href="/api/courses"><code>GET /api/courses</code></a> — liste des cours</li>
    <li><a href="/api/courses/1"><code>GET /api/courses/:id</code></a> — détail d'un cours</li>
  </ul>
  <p><small>Créer un cours : <code>POST /api/courses</code> avec un corps JSON
  (<code>code</code>, <code>title</code>, <code>professor</code>, <code>credits</code>, <code>schedule</code>).</small></p>
</body>
</html>
`;
