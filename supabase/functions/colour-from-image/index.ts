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
    const { image_base64, mode, tap_coords } = await req.json();
    if (!image_base64) {
      return Response.json({ error: "image_base64 required" }, { status: 400 });
    }

    let instruction = "";
    if (mode === "dominant") {
      instruction = "Identify the single most dominant/prominent colour in this image. Return exactly 1 colour.";
    } else if (mode === "palette") {
      instruction = "Extract a palette of the 5 most distinct and visually significant colours in this image. Return up to 5 colours.";
    } else if (mode === "tap" && tap_coords) {
      const { x, y, imageWidth, imageHeight } = tap_coords;
      const xPct = Math.round((x / imageWidth) * 100);
      const yPct = Math.round((y / imageHeight) * 100);
      instruction = `The user tapped at approximately ${xPct}% from left, ${yPct}% from top of this image. Sample the colour at that specific region and return exactly 1 colour.`;
    } else {
      instruction = "Identify the single most dominant colour in this image. Return exactly 1 colour.";
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
                text: `You are a colour expert.

${instruction}

For each colour, provide:
- hex: the hex colour code (e.g. "#5A7A9C")
- name: a descriptive name for this colour (e.g. "Steel Blue", "Dark Olive Green", "Warm Off-White")

Respond ONLY with valid JSON:
{
  "colours": [
    { "hex": string, "name": string }
  ]
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
        temperature: 0.2,
        max_tokens: 400,
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
