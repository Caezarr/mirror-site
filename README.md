# Mirror public site

Public product, privacy, and support information for Mirror.

- [Home](https://caezarr.github.io/mirror-site/)
- [Privacy](https://caezarr.github.io/mirror-site/privacy/)
- [Support](https://caezarr.github.io/mirror-site/support/)

The site is intentionally static and contains no cookies, analytics, forms, or
third-party scripts.

## Development

### SEO Validation

The site includes automated validation for:
- JSON-LD structured data (schema.org compliance, no empty fields)
- Sitemap lastmod accuracy
- 404 page noindex handling

Run validation locally:

```bash
npm install
npm test
```

The validation runs automatically in CI on every pull request.

## Community

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). See also [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).
