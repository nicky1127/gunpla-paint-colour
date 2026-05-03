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
    const { image_base64 } = await req.json();
    if (!image_base64) {
      return Response.json({ error: "image_base64 required" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert at identifying model paint pots.

Examine this image of a paint pot and identify:
- brand: the paint manufacturer (e.g. "Mr. Hobby", "Tamiya", "Vallejo", "AK Interactive")
- code: the paint code/number (e.g. "C-8", "XF-19", "70.950")
- name: the paint colour name (e.g. "Silver", "Sky Grey")
- hex: your best estimate of the hex colour code for this paint (e.g. "#C0C0C0"), or null if you can't determine it
- confidence: "high" if you can clearly read the label, "medium" if partially visible, "low" if guessing

Respond ONLY with valid JSON:
{
  "brand": string,
  "code": string | null,
  "name": string,
  "hex": string | null,
  "confidence": "high" | "medium" | "low"
}`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image_base64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 300,
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
