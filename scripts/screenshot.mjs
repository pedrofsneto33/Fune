/**
 * Automacao de screenshots autenticados do sistema.
 *
 * Uso:
 *   node scripts/screenshot.mjs            # todas as rotas
 *   node scripts/screenshot.mjs dashboard  # uma rota por vez
 *
 * O login e MANUAL (primeira execucao). O perfil persistente em
 * ./scripts/.pw-profile/ guarda o cookie, entao as execucoes seguintes
 * ja entram logado.
 *
 * Nao commitar: scripts/screenshots/ e scripts/.pw-profile/
 */

import { chromium } from 'playwright';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://eternitysos.vercel.app';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(HERE, 'screenshots');
const VIDEO_DIR = path.join(OUT_DIR, 'video');
const PROFILE_DIR = path.join(HERE, '.pw-profile');

const LOGIN_TIMEOUT_MS = 180_000;
const NAV_TIMEOUT_MS = 60_000;

// ATENCAO: o grupo de rotas (dashboard) do Next.js nao gera prefixo na URL.
// Nao existe /dashboard nem /dashboard/titulares. Verificado em
// src/app/(dashboard)/page.tsx:29 -> router.replace('/').
const ROUTES = [
  { id: 'dashboard', path: '/', file: 'dashboard.png', viewport: { width: 1360, height: 900 }, fullPage: true },
  { id: 'titulares', path: '/titulares', file: 'titulares.png', viewport: { width: 1360, height: 900 }, fullPage: true },
  { id: 'ordens', path: '/ordens', file: 'guias.png', viewport: { width: 1360, height: 900 }, fullPage: true },
  { id: 'contratos', path: '/contratos', file: 'contratos.png', viewport: { width: 1360, height: 900 }, fullPage: true },
];

// Modo video: hero da landing. 8 telas, ~35s de pausa.
const VIDEO_SHORT = [
  { path: '/', pauseMs: 5000, scroll: 'slow' }, // visao do dono
  { path: '/titulares', pauseMs: 5000, scroll: 'slow' }, // base do negocio
  { path: '/contratos', pauseMs: 3000 }, // vinculo
  { path: '/vendas/nova', pauseMs: 4000 }, // jornada de venda
  { path: '/ordens', pauseMs: 5000, scroll: 'slow' }, // operacao: OS + guia
  { path: '/tanatopraxia', pauseMs: 3000 }, // tecnica do funeral
  { path: '/financeiro', pauseMs: 5000, scroll: 'slow' }, // dinheiro
  { path: '/usuarios', pauseMs: 5000 }, // RBAC ja abre sozinho (isOpen=true)
];

// Modo video: WhatsApp/YouTube. 18 telas, ~68s de pausa.
const VIDEO_FULL = [
  { path: '/', pauseMs: 5000, scroll: 'slow' },
  { path: '/titulares', pauseMs: 5000, scroll: 'slow' },
  { path: '/dependentes', pauseMs: 3000 },
  { path: '/contratos', pauseMs: 3000 },
  { path: '/vendas/nova', pauseMs: 4000 },
  { path: '/crm', pauseMs: 4000 },
  { path: '/vendedores', pauseMs: 3000 },
  { path: '/ordens', pauseMs: 5000, scroll: 'slow' },
  { path: '/tanatopraxia', pauseMs: 3000 },
  { path: '/capela', pauseMs: 3000 },
  { path: '/sepultamentos', pauseMs: 3000 },
  { path: '/logistica', pauseMs: 3000 },
  { path: '/frota', pauseMs: 3000 },
  { path: '/estoque', pauseMs: 3000 },
  { path: '/financeiro', pauseMs: 5000, scroll: 'slow' },
  { path: '/livro-caixa', pauseMs: 5000, scroll: 'slow' },
  { path: '/contas-a-pagar', pauseMs: 5000, scroll: 'slow' },
  { path: '/beneficios', pauseMs: 5000, scroll: 'slow' },
];

const VIDEO_MODES = { 'video-short': VIDEO_SHORT, 'video-full': VIDEO_FULL };

/** Mascara CPF e datas no texto do DOM antes do screenshot. */
async function maskSensitive(page) {
  return page.evaluate(() => {
    const REPLACEMENTS = [
      [/\d{3}\.\d{3}\.\d{3}-\d{2}/g, '***.***.***-**'],
      [/\b\d{2}\/\d{2}\/\d{4}\b/g, '__/__/____'],
      [/\b\d{2}\/\d{2}\/\d{2}\b/g, '__/__/__'],
      [/\b\d{11}\b/g, '***********'],
    ];

    const mask = (s) => REPLACEMENTS.reduce((acc, [re, to]) => acc.replace(re, to), s);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent) continue;
      const tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue;
      nodes.push(node);
    }

    let touched = 0;
    for (const node of nodes) {
      const original = node.nodeValue;
      if (!original) continue;
      const next = mask(original);
      if (next !== original) {
        node.nodeValue = next;
        touched += 1;
      }
    }
    return touched;
  });
}

