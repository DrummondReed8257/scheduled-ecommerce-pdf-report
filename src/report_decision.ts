export type Order = {
  id: string;
  customer: string;
  total: number;
  status: "paid" | "shipped" | "delivered";
};

export function summarizeOrders(orders: Order[]) {
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const delivered = orders.filter((order) => order.status === "delivered").length;
  return { orderCount: orders.length, revenue: Number(revenue.toFixed(2)), delivered };
}

export function reportMarkdown(orders: Order[], period: string): string {
  const summary = summarizeOrders(orders);
  const rows = orders.map((order) => `| ${order.id} | ${order.customer} | ${order.status} | $${order.total.toFixed(2)} |`).join("\n");
  return `# Commerce report: ${period}\n\nOrders: ${summary.orderCount}  \nRevenue: $${summary.revenue.toFixed(2)}  \nDelivered: ${summary.delivered}\n\n| Order | Customer | Status | Total |\n| --- | --- | --- | --- |\n${rows}`;
}
