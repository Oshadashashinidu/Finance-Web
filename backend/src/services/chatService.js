function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

async function createChatCompletion(payload) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw badRequest("GROQ_API_KEY is not configured.");
  }

  const userMessage = String(payload?.message || "").trim();
  if (!userMessage) {
    throw badRequest("Message is required.");
  }

  const history = Array.isArray(payload?.history) ? payload.history : [];
  const trimmedHistory = history
    .filter((item) => item && typeof item.content === "string")
    .slice(-6)
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content
    }));

  const messages = [
    {
      role: "system",
      content:
        "You are a finance market assistant. Provide concise, practical answers about market trends, pricing, and business insights. If unsure, say so and ask a clarifying question."
    },
    ...trimmedHistory,
    { role: "user", content: userMessage }
  ];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      temperature: 0.2,
      messages
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMessage = data?.error?.message || "Failed to generate chat response.";
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  const content = data?.choices?.[0]?.message?.content || "";
  return {
    reply: content.trim()
  };
}

module.exports = {
  createChatCompletion
};
