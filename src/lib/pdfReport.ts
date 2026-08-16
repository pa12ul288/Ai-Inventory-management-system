import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { ClassifiedInventoryRow, DashboardKpis } from "./types";
import { formatInr } from "./format";

export function downloadPdfReport(rows: ClassifiedInventoryRow[], kpis: DashboardKpis) {
  const doc = new jsPDF();
  const generatedAt = new Date().toLocaleString("en-IN");

  doc.setFontSize(16);
  doc.text("AI Inventory Management System — Report", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated ${generatedAt}`, 14, 24);

  autoTable(doc, {
    startY: 30,
    head: [["Metric", "Value"]],
    body: [
      ["Total inventory value", formatInr(kpis.totalInventoryValue)],
      ["Slow / dead stock value", formatInr(kpis.slowDeadStockValue)],
      ["Products to reorder", String(kpis.productsToReorder)],
      ["Capital you can free up", formatInr(kpis.capitalToFreeUp)],
    ],
    theme: "grid",
    headStyles: { fillColor: [15, 118, 110] },
  });

  const sellOff = rows.filter((r) => r.classification === "Sell off");
  const keepReorder = rows.filter((r) => r.classification === "Keep & Reorder");

  const afterKpiY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Sell Off — clear this stock", 14, afterKpiY);
  autoTable(doc, {
    startY: afterKpiY + 4,
    head: [["Product", "Days Unsold", "Value Locked"]],
    body: sellOff.map((r) => [r.productName, r.daysInStock ?? "—", formatInr(r.value)]),
    theme: "striped",
    headStyles: { fillColor: [185, 28, 28] },
  });

  const afterSellOffY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.text("Keep & Reorder — place a purchase order", 14, afterSellOffY);
  autoTable(doc, {
    startY: afterSellOffY + 4,
    head: [["Product", "Days to Sell Out"]],
    body: keepReorder.map((r) => [r.productName, r.daysOnHand !== null ? r.daysOnHand.toFixed(1) : "—"]),
    theme: "striped",
    headStyles: { fillColor: [21, 128, 61] },
  });

  doc.save(`adwce-inventory-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
