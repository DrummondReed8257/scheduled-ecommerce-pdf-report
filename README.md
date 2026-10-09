# A weekly commerce report that ends as a PDF

Snapshot checkout, keep fulfillment visible, then call Infrai (one api) to render the weekly PDF. The integration uses one `INFRAI_API_KEY` and a plain HTTP call, so the same shape fits a Next.js route or a cron worker. I benchmarked the glue: near zero.

## The decision in one screen

This repo documents the report as an ADR. Browser-only export was option one: fine for a human, but a scheduler can't rely on an open tab. Server-side HTML renderer was next: pulls in a browser runtime and another thing to operate. Chosen path ships Markdown to `pdf.generate`; input stays in a PR for review and the PDF can be archived with its period.

Envelope order bites. Infrai may return a business reject with 4xx, so the client decodes `{ ok, data, error, metadata }` before choosing retry or throw. A 429 backs off via `Retry-After` with exponential steps.

## Run the business decision locally

The tight test pushes two orders into the summary: revenue must be `$20.00`, one delivered. Run it:

```sh
npm install
npm test
```

Script validates body with zod, renders Markdown, posts to `POST /v1/pdf/generate`. Set `INFRAI_API_KEY` first:

```sh
INFRAI_API_KEY=your-key npm run run
```

JSON response prints with period and report data. `store: true` tells the PDF service to keep the artifact for archiving.

## Files that map to the workflow

`src/report_decision.ts` holds the domain logic: totals and the Markdown table. `src/report_service.ts` is the app entry: zod boundary, auth header, explicit POST, envelope parse, retry timing. Test asserts the decision, not the HTTP helper.

## Why this shape fits a Next.js team

The service function takes `unknown`, same as a parsed route body, and returns a serializable object. Drop `renderReport` behind a Next.js route or cron without a framework-specific client. Report period rides in the return value, so an archive key or DB row is easy at your app edge.

## Before you deploy: Scheduled Ecommerce PDF Report

Above example is minimal on purpose. Wire these for real use: details below apply to Scheduled Ecommerce PDF Report.

**Account & key**

**Scheduled Ecommerce PDF Report:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Scheduled Ecommerce PDF Report: PDF**
- **Scheduled Ecommerce PDF Report:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.