#!/usr/bin/env node
/**
 * Offline link and asset checker for the static site.
 *
 * Resolves every local href/src in the HTML pages (and manifest icons) to a
 * file in the repository. Absolute paths under /mirror-site/ and absolute
 * URLs on https://caezarr.github.io/mirror-site/ are mapped to the repo root,
 * matching how GitHub Pages serves this project site. External URLs are not
 * fetched, so the check is deterministic in CI.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
const SITE_URL = 'https://caezarr.github.io/mirror-site/';
const BASE_PATH = '/mirror-site/';
const PAGES = ['index.html', '404.html', 'privacy/index.html', 'support/index.html'];

let failures = 0;

/** Map a reference found in `fromFile` to a repo path, or null if external. */
function toRepoPath(ref, fromFile) {
  if (!ref || ref.startsWith('#') || /^(mailto|tel|data):/.test(ref)) return null;
  let p;
  if (ref.startsWith(SITE_URL)) p = ref.slice(SITE_URL.length);
  else if (/^[a-z]+:\/\//i.test(ref)) return null;
  else if (ref.startsWith(BASE_PATH)) p = ref.slice(BASE_PATH.length);
  else if (ref.startsWith('/')) return { invalid: `root-relative path outside ${BASE_PATH}` };
  else p = path.posix.join(path.posix.dirname(fromFile), ref);
  p = p.split(/[?#]/)[0];
  if (p === '' || p === '.' || p.endsWith('/')) p = path.posix.join(p, 'index.html');
  return { file: path.posix.normalize(p) };
}

function check(ref, fromFile, where) {
  const target = toRepoPath(ref, fromFile);
  if (!target) return;
  if (target.invalid) {
    failures++;
    console.error(`❌ ${fromFile}: ${where} "${ref}" is a ${target.invalid}`);
  } else if (!fs.existsSync(path.join(ROOT, target.file))) {
    failures++;
    console.error(`❌ ${fromFile}: ${where} "${ref}" -> missing ${target.file}`);
  }
}

for (const page of PAGES) {
  const { document } = new JSDOM(fs.readFileSync(path.join(ROOT, page), 'utf-8')).window;
  document.querySelectorAll('[href]').forEach((el) => check(el.getAttribute('href'), page, `<${el.tagName.toLowerCase()} href>`));
  document.querySelectorAll('[src]').forEach((el) => check(el.getAttribute('src'), page, `<${el.tagName.toLowerCase()} src>`));
  document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach((el) => check(el.getAttribute('content'), page, 'meta image'));
  document.querySelectorAll('img:not([alt])').forEach(() => {
    failures++;
    console.error(`❌ ${page}: <img> without alt`);
  });
  const ids = new Set([...document.querySelectorAll('[id]')].map((el) => el.id));
  document.querySelectorAll('a[href^="#"]').forEach((el) => {
    const id = el.getAttribute('href').slice(1);
    if (id && !ids.has(id)) {
      failures++;
      console.error(`❌ ${page}: in-page link #${id} has no target`);
    }
  });
}

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.webmanifest'), 'utf-8'));
for (const icon of manifest.icons || []) check(icon.src, 'site.webmanifest', 'icon');

if (failures) {
  console.error(`\n❌ ${failures} broken link(s) or asset(s)`);
  process.exit(1);
}
console.log(`✅ Links and assets resolve in ${PAGES.length} pages`);
