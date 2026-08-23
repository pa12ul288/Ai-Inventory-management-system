import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { DashboardKpis, InventoryRecord } from "./types";
import { formatInr } from "./format";

function finalY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

export function downloadPdfReport(records: InventoryRecord[], kpis: DashboardKpis) {
  const doc = new jsPDF();
  const generatedAt = new Date().toLocaleString("en-IN");

  doc.setFontSize(16);
  doc.text("MedStock AI — Inventory Report", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated ${generatedAt}`, 14, 24);

  autoTable(doc, {
    startY: 30,
    head: [["Metric", "Value"]],
    body: [
      ["Total inventory value", formatInr(kpis.totalInventoryValue)],
      ["Total SKUs", String(kpis.totalSkus)],
      ["Available stock (units)", String(kpis.availableStock)],
      ["Low stock items", String(kpis.lowStockCount)],
      ["Out-of-stock items", String(kpis.outOfStockCount)],
      ["Near-expiry batches (≤90 days)", `${kpis.nearExpiryCount}, ${formatInr(kpis.nearExpiryValue)} at risk`],
      ["Expired batches", `${kpis.expiredCount}, ${formatInr(kpis.expiredValue)} written off`],
    ],
    theme: "grid",
    headStyles: { fillColor: [15, 118, 110] },
  });

  const outOfStock = records.filter((r) => r.stockStatus === "out_of_stock");
  const lowStock = records.filter((r) => r.stockStatus === "low_stock");

  let y = finalY(doc) + 10;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Out of Stock / Low Stock — needs reorder", 14, y);
  autoTable(doc, {
    startY: y + 4,
    head: [["Product", "Batch", "Warehouse", "Available", "Reorder Point", "Status"]],
    body: [...outOfStock, ...lowStock].map((r) => [
      r.productName,
      r.batchNumber,
      r.warehouseName,
      String(r.availableQty),
      String(r.reorderPoint),
      r.stockStatus === "out_of_stock" ? "Out of Stock" : "Low Stock",
    ]),
    theme: "striped",
    headStyles: { fillColor: [185, 28, 28] },
  });

  const expiring = records
    .filter((r) => r.expiryStatus !== "healthy" && r.expiryStatus !== "unknown")
    .sort((a, b) => (a.daysToExpiry ?? Infinity) - (b.daysToExpiry ?? Infinity));

  if (expiring.length > 0) {
    y = finalY(doc) + 10;
    doc.setFontSize(12);
    doc.text("Expiry Watch — expired or expiring within 90 days (FEFO order)", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Product", "Batch", "Warehouse", "Expiry Date", "Days Left", "Qty", "Value at Risk"]],
      body: expiring.map((r) => [
        r.productName,
        r.batchNumber,
        r.warehouseName,
        r.expiryDate ?? "—",
        r.daysToExpiry !== null ? String(r.daysToExpiry) : "—",
        String(r.availableQty),
        formatInr(r.value),
      ]),
      theme: "striped",
      headStyles: { fillColor: [180, 83, 9] },
    });
  }

  doc.save(`inventory-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
