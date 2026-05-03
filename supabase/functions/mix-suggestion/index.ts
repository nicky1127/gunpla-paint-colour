import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { target_colour_name, target_hex, owned_paints } = await req.json();

    const inventoryList = owned_paints.length > 0
      ? owned_paints.map((p: any) =>
          `- ${p.brand} ${p.code ?? ""} "${p.name}"${p.hex ? ` (hex: ${p.hex})` : ""}`
        ).join("\n")
      : "(empty — no paints in inventory)";

    const prompt = `You are an expert Gunpla paint mixing advisor.

Target colour: "${target_colour_name}"${target_hex ? ` (hex: ${target_hex})` : ""}

User's current paint inventory:
${inventoryList}

Your task:
1. FIRST, try to suggest a mixing recipe using ONLY paints from the user's inventory to achieve the target colour.
   - Provide mixing ratios in percentages (must add up to 100%).
   - If the inventory is empty or no close match is possible, set "using_owned" to null.

2. THEN, suggest specific paints to BUY that would perfectly match or closely approximate this colour.
   - Choose from major brands: Mr. Hobby, Tamiya, Vallejo, AK Interactive, GSI Creos.
   - If a single paint is a direct match, ratio_percent can be 100.
   - If a mix is needed, provide ratios.

3. Add a "notes" field with any useful tips (surface preparation, thinning ratio, finish type, etc.)

Respond ONLY with valid JSON:
{
  "using_owned": [
    { "paint_id": string, "brand": string, "code": string | null, "name": string, "hex": string | null, "ratio_percent": number }
  ] | null,
  "buy_suggestion": [
    { "brand": string, "code": string, "name": string, "hex": string | null, "ratio_percent": number }
  ] | null,
  "notes": string
}

Where paint_id matches the "id" field from the owned paints list. If using owned paints, copy the id exactly.`;

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

    return Response.json(content, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
