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
    const { kit_name, kit_code } = await req.json();

    const query = [kit_name, kit_code].filter(Boolean).join(" ");
    if (!query) {
      return Response.json({ error: "kit_name or kit_code required" }, { status: 400 });
    }

    const prompt = `You are an expert Gunpla modeller and painter.

The user is building: "${query}"

Your task:
1. Identify the official Bandai paint guide colours for this Gunpla kit.
2. Search your knowledge for the painting manual for this kit — common sources include Bandai instructions, Dalong.net, or hobbyist community guides.
3. Return the list of all colours required to paint this kit.

For each colour, provide:
- colour_name: the official name or descriptive name (e.g. "White (Body)", "Blue (Frame)", "Dark Grey (Joints)")
- hex: your best estimate of the hex colour code (e.g. "#F0F0F0"), or null if uncertain
- notes: any painting notes (e.g. "mix of C-62 + C-1", "metallic finish", which part it applies to)

Also provide source_notes: a brief description of where this colour information comes from.

Respond ONLY with valid JSON matching this schema:
{
  "colours": [
    { "colour_name": string, "hex": string | null, "notes": string | null }
  ],
  "source_notes": string
}`;

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
        temperature: 0.3,
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
