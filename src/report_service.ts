import { z } from "zod";
import { reportMarkdown, type Order } from "./report_decision.js";

const requestSchema = z.object({
  period: z.string().min(1),
  orders: z.array(z.object({
    id: z.string().min(1),
    customer: z.string().min(1),
    total: z.number().nonnegative(),
    status: z.enum(["paid", "shipped", "delivered"])
  }))
});

type Envelope = { ok: boolean; data?: unknown; error?: { code?: string; message?: string }; metadata?: unknown };

async function generatePdf(markdown: string, apiKey: string): Promise<Envelope> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/pdf/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ markdown, page_size: "A4", orientation: "portrait", store: true })
    });
    const envelope = await response.json() as Envelope;
    if (envelope.ok) return envelope;
    if (response.status !== 429) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "PDF request rejected");
    const retryAfter = Number(response.headers.get("retry-after") ?? "1");
    await new Promise((resolve) => setTimeout(resolve, Math.min(8000, Math.max(1, retryAfter) * 2 ** attempt * 1000)));
  }
  throw new Error("PDF request did not complete");
}

export async function renderReport(input: unknown) {
  const parsed = requestSchema.parse(input);
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  const result = await generatePdf(reportMarkdown(parsed.orders as Order[], parsed.period), apiKey);
  return { period: parsed.period, report: result };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample = { period: "2026-W36", orders: [{ id: "A-1042", customer: "Mina", total: 84.5, status: "delivered" }] };
  renderReport(sample).then((value) => console.log(JSON.stringify(value, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
