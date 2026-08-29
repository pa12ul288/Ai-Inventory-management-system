import { NextResponse } from "next/server";

export interface BriefingInput {
  companyName: string | null;
  totalInventoryValue: number;
  capitalAtRisk: number;
  outOfStockCount: number;
  lowStockCount: number;
  nearExpiryCount: number;
  nearExpiryValue: number;
  expiredCount: number;
  expiredValue: number;
  overdueReceivablesCount: number;
  overdueReceivablesValue: number;
}

const GEMINI_MODEL = "gemini-3.6-flash";

function buildPrompt(d: BriefingInput): string {
  return `You are writing a short daily briefing for the owner of ${d.companyName ?? "a medical/pharmaceutical distribution business"}. Use the numbers below — do not invent any numbers not given here. Write 2-4 sentences, plain English, no markdown, no bullet points, direct and specific (name the biggest risk first). Indian rupee amounts should use the ₹ symbol and lakh/crore style where natural (e.g. ₹4.2L).

Data (all real, computed from their actual inventory and receivables):
- Total inventory value: ₹${d.totalInventoryValue}
- Out of stock: ${d.outOfStockCount} products
- Low stock (at/below reorder point): ${d.lowStockCount} products
- Already expired: ${d.expiredCount} batches, worth ₹${d.expiredValue}
- Expiring within 90 days: ${d.nearExpiryCount} batches, worth ₹${d.nearExpiryValue}
- Overdue customer payments: ${d.overdueReceivablesCount} invoices, worth ₹${d.overdueReceivablesValue}
- Total capital at risk (expired + expiring + overdue): ₹${d.capitalAtRisk}

Use the figures exactly as given — do not recompute or round them. If every number is zero or healthy, say so briefly and positively — don't invent a problem. Do not add a greeting or sign-off, just the briefing itself.`;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI briefing isn't configured on this deployment." }, { status: 503 });
  }

  let input: BriefingInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(input) }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2400,
            thinkingConfig: { thinkingLevel: "low" },
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", res.status, errText);
      return NextResponse.json({ error: "Couldn't reach the AI briefing service right now." }, { status: 502 });
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text as string | undefined;
    if (!text) {
      return NextResponse.json({ error: "AI briefing came back empty." }, { status: 502 });
    }
    if (candidate?.finishReason === "MAX_TOKENS") {
      console.error("Gemini briefing truncated (MAX_TOKENS):", text);
      return NextResponse.json({ error: "AI briefing was cut off — try refreshing." }, { status: 502 });
    }

    return NextResponse.json({ briefing: text.trim() });
  } catch (err) {
    console.error("Failed to generate briefing:", err);
    return NextResponse.json({ error: "Couldn't reach the AI briefing service right now." }, { status: 502 });
  }
}
