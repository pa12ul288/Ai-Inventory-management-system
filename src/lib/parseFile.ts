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
  ],
  purchasePrice: [
    "purchase price",
    "cost price",
    "cost price per unit",
    "cost",
    "unit cost",
    "price",
    "purchase rate",
    "rate",
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

  return rows.filter((r) => r.productName);
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
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  return { headers, records };
}
