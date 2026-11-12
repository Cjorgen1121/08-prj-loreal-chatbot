// Deploy this file as a Cloudflare Worker.
// In Worker Settings > Variables and Secrets, add OPENAI_API_KEY as a secret.
// Never paste the key into this file or into script.js.

const SYSTEM_PROMPT =
  "You are a friendly L’Oréal beauty advisor. Answer only questions about L’Oréal " +
  "products, makeup, skincare, haircare, fragrance, and beauty routines. " +
  "For unrelated questions, politely say you can only help with L’Oréal beauty topics. " +
  "Ask a short follow-up question when details such as skin or hair type are needed. " +
  "Do not invent product facts, prices, availability, medical claims, links, or video URLs. For current details, refer users to the official L’Oréal Paris link beside the chat. Keep replies concise.";

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
          ["user", "assistant"].includes(message.role) &&
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
      if (!openAIResponse.ok) return reply({ error: "The AI service could not answer right now." }, 502);
      return reply(await openAIResponse.json());
    } catch {
      return reply({ error: "The AI service could not be reached." }, 502);
    }
  },
};
