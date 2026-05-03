import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function searchMech9ForKit(query: string): Promise<string | null> {
  const url = `https://www.mech9.com/search?q=${encodeURIComponent(query)}&max-results=5`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(/href='(https:\/\/www\.mech9\.com\/\d{4}\/\d{2}\/[^']+\.html)'/);
  return match ? match[1] : null;
}

async function fetchPaintGuideText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) return "";
  const html = await res.text();
  // Strip script/style blocks then HTML tags
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Keep first 8000 chars — enough for a full paint guide
  return stripped.slice(0, 8000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { kit_name, kit_code } = await req.json();
    const query = [kit_name, kit_code].filter(Boolean).join(" ");
    if (!query) {
      return Response.json({ error: "kit_name or kit_code required" }, { status: 400 });
    }

    // Try to fetch a real paint guide from mech9.com
    const pageUrl = await searchMech9ForKit(query);
    const paintGuideText = pageUrl ? await fetchPaintGuideText(pageUrl) : "";

    let prompt: string;
    if (paintGuideText) {
      prompt = `You are an expert Gunpla painter helping to extract colour information.

The user is building: "${query}"

Below is the paint guide sourced from mech9.com (${pageUrl}):

---
${paintGuideText}
---

Extract ALL paint colours from this guide. For each colour provide:
- colour_name: descriptive name including which part it applies to (e.g. "White (Body Armor)", "Dark Green (Frame)")
- hex: your best hex estimate for the colour, or null if uncertain
- notes: paint codes/brands and mix ratios exactly as listed (e.g. "H1 White 80% + H22 Gray 20%", "Tamiya XF-1")

Also include source_notes describing where this data came from (the mech9.com page URL and kit name).

Respond ONLY with valid JSON:
{
  "colours": [
    { "colour_name": string, "hex": string | null, "notes": string | null }
  ],
  "source_notes": string
}`;
    } else {
      prompt = `You are an expert Gunpla modeller and painter.

The user is building: "${query}"

Note: No paint guide was found on mech9.com for this kit. Use your training knowledge of Bandai paint guides for this kit.

For each colour provide:
- colour_name: descriptive name including which part (e.g. "White (Body Armor)")
- hex: your best hex estimate, or null if uncertain
- notes: any paint codes or mix notes you know

Also include source_notes stating this came from general knowledge as no mech9.com page was found.

Respond ONLY with valid JSON:
{
  "colours": [
    { "colour_name": string, "hex": string | null, "notes": string | null }
  ],
  "source_notes": string
}`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: `OpenAI error: ${err}` }, { status: 502 });
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    return Response.json(content, { headers: CORS_HEADERS });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
