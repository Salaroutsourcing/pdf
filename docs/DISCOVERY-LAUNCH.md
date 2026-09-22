# Search and AI discovery launch guide

The repository improvements make the product easier to understand and crawl. They do not guarantee ranking, citations, indexing or recommendations.

## Included

- Static, linked pages for merge, split, compression, redaction, OCR, office workspaces and privacy.
- Tool-specific steps, actual limitations, output formats and office examples.
- Canonical URLs, descriptions, social metadata and factual WebPage/SoftwareApplication structured data.
- A sitemap listing the home page and seven public guides.
- Existing robots.txt permits all crawlers. No bot-specific exceptions are needed to make this file permissive.
- Direct app entry points such as /?tool=merge; their canonical remains the main app. Public guides have their own canonical URLs.

## Deployment checks

1. Confirm the production hostname. The repository currently declares https://www.pdf.salaroutsourcing.com/; this is inherited configuration, not a verified deployment. Use one hostname consistently in redirects, canonicals, sitemap and social metadata.
2. Serve the complete static release from the domain root over HTTPS. Ensure .mjs files use a JavaScript MIME type. Keep unknown URLs as real 404 responses instead of returning the home page for every request.
3. Verify every sitemap URL returns 200 and readable HTML without JavaScript. Confirm /vendor/, /manifest.json, /sw.js and icon paths return the expected content type.
4. Check any CDN, firewall or bot-protection rules. robots.txt alone cannot override a firewall. Allow verified search crawlers rather than disabling all protections.
5. Verify site ownership in Google Search Console and Bing Webmaster Tools; submit the sitemap and inspect the public guide URLs. Check current Search Console settings governing Google generative AI inclusion.
6. Track index coverage, impressions, useful visits and completed tool workflows. Do not send document contents, filenames or OCR text into analytics. Obtain any required consent before adding tracking.

## Editorial work after launch

Publish original tutorials based on real output tests: scanned receipts, supplier documents, joining monthly reports and safe redaction. Show examples with synthetic documents that contain no private information. Keep limitations visible. Add a verified business contact and genuine operator information; never fabricate certifications, offices, customers, reviews or “recommended by ChatGPT” badges.

Interview pilot offices and publish case studies only with permission and supporting evidence. Build relevant links through useful documentation, community contributions and legitimate directories, not purchased citation promises or mass-produced near-duplicate pages.

AI systems choose their own sources. Search visibility and recommendations must be measured over time; robots directives and structured data provide eligibility and clarity, not an endorsement.

## Official sources checked

- [Google AI features and websites](https://developers.google.com/search/docs/appearance/ai-features)
- [Google guidance for generative AI search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots): OAI-SearchBot is the search crawler; control of training crawlers is a separate decision.