async function fileSizeKb(filePath) {
  const s = await stat(filePath);
  return Math.round(s.size / 1024);
}

const arg = process.argv[2];
const videoRoute = arg ? VIDEO_MODES[arg] : null;
const isVideoMode = Boolean(videoRoute);
const selected = arg && !isVideoMode ? ROUTES.filter((r) => r.id === arg) : ROUTES;

if (arg && !isVideoMode && selected.length === 0) {
  const validos = [...ROUTES.map((r) => r.id), ...Object.keys(VIDEO_MODES)].join(', ');
  console.error(`Modo desconhecido: "${arg}". Validos: ${validos}`);
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });
await mkdir(VIDEO_DIR, { recursive: true });

console.log(`[0/${selected.length + 1}] Abrindo Chromium (perfil: ${PROFILE_DIR})`);
const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false,
  viewport: { width: 1360, height: 900 },
  deviceScaleFactor: 2,
  locale: 'pt-BR',
  timezoneId: 'America/Sao_Paulo',
  recordVideo: {
    dir: VIDEO_DIR,
    size: { width: 1360, height: 900 },
  },
});

const page = context.pages()[0] ?? (await context.newPage());
page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);

let step = 0;
try {
  step += 1;
  console.log(`[${step}/${selected.length + 1}] Abrindo ${BASE}/login (faca login na janela)...`);
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });

  // Login e manual: src/app/login/page.tsx:30 faz router.replace('/')
  // apos autenticar, entao a URL sai de /login.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: LOGIN_TIMEOUT_MS,
  });
  console.log('    Login detectado. Perfil salvo.');

  if (isVideoMode) {
    const total = videoRoute.length;
    let elapsed = 0;

    for (const [i, route] of videoRoute.entries()) {
      const scrollTag = route.scroll === 'slow' ? ' + scroll' : '';
      console.log(
        `[${i + 1}/${total}] ${BASE}${route.path} — ${route.pauseMs / 1000}s${scrollTag}`,
      );
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await maskSensitive(page);

      if (route.scroll === 'slow') {
        // Scrolla o documento (o layout (dashboard) nao tem container com
        // overflow proprio). Loop do lado do Playwright: requestAnimationFrame
        // NAO dispara em aba em background, o que travava o scroll anterior.
        const SCROLL_STEPS = 20;
        const stepDelayMs = Math.floor(route.pauseMs / SCROLL_STEPS);
        for (let s = 1; s <= SCROLL_STEPS; s++) {
          await page.evaluate((pct) => {
            const el = document.scrollingElement || document.documentElement;
            const target = el.scrollHeight - el.clientHeight;
            el.scrollTop = (target * pct) / 100;
          }, (s / SCROLL_STEPS) * 100);
          await page.waitForTimeout(stepDelayMs);
        }
      } else {
        await page.waitForTimeout(route.pauseMs);
      }

      // Reset antes do proximo goto (a proxima pagina ja abre no topo).
      await page.evaluate(() => window.scrollTo(0, 0));
      elapsed += route.pauseMs;
    }
    console.log(`Pausas somadas: ${(elapsed / 1000).toFixed(1)}s (+ navegacao)`);
  }

  if (!isVideoMode) {
    for (const route of selected) {
      step += 1;
      console.log(`[${step}/${selected.length + 1}] Navegando para ${BASE}${route.path}...`);
      await page.setViewportSize(route.viewport);
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' });
      await page.waitForLoadState('networkidle').catch(() => {});

      const touched = await maskSensitive(page);
      const filePath = path.join(OUT_DIR, route.file);
      await page.screenshot({ path: filePath, fullPage: route.fullPage, animations: 'disabled' });

      console.log(
        `[OK] ${route.file} salvo (${await fileSizeKb(filePath)} KB, ${touched} nos mascarados)`,
      );
    }
    console.log('Fim. Saida em scripts/screenshots/');
  }
} catch (err) {
  console.error('[ERRO]', err && err.message ? err.message : err);
  process.exitCode = 1;
} finally {
  // O .webm so e finalizado no context.close() (docs do recordVideo).
  if (isVideoMode) {
    const videoPath = await page.video()?.path();
    if (videoPath) console.log(`[VIDEO] ${videoPath}`);
    else console.log('[VIDEO] nenhum arquivo (page sem video)');
  }
  await context.close();
}