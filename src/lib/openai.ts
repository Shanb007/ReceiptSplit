import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const LineItemSchema = z.object({
  name: z.string(),
  quantity: z.number().default(1),
  unitPrice: z.number(),
  lineTotal: z.number(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('HIGH'),
  confidenceReason: z.string().nullable().default(null),
})

const ExtractionSchema = z.object({
  merchantName: z.string().nullable().default(null),
  receiptDate: z.string().nullable().default(null),
  lineItems: z.array(LineItemSchema),
  subtotal: z.number().nullable().default(null),
  tax: z.number().nullable().default(null),
  tip: z.number().nullable().default(null),
  total: z.number(),
})

export type ExtractionResult = z.infer<typeof ExtractionSchema>

const EXTRACTION_PROMPT = `Analyze this receipt image and extract all information into structured JSON.

Extract:
1. Merchant name (if visible)
2. Date (if visible, return in ISO format YYYY-MM-DD)
3. Every line item with:
   - Item name (clean up abbreviations if possible)
   - Quantity (default 1 if not shown)
   - Unit price (in dollars, e.g. 12.99)
   - Line total (in dollars)
   - Confidence: HIGH, MEDIUM, or LOW
   - Confidence reason (only if not HIGH)
4. Subtotal (before tax/tip)
5. Tax amount
6. Tip (if present, otherwise null)
7. Total

Confidence guidelines:
- HIGH: Text is clear, price is unambiguous
- MEDIUM: Slight ambiguity, abbreviations, minor uncertainty
- LOW: OCR unclear, price seems wrong, can't fully read text

Important rules:
- All monetary values should be in dollars (e.g. 12.99, not 1299)
- Do NOT include tax, tip, subtotal, or total as line items
- Do NOT include discounts or coupons as line items (subtract them from the relevant item instead)
- If quantity > 1 and you can see unit price, include both. Otherwise set quantity to 1 and unitPrice = lineTotal
- Validate: line items should roughly sum to subtotal

Return ONLY valid JSON matching this exact schema (no markdown, no code fences):
{
  "merchantName": string | null,
  "receiptDate": string | null,
  "lineItems": [
    {
      "name": string,
      "quantity": number,
      "unitPrice": number,
      "lineTotal": number,
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "confidenceReason": string | null
    }
  ],
  "subtotal": number | null,
  "tax": number | null,
  "tip": number | null,
  "total": number
}`

function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

export async function extractReceiptData(imageUrl: string): Promise<{
  raw: ExtractionResult
  receipt: {
    merchantName: string | null
    receiptDate: Date | null
    subtotal: number | null
    tax: number | null
    tip: number | null
    total: number
  }
  lineItems: {
    name: string
    quantity: number
    unitPrice: number
    lineTotal: number
    confidence: 'HIGH' | 'MEDIUM' | 'LOW'
    confidenceReason: string | null
    sortOrder: number
  }[]
}> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: EXTRACTION_PROMPT },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI returned empty response')
  }

  // Clean up response — strip markdown fences if present
  const jsonStr = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${jsonStr.slice(0, 200)}`)
  }

  const validated = ExtractionSchema.parse(parsed)

  return {
    raw: validated,
    receipt: {
      merchantName: validated.merchantName,
      receiptDate: validated.receiptDate ? new Date(validated.receiptDate) : null,
      subtotal: validated.subtotal !== null ? dollarsToCents(validated.subtotal) : null,
      tax: validated.tax !== null ? dollarsToCents(validated.tax) : null,
      tip: validated.tip !== null ? dollarsToCents(validated.tip) : null,
      total: dollarsToCents(validated.total),
    },
    lineItems: validated.lineItems.map((item, index) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: dollarsToCents(item.unitPrice),
      lineTotal: dollarsToCents(item.lineTotal),
      confidence: item.confidence,
      confidenceReason: item.confidenceReason,
      sortOrder: index,
    })),
  }
}
