
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { topic, language = "English", model = "sonar" } = await req.json();
    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityApiKey) {
      return new Response(
        JSON.stringify({ error: "Perplexity API key is required" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    const prompt = `
You are an expert yoga content writer for a platform called "Yogapatha" that connects clients with certified yoga trainers at their preferred location (home, park, studio, or online) across India.

Write a detailed, SEO-friendly blog post in ${language}.

Topic: ${topic}

Instructions:
- Use Markdown or HTML formatting.
- Start with a short, engaging introduction.
- Use headings and subheadings (H2/H3).
- Include bullet points or numbered lists where helpful.
- Highlight important words using **bold** or *italic*.
- Keep paragraphs short (2–4 lines each).
- End with a friendly call-to-action like:
  “Book a certified yoga trainer near you with Yogapatha and start your journey to wellness today.”
- Length: 700–900 words.
- Focus keywords: yoga trainer near me, home yoga classes, Yogapatha, personal yoga coach, yoga for beginners.
`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "You are a helpful writing assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();
    const blogText =
      data?.choices?.[0]?.message?.content ||
      "Sorry, the AI could not generate the blog content. Please try again later.";

    return new Response(JSON.stringify({ blogContent: blogText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
