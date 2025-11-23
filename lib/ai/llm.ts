type LLMProvider = "openai" | "anthropic";

interface AskOptions {
  provider?: LLMProvider;
  model?: string;
  system?: string;
}

/**
 * Minimal fetch-based helper for server-side LLM calls.
 * Returns the raw text; caller is responsible for parsing JSON.
 */
export async function askLLM(prompt: string, options: AskOptions = {}): Promise<string | null> {
  const provider: LLMProvider = options.provider || "openai";

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || "gpt-4o-mini",
        input: prompt,
        max_output_tokens: 800,
        system: options.system,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.output_text || data.output?.[0]?.content?.[0]?.text || null;
  }

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options.model || "claude-3-5-sonnet-20240620",
        max_tokens: 800,
        system: options.system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.content?.[0]?.text;
    return content || null;
  }

  return null;
}
