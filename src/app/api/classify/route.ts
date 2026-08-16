import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { computeFeatures, ruleClassify } from "@/lib/classify";
import type { Classification, RawInventoryRow } from "@/lib/types";

export const runtime = "nodejs";

interface ClassifyRequestItem {
  id: string;
  row: RawInventoryRow;
}

const BATCH_SIZE = 40;

const RULES_PROMPT = `You are classifying medical distributor inventory into exactly one of three
labels, using these rules and this priority order:

1. "Sell off" — if daysInStock >= 60 (no movement for 60+ days) OR daysOnHand > 90.
2. "Keep & Reorder" — else if daysOnHand is not null and daysOnHand < 14 (will run out in under 14 days at current rate).
3. "Watch" — otherwise (slower than normal but still moving, or not enough data).

daysInStock = days since the product last sold (null if unknown).
daysOnHand = quantityOnHand / avgDailySales, i.e. days of stock remaining at the current sales rate (null if avgDailySales is 0).

Apply the rules exactly and mechanically — do not use outside judgement. A null value never
satisfies a numeric condition. Return a classification for every item, in the same order given.`;

function buildBatchPrompt(items: { id: string; daysInStock: number | null; daysOnHand: number | null }[]) {
  const table = items
    .map(
      (it) =>
        `id=${it.id} daysInStock=${it.daysInStock ?? "null"} daysOnHand=${
          it.daysOnHand !== null ? it.daysOnHand.toFixed(2) : "null"
        }`
    )
    .join("\n");
  return `${RULES_PROMPT}\n\nItems:\n${table}`;
}

async function classifyBatchWithGemini(
  ai: GoogleGenAI,
  items: { id: string; daysInStock: number | null; daysOnHand: number | null }[]
): Promise<Map<string, Classification>> {
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: buildBatchPrompt(items),
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            classification: {
              type: Type.STRING,
              enum: ["Sell off", "Watch", "Keep & Reorder"],
            },
          },
          required: ["id", "classification"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");

  const parsed: { id: string; classification: Classification }[] = JSON.parse(text);
  return new Map(parsed.map((p) => [p.id, p.classification]));
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { items: ClassifyRequestItem[] };
  const items = body.items ?? [];

  const withFeatures = items.map(({ id, row }) => ({
    id,
    row,
    features: computeFeatures(row),
  }));

  const apiKey = process.env.GEMINI_API_KEY;
  const results = new Map<string, Classification>();
  let usedFallback = false;

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    for (let i = 0; i < withFeatures.length; i += BATCH_SIZE) {
      const batch = withFeatures.slice(i, i + BATCH_SIZE);
      try {
        const batchResult = await classifyBatchWithGemini(
          ai,
          batch.map((b) => ({ id: b.id, ...b.features }))
        );
        batch.forEach((b) => {
          const label = batchResult.get(b.id);
          if (label) results.set(b.id, label);
          else results.set(b.id, ruleClassify(b.features));
        });
      } catch (err) {
        console.error("Gemini classification failed, using rule fallback:", err);
        usedFallback = true;
        batch.forEach((b) => results.set(b.id, ruleClassify(b.features)));
      }
    }
  } else {
    usedFallback = true;
    withFeatures.forEach((b) => results.set(b.id, ruleClassify(b.features)));
  }

  const responseItems = withFeatures.map((b) => ({
    id: b.id,
    daysInStock: b.features.daysInStock,
    daysOnHand: b.features.daysOnHand,
    classification: results.get(b.id) ?? ruleClassify(b.features),
  }));

  return NextResponse.json({ items: responseItems, usedFallback });
}
