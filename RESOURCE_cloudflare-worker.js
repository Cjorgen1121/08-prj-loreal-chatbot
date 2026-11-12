// Deploy this file as a Cloudflare Worker.
// In Worker Settings > Variables and Secrets, add OPENAI_API_KEY as a secret.
// Never paste the key into this file or into script.js.

const SYSTEM_PROMPT =
  "You are a warm, practical L’Oréal beauty advisor. Answer only questions about L’Oréal " +
  "products, makeup, skincare, haircare, fragrance, beauty routines, and recommendations. " +
  "Use previous turns to remember details the user volunteered, including their name, preferences, " +
  "and past questions; use their name sparingly. Answer directly in 2–4 short sentences or a brief " +
  "routine. Ask one focused follow-up only when needed. Avoid hype, filler, emojis, and repeating " +
  "the question. For unrelated requests, politely say you can help with L’Oréal beauty topics " +
  "and invite a related question; do not answer the unrelated request. Never invent product names, " +
  "ingredients, claims, prices, availability, links, or videos. If a detail is uncertain, say so " +
  "and refer to the verified official L’Oréal Paris link beside the chat. Do not give medical advice. " +
  "Write plain text with short paragraphs.";

export default {
  async fetch(request, env) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };
    const reply = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers });

    // Browsers ask permission with OPTIONS before sending JSON.
    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method !== "POST") return reply({ error: "Use POST to chat." }, 405);
    if (!env.OPENAI_API_KEY) return reply({ error: "The Worker is missing its API key secret." }, 500);

    let body;
    try {
      body = await request.json();
    } catch {
      return reply({ error: "Send a JSON request body." }, 400);
    }

    // Accept only conversation messages. The browser cannot replace our system prompt.
    const messages = Array.isArray(body.messages)
      ? body.messages.filter((message) =>
          message && ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string" &&
          message.content.trim().length > 0 &&
          message.content.length <= 2000
        ).slice(-21)
      : [];

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return reply({ error: "Add a user question to messages." }, 400);
    }

    try {
      const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + env.OPENAI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4o",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          max_completion_tokens: 500,
        }),
      });
      if (!openAIResponse.ok) {
        const upstreamError = await openAIResponse.json().catch(() => null);
        const upstreamCode = typeof upstreamError?.error?.code === "string"
          ? upstreamError.error.code
          : "unknown_error";
        return reply({
          error: `The AI service could not answer right now (HTTP ${openAIResponse.status}, ${upstreamCode}).`,
        }, 502);
      }
      return reply(await openAIResponse.json());
    } catch {
      return reply({ error: "The AI service could not be reached." }, 502);
    }
  },
};
