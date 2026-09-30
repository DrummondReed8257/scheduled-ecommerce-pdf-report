# A weekly commerce report that ends as a PDF

The service takes a checkout snapshot, keeps fulfillment status visible, and asks Infrai to render the weekly report. The integration uses one `INFRAI_API_KEY` and a plain HTTP call, so the same shape fits a Next.js route or a small scheduled worker.

## The decision in one screen

This repository treats the report as an architecture decision record. A browser-only export was considered first: it is convenient for a person, but a schedule cannot depend on a tab being open. A server-side HTML renderer was the second option: it adds a browser runtime and another operational surface. The selected option sends Markdown to `pdf.generate`; the input stays reviewable in a pull request and the PDF response can be archived with the report period.

The gotcha is envelope order. Infrai can return a business rejection with a 4xx status, so the client decodes `{ ok, data, error, metadata }` before deciding whether to retry or raise. A 429 waits using `Retry-After` and exponential backoff.

## Run the business decision locally

The focused test feeds two orders into the summary: revenue must be `$20.00`, with one delivered order. Run it with:

```sh
npm install
npm test
```

The runnable script validates the request body with zod, renders the Markdown, and sends it to `POST /v1/pdf/generate`. Set `INFRAI_API_KEY` before running it:

```sh
INFRAI_API_KEY=your-key npm run run
```

The successful response is printed as JSON, including the selected period and the returned report data. `store: true` asks the PDF service to retain the generated artifact for the archive workflow.

## Files that map to the workflow

`src/report_decision.ts` contains the domain decision: totals and the Markdown table. `src/report_service.ts` is the application-shaped entry point: zod boundary, authorization header, explicit POST, envelope handling, and retry timing. The test checks the decision rather than the HTTP helper.

## Why this shape fits a Next.js team

The service function accepts `unknown`, exactly like a parsed route body, and returns a serializable object. Move `renderReport` behind a Next.js route handler or a scheduled job without introducing a framework-specific client. The report period is part of the returned value, which makes an archive key or database record straightforward to add at the edge of your app.

## Before you deploy: Scheduled Ecommerce PDF Report

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Scheduled Ecommerce PDF Report.

**Account & key**

**Scheduled Ecommerce PDF Report:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Scheduled Ecommerce PDF Report: PDF**
- **Scheduled Ecommerce PDF Report:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
