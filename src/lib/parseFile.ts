import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { RawInventoryRow } from "./types";

const HEADER_ALIASES: Record<keyof RawInventoryRow, string[]> = {
  productName: [
    "product name",
    "product",
    "sku name",
    "item name",
    "item",
    "item description",
    "description",
    "medicine name",
    "medicine",
    "drug name",
    "particulars",
    "name",
  ],
  sku: ["sku", "sku code", "product code", "code", "item code"],
  quantityOnHand: [
    "quantity on hand",
    "qty on hand",
    "quantity",
    "qty",
    "stock quantity",
    "stock",
    "closing stock",
    "current stock",
    "balance qty",
    "balance quantity",
    "in stock",
  ],
  costPrice: [
    "cost price",
    "cost price per unit",
    "cost",
    "unit cost",
    "price",
    "purchase price",
    "purchase rate",
    "rate",
  ],
  lastSaleDate: [
    "last sale date",
    "last sold date",
    "last sale",
    "last sold",
    "last movement date",
    "last transaction date",
  ],
  avgDailySales: [
    "avg daily sales",
    "average daily sales",
    "daily sales",
    "avg daily sale",
    "sales velocity",
    "sales per day",
  ],
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
};

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .trim();
}

function buildHeaderMap(headers: string[]): Partial<Record<keyof RawInventoryRow, string>> {
  const normalized = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));
  const map: Partial<Record<keyof RawInventoryRow, string>> = {};

  (Object.keys(HEADER_ALIASES) as (keyof RawInventoryRow)[]).forEach((field) => {
    const aliases = HEADER_ALIASES[field];
    const match = normalized.find((h) => aliases.includes(h.norm));
    if (match) map[field] = match.raw;
  });

  return map;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/[₹,\s]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
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

function rowsFromRecords(records: Record<string, unknown>[]): {
  rows: RawInventoryRow[];
  unmapped: (keyof RawInventoryRow)[];
} {
  if (records.length === 0) return { rows: [], unmapped: [] };

  const headerMap = buildHeaderMap(Object.keys(records[0]));

  const requiredFields: (keyof RawInventoryRow)[] = [
    "productName",
    "quantityOnHand",
    "costPrice",
  ];
  const unmapped = requiredFields.filter((f) => !headerMap[f]);

  // No known alias matched a product-name column — inventory sheets almost
  // always lead with the item identifier, so fall back to the first column
  // rather than silently dropping every row for having a blank name. Still
  // flagged in `unmapped` above so the upload screen can warn about the guess.
  if (!headerMap.productName) {
    headerMap.productName = Object.keys(records[0])[0];
  }

  const rows: RawInventoryRow[] = records.map((record) => ({
    productName: headerMap.productName ? String(record[headerMap.productName] ?? "").trim() : "",
    sku: headerMap.sku ? String(record[headerMap.sku] ?? "").trim() : "",
    quantityOnHand: headerMap.quantityOnHand ? toNumber(record[headerMap.quantityOnHand]) : 0,
    costPrice: headerMap.costPrice ? toNumber(record[headerMap.costPrice]) : 0,
    lastSaleDate: headerMap.lastSaleDate ? toDateString(record[headerMap.lastSaleDate]) : null,
    avgDailySales: headerMap.avgDailySales ? toNumber(record[headerMap.avgDailySales]) : 0,
    expiryDate: headerMap.expiryDate ? toDateString(record[headerMap.expiryDate]) : null,
  }));

  return { rows: rows.filter((r) => r.productName), unmapped };
}

export async function parseInventoryFile(
  file: File
): Promise<{ rows: RawInventoryRow[]; unmapped: (keyof RawInventoryRow)[] }> {
  const isCsv = file.name.toLowerCase().endsWith(".csv");

  if (isCsv) {
    const text = await file.text();
    const result = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });
    return rowsFromRecords(result.data);
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return rowsFromRecords(records);
}
