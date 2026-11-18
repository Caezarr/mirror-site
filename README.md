# Mirror public site

The public product, privacy and support pages for Mirror, a local-first macOS workflow assistant. Live at <https://caezarr.github.io/mirror-site/>.

## The problem

Mirror recognises repeated work on a Mac and prepares automation drafts that the user reviews before anything runs. A tool that watches how you work is one step away from surveillance, so the privacy story has to be concrete and public before the app ships. Distribution also requires a stable privacy policy URL and a support channel. The app repository is private, so these pages need a public home of their own.

## How this site addresses it

- **States what Mirror does not collect.** No screenshots, screen recordings, keystrokes, page text, form values, passwords, cookies, tokens, URL query strings or fragments. Workflow evidence stays in encrypted local storage on the Mac; browser observation is off by default and only talks to a local native-messaging host.
- **Practises what it describes.** Plain HTML and one stylesheet: no JavaScript, cookies, analytics, forms or third-party scripts. Light and dark themes follow `prefers-color-scheme`.
- **No build step.** GitHub Pages serves `main` from the repository root, so what is reviewed in a pull request is exactly what gets published.
- **Checked in CI.** Structured data, HTML validity and local links are validated on every pull request.

## Try it

View the live site: <https://caezarr.github.io/mirror-site/> (also [/privacy/](https://caezarr.github.io/mirror-site/privacy/) and [/support/](https://caezarr.github.io/mirror-site/support/)).

Or serve it locally from a fresh clone (any static server works; this uses Python 3):

```bash
git clone https://github.com/Caezarr/mirror-site.git
cd mirror-site
python3 -m http.server 8000
```

Open <http://localhost:8000/>. Home, `/privacy/` and `/support/` load with styles. The 404 page uses `/mirror-site/...` absolute paths, so it only renders correctly on GitHub Pages.

## How it works

| Page | Source |
|---|---|
| Home | `index.html` |
| Privacy policy | `privacy/index.html` |
| Support | `support/index.html` |
| Not found | `404.html` |

```
index.html, privacy/, support/, 404.html   pages
styles.css, favicon.svg, og.png            shared assets (og.svg is the source of og.png)
sitemap.xml, robots.txt, site.webmanifest  crawler and browser metadata
llms.txt, humans.txt, .well-known/         plain-text site info and security.txt
validate-seo.js, check-links.js            checks run by npm test
```

Pages are served under the `/mirror-site/` project path, so links between pages are relative. `.nojekyll` disables Jekyll processing. Merging to `main` publishes the site.

## Limits and status

Mirror itself is in pre-release development; the native app and browser companion are not publicly distributed yet. This repository contains only the public pages, no app code. The support link points to this repository's issue tracker.

## Development

Needs Node.js 22 (as in CI).

```bash
npm ci
npm test
```

Expected output ends with:

```
✅ All SEO validation checks passed!
...
✅ Links and assets resolve in 4 pages
```

`npm test` runs three checks:

- `validate:seo`: JSON-LD is valid schema.org with no empty fields, sitemap `lastmod` dates are sane, 404 is `noindex`.
- `validate:html`: [html-validate](https://html-validate.org) recommended rules on every page.
- `check:links`: every local `href`/`src`, OG image and manifest icon resolves to a file in the repo (offline; external URLs are not fetched).

When editing a page, also update its `lastmod` in `sitemap.xml`. See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
