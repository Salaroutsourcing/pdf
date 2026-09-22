# PDF Toolkit

A static, browser-based PDF workspace maintained in Salaroutsourcing/pdf. Core document processing stays in the browser. Office branding and favorite/recent tool preferences are stored locally; no staff account backend is enabled.

## Run locally

Requires Node.js 22+ and Python 3.

```sh
npm ci
npm run vendor
npm run content
npm run serve
```

Open http://127.0.0.1:4173. The app is deployed at a domain root; subdirectory hosting requires adapting absolute asset paths.

## Checks

```sh
npx playwright install chromium
npm test
npm audit
```

The browser tests exercise dashboard/tool initialization, PDF outputs, redaction text removal, HTML/filename safety, invalid input, local office preferences and mobile layout. GitHub Actions runs the same workflow on Linux. Local Chrome can be selected with `PDF_TEST_CHROME=1 npm test`.

## Structure

- `index.html`: current application, styles and tool implementations. `app.js` is a retired legacy placeholder and is not loaded.
- `scripts/vendor.cjs`: copies exact, locked runtime dependencies and licenses into `vendor/`. These assets are committed so static hosting does not need a build step.
- `scripts/content.cjs`: generates seven public guides and the sitemap. Run after editing guide copy.
- `sw.js`: caches only known same-origin static resources. It never caches local PDF contents or returns HTML as a substitute for missing script files.
- `docs/OFFICE-ACCOUNTS-SETUP.md`: recommended Supabase account architecture and launch requirements.
- `docs/DISCOVERY-LAUNCH.md`: deployment, indexing and AI discovery work.

## Limits

17 PDF tools plus a CV builder. Encrypted PDFs are rejected. Input checks cap each file at 100 MB and each selection at 200 MB; complex documents can exceed available memory below these limits. Compression and redaction rasterize pages and lose selectable text, forms, links and accessibility structure. Cropping hides content rather than deleting it. A signature image is not certificate-based signing. OCR exports English TXT with possible recognition errors; it does not produce a searchable PDF. CV/HTML exports are intended for print and do not promise ATS compatibility.

All runtime scripts are served from the site. Google Fonts and the initial OCR model download still require external requests. Core offline use depends on a successful cache installation; the OCR language model needs an initial connection. Review every output before sharing important documents.

No security certification, independent security audit, compliance certification or search ranking guarantee is claimed. Third-party license notices are in `vendor/`.
