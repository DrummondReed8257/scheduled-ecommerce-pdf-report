import assert from "node:assert/strict";
import { reportMarkdown, summarizeOrders } from "./report_decision.js";

const orders = [
  { id: "A-1", customer: "Lee", total: 12.5, status: "paid" as const },
  { id: "A-2", customer: "Jo", total: 7.5, status: "delivered" as const }
];

assert.deepEqual(summarizeOrders(orders), { orderCount: 2, revenue: 20, delivered: 1 });
assert.match(reportMarkdown(orders, "2026-W36"), /Revenue: \$20\.00/);
assert.match(reportMarkdown(orders, "2026-W36"), /A-2.*delivered/);
console.log("report decision test passed");
