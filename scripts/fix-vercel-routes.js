/**
 * 1) Ставит маршруты API перед handle: "filesystem" в .vercel/output/config.json,
 *    иначе /api/* отдаёт 404 (filesystem перехватывает раньше).
 * 2) Добавляет overrides с Content-Type для .js/.css в static/assets,
 *    иначе браузер получает application/octet-stream и не выполняет модули (белый экран).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, '..', '.vercel', 'output');
const configPath = join(outputDir, 'config.json');
const staticAssetsDir = join(outputDir, 'static', 'assets');

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const routes = config.routes || [];

const apiRoutes = routes.filter((r) => r.src && r.src.startsWith('^/api'));
const fsRoute = routes.find((r) => r.handle === 'filesystem');
const rest = routes.filter((r) => r.handle !== 'filesystem' && (!r.src || !r.src.startsWith('^/api')));

// Маршруты с Content-Type для /assets/* (headers + transforms — Vercel может применять только один из них)
const assetHeaders = [
  {
    src: '^/assets/.+\\.js$',
    headers: { 'Content-Type': 'text/javascript' },
    transforms: [{ type: 'response.headers', op: 'set', target: { key: 'Content-Type' }, args: ['text/javascript'] }],
    continue: true,
  },
  {
    src: '^/assets/.+\\.css$',
    headers: { 'Content-Type': 'text/css' },
    transforms: [{ type: 'response.headers', op: 'set', target: { key: 'Content-Type' }, args: ['text/css'] }],
    continue: true,
  },
];

if (!fsRoute) {
  console.log('fix-vercel-routes: handle filesystem not found, skip');
} else {
  // Плагин не создаёт catch-all для /api/* — только точные /api/health, /api/route, /api/serve-asset.
  // Добавляем catch-all: /api/* -> /api/route?path=$1, иначе /api/stats/dashboard и т.д. дают 404.
  const catchAllApi = { src: '^/api/(.*)$', dest: '/api/route?path=$1', check: true };
  const hasCatchAll = apiRoutes.some((r) => r.src === '^/api/(.*)$');
  const apiRoutesWithCatchAll = hasCatchAll ? apiRoutes : [...apiRoutes, catchAllApi];
  config.routes = [...rest, ...apiRoutesWithCatchAll, ...assetHeaders, fsRoute];
  console.log('fix-vercel-routes: API routes + catch-all /api/* -> /api/route?path=$1');
}

// Overrides: путь относительно .vercel/output/static (без ведущего /)
config.overrides = config.overrides || {};
if (existsSync(staticAssetsDir)) {
  for (const name of readdirSync(staticAssetsDir)) {
    const relPath = 'assets/' + name;
    const ct = name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : null;
    if (ct) config.overrides[relPath] = { contentType: ct };
  }
  console.log('fix-vercel-routes: MIME overrides set for assets');
}

writeFileSync(configPath, JSON.stringify(config, null, 2));

// 3) Подмена ссылок на ассеты в index.html: /assets/xxx -> /api/serve-asset?path=xxx (обход MIME application/octet-stream)
const indexPath = join(outputDir, 'static', 'index.html');
if (existsSync(indexPath)) {
  let html = readFileSync(indexPath, 'utf8');
  html = html.replace(/(src|href)="\/assets\/([^"]+)"/g, '$1="/api/serve-asset?path=$2"');
  writeFileSync(indexPath, html);
  console.log('fix-vercel-routes: index.html asset URLs rewritten to /api/serve-asset');
}
