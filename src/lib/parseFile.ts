import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ImportRow } from "./types";

export const IMPORT_FIELDS: { key: keyof ImportRow; label: string; required: boolean }[] = [
  { key: "productName", label: "Product Name", required: true },
  { key: "sku", label: "SKU", required: false },
  { key: "batchNumber", label: "Batch Number", required: false },
  { key: "warehouseName", label: "Warehouse", required: false },
  { key: "quantity", label: "Quantity", required: true },
  { key: "purchasePrice", label: "Purchase Price", required: false },
  { key: "manufacturingDate", label: "Manufacturing Date", required: false },
  { key: "expiryDate", label: "Expiry Date", required: false },
  { key: "supplierName", label: "Supplier", required: false },
  { key: "category", label: "Category", required: false },
];

const HEADER_ALIASES: Record<keyof ImportRow, string[]> = {
  productName: [
    "product name",
    "product",
    "item name",
    "item",
    "item description",
    "description",
    "medicine name",
    "medicine",
    "drug name",
    "particulars",
    "name",
    "stock item", // Tally "Stock Summary" export
  ],
  sku: ["sku", "sku code", "product code", "code", "item code"],
  batchNumber: ["batch number", "batch no", "batch", "lot number", "lot no", "lot"],
  warehouseName: ["warehouse", "warehouse name", "location", "store", "godown"],
  quantity: [
    "quantity",
    "qty",
    "quantity on hand",
    "qty on hand",
    "stock quantity",
    "stock",
    "closing stock",
    "current stock",
    "balance qty",
    "balance quantity",
    "in stock",
    "closing balance", // Tally
  ],
  purchasePrice: [
    "purchase price",
    "cost price",
    "cost price per unit",
    "cost",
    "unit cost",
    "price",
    "purchase rate",
    "rate", // Tally
  ],
  manufacturingDate: ["manufacturing date", "mfg date", "mfg", "manufacture date", "production date"],
  expiryDate: [
    "expiry date",
    "expiry",
    "exp date",
    "exp",
    "expiration date",
    "batch expiry",
    "expiry_date",
    "best before",
  ],
  supplierName: ["supplier", "supplier name", "vendor", "vendor name", "manufacturer"],
  category: ["category", "product category", "type", "drug category"],
};

// Tokens that identify the real header row in a Tally "Stock Summary"
// export, which usually leads with a company-name/report-title row (and
// sometimes a blank row) before the actual column headers.
const HEADER_ROW_HINTS = ["stock item", "particulars", "closing balance", "product name", "item name", "sku"];

// Tally appends a "Grand Total" (or similar) row at the bottom of a stock
// summary — it has a non-empty "product name" cell but isn't a product.
const SUMMARY_ROW_NAMES = new Set(["grand total", "total", "closing stock", "opening stock"]);

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .trim();
}

export type HeaderMap = Partial<Record<keyof ImportRow, string>>;

export function autoDetectHeaderMap(headers: string[]): HeaderMap {
  const normalized = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));
  const map: HeaderMap = {};

  (Object.keys(HEADER_ALIASES) as (keyof ImportRow)[]).forEach((field) => {
    const aliases = HEADER_ALIASES[field];
    const match = normalized.find((h) => aliases.includes(h.norm));
    if (match) map[field] = match.raw;
  });

  // No known alias matched a product-name column — distributor sheets
  // almost always lead with the item identifier, so fall back to the
  // first column rather than leaving it unmapped.
  if (!map.productName && headers.length > 0) {
    map.productName = headers[0];
  }

  return map;
}

// Pulls the leading numeric token out of a value, ignoring a trailing unit
// (Tally quantities/rates commonly look like "150 Nos" or "50.00/Nos").
function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const match = value.replace(/[₹,]/g, "").match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

function toDateString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + value * 86400000);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function toText(value: unknown): string {
  return String(value ?? "").trim();
}

export function mapRecordsToImportRows(records: Record<string, unknown>[], headerMap: HeaderMap): ImportRow[] {
  const rows = records.map((record) => ({
    productName: headerMap.productName ? toText(record[headerMap.productName]) : "",
    sku: headerMap.sku ? toText(record[headerMap.sku]) : "",
    batchNumber: headerMap.batchNumber ? toText(record[headerMap.batchNumber]) : "",
    warehouseName: headerMap.warehouseName ? toText(record[headerMap.warehouseName]) : "",
    quantity: headerMap.quantity ? toNumber(record[headerMap.quantity]) : 0,
    purchasePrice: headerMap.purchasePrice ? toNumber(record[headerMap.purchasePrice]) : 0,
    manufacturingDate: headerMap.manufacturingDate ? toDateString(record[headerMap.manufacturingDate]) : null,
    expiryDate: headerMap.expiryDate ? toDateString(record[headerMap.expiryDate]) : null,
    supplierName: headerMap.supplierName ? toText(record[headerMap.supplierName]) || null : null,
    category: headerMap.category ? toText(record[headerMap.category]) || null : null,
  }));

  return rows.filter((r) => r.productName && !SUMMARY_ROW_NAMES.has(r.productName.trim().toLowerCase()));
}

export interface RawParsedFile {
  headers: string[];
  records: Record<string, unknown>[];
}

export async function readFileRecords(file: File): Promise<RawParsedFile> {
  const isCsv = file.name.toLowerCase().endsWith(".csv");

  if (isCsv) {
    const text = await file.text();
    const result = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });
    return { headers: result.meta.fields ?? [], records: result.data };
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  // Read as a raw grid first rather than assuming row 1 is the header —
  // exports like Tally's "Stock Summary" lead with a company-name/report
  // title row (sometimes a blank row too) before the real column headers.
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", blankrows: false });
  const headerRowIndex = findHeaderRowIndex(grid);
  const headers = (grid[headerRowIndex] ?? []).map((h) => String(h ?? "").trim()).filter(Boolean);

  const records = grid.slice(headerRowIndex + 1).map((row) => {
    const record: Record<string, unknown> = {};
    (grid[headerRowIndex] ?? []).forEach((h, i) => {
      const key = String(h ?? "").trim();
      if (key) record[key] = row[i];
    });
    return record;
  });

  return { headers, records };
}

function findHeaderRowIndex(grid: unknown[][]): number {
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const cells = grid[i].map((c) => normalizeHeader(String(c ?? "")));
    const nonEmptyCount = cells.filter((c) => c !== "").length;
    const hasHeaderHint = cells.some((c) => HEADER_ROW_HINTS.includes(c));
    if (hasHeaderHint && nonEmptyCount >= 2) return i;
  }
  return 0;
}
