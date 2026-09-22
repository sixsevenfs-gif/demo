/**
 * AI Assistant Engine for DWA Lead Command Center
 * Features:
 * 1. Screenshot Information Extraction (Vision / OCR)
 * 2. Call Note Cleanup (Hinglish/Shorthand to Professional CRM Notes)
 * 3. Lead Interaction Summary
 * 4. Lead Operational Insights
 */

export interface ExtractedLeadData {
  businessName: string;
  category: string;
  rating: number;
  reviews: number;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  hours: string;
  website: string;
  notes?: string;
}

function getGeminiApiKeys(): string[] {
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_BACKUP];

  for (let index = 2; ; index += 1) {
    const key = process.env[`GEMINI_API_KEY_${index}`];
    if (!key) break;
    keys.push(key);
  }

  return keys.filter((key): key is string => Boolean(key?.trim()));
}

async function generateGeminiContent(body: object): Promise<Response> {
  const apiKeys = getGeminiApiKeys();
  if (apiKeys.length === 0) throw new Error("AI_IMPORT_NOT_CONFIGURED");

  let lastResponse: Response | null = null;
  for (const apiKey of apiKeys) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      },
    );

    if (response.ok) return response;
    lastResponse = response;
    if (![401, 403, 429].includes(response.status)) return response;
  }

  return lastResponse!;
}

export async function extractBusinessFromScreenshot(
  base64Image: string,
  filename?: string,
): Promise<ExtractedLeadData> {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const response = await generateGeminiContent({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this Google Maps or business screenshot. Extract all visible business information into a single JSON object.
Do NOT invent information. If a field is not visible, use null.
Return ONLY valid JSON matching this schema:
{
  "businessName": string,
  "category": string,
  "rating": number (e.g. 5.0),
  "reviews": number (e.g. 26),
  "phone": string (e.g. "06901301315" or "+91..."),
  "address": string,
  "city": string,
  "state": string,
  "pincode": string,
  "hours": string,
  "website": string
}`,
                },
                {
                  inline_data: {
                    mime_type: "image/png",
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
        });

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            businessName: parsed.businessName || "",
            category: parsed.category || "",
            rating: Number.isFinite(Number(parsed.rating))
              ? Number(parsed.rating)
              : 0,
            reviews: Number.isFinite(Number(parsed.reviews))
              ? Number(parsed.reviews)
              : 0,
            phone: parsed.phone || "",
            address: parsed.address || "",
            city: parsed.city || "",
            state: parsed.state || "",
            pincode: parsed.pincode || "",
            hours: parsed.hours || "",
            website: parsed.website || "",
          };
        }
      }
    } else if (response.status === 429) {
      throw new Error("AI_RATE_LIMITED");
    } else if (response.status === 401 || response.status === 403) {
      throw new Error("AI_KEY_REJECTED");
    }
  } catch (error) {
    if (
      error instanceof Error &&
      ["AI_RATE_LIMITED", "AI_KEY_REJECTED"].includes(error.message)
    )
      throw error;
    throw new Error("AI_EXTRACTION_FAILED");
  }
  throw new Error("AI_EXTRACTION_FAILED");
}

export async function cleanupCallNotes(roughNotes: string): Promise<string> {
  if (!roughNotes || roughNotes.trim().length === 0) return "";

  if (getGeminiApiKeys().length > 0) {
    try {
      const response = await generateGeminiContent({
            contents: [
              {
                parts: [
                  {
                    text: `You are an executive sales assistant for DUDE Web Agency.
Convert this informal sales call note (which may contain Hinglish, shorthand, or rough notes) into clean, professional, concise CRM notes.
Keep all factual details (dates, times, requests, objections, prices). Do NOT invent facts.
Return ONLY the cleaned note.

Original Note: "${roughNotes}"`,
                  },
                ],
              },
            ],
          });

      if (response.ok) {
        const data = await response.json();
        const clean = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (clean) return clean.replace(/^"|"$/g, "");
      }
    } catch {
      // Fallback
    }
  }

  // Do not manufacture CRM facts when the provider is unavailable. The caller can
  // still save the exact note they entered and retry AI cleanup later.
  return roughNotes.trim();
}

export function generateLeadSummary(lead: {
  businessName: string;
  category: string;
  calls?: Array<{
    outcome: string;
    notes?: string | null;
    callDate: Date | string;
  }>;
}): string {
  const calls = lead.calls || [];
  if (calls.length === 0) {
    return `Fresh lead: ${lead.businessName} (${lead.category}). No outreach calls recorded yet.`;
  }

  const outcomes = calls.map((c) => c.outcome).join(", ");
  const lastCall = calls[calls.length - 1];
  const lastNote = lastCall.notes || "No notes entered";

  return `Contacted ${calls.length} time(s). Recent outcomes: ${outcomes}. Latest interaction: "${lastNote}".`;
}

export function getLeadOperationalInsight(lead: {
  status: string;
  priority: string;
  lastCallOutcome?: string | null;
  nextFollowUpDate?: Date | string | null;
  isDoNotCall?: boolean;
}): { badge: string; action: string } {
  if (lead.isDoNotCall || lead.status === "DO_NOT_CALL") {
    return {
      badge: "Do Not Call",
      action:
        "Lead is on the Do Not Call register. Outreach strictly prohibited.",
    };
  }

  if (lead.status === "INTERESTED" || lead.status === "MEETING_SCHEDULED") {
    return {
      badge: "High Conversion Potential",
      action:
        "Prepare custom agency portfolio and proposal. Ensure callback or meeting is honored promptly.",
    };
  }

  if (lead.status === "CALLBACK_REQUESTED" || lead.nextFollowUpDate) {
    return {
      badge: "Pending Callback",
      action:
        "Review previous call notes and initiate prompt follow-up at scheduled time.",
    };
  }

  if (lead.status === "NEW" || lead.status === "UNASSIGNED") {
    return {
      badge: "Fresh Opportunity",
      action: "Assign to calling executive and initiate first discovery call.",
    };
  }

  return {
    badge: "Active Pipeline",
    action: "Continue sales nurturing sequence as scheduled.",
  };
}
