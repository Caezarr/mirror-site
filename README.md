# Mirror public site

Static website with the public product, privacy and support information for **Mirror**, a local-first macOS workflow assistant (pre-release). The app itself lives in a separate private repository; this repo only holds the public pages the release process requires.

Live: <https://caezarr.github.io/mirror-site/>

| Page | Source | URL |
|------|--------|-----|
| Home | `index.html` | [/](https://caezarr.github.io/mirror-site/) |
| Privacy policy | `privacy/index.html` | [/privacy/](https://caezarr.github.io/mirror-site/privacy/) |
| Support | `support/index.html` | [/support/](https://caezarr.github.io/mirror-site/support/) |
| Not found | `404.html` | served by GitHub Pages for unknown paths |

The site is plain HTML and one stylesheet (`styles.css`): no build step, no JavaScript, no cookies, analytics, forms or third-party scripts. Light and dark themes follow `prefers-color-scheme`.

## Layout

```
index.html, privacy/, support/, 404.html   pages
styles.css, favicon.svg, og.png            shared assets (og.svg is the source of og.png)
sitemap.xml, robots.txt, site.webmanifest  crawler and browser metadata
llms.txt, humans.txt, .well-known/         plain-text site info and security.txt
validate-seo.js, check-links.js            checks run by npm test
```

## Deployment

GitHub Pages serves the `main` branch from the repository root (`.nojekyll` disables Jekyll processing). Merging to `main` publishes the site; there is nothing to build. Pages are served under the `/mirror-site/` project path, so links between pages are relative and the 404 page uses `/mirror-site/...` absolute paths.

## Checks

```bash
npm ci
npm test
```

`npm test` runs, and CI runs on every pull request:

- `validate:seo`: JSON-LD is valid schema.org with no empty fields, sitemap `lastmod` dates are sane, 404 is `noindex`
- `validate:html`: [html-validate](https://html-validate.org) recommended rules on every page
- `check:links`: every local `href`/`src`, OG image and manifest icon resolves to a file in the repo (offline; external URLs are not fetched)

When editing a page, also update its `lastmod` in `sitemap.xml`.

## Community

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). See also [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).
