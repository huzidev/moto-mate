import { env } from "./env";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chat(messages: ChatMessage[], opts?: { model?: string; temperature?: number }) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts?.model ?? env.OPENROUTER_MODEL,
      temperature: opts?.temperature ?? 0.2,
      messages,
    }),
  });

  if (!res.ok) throw new Error(`openrouter ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: { message: ChatMessage }[] };
  return data.choices[0]?.message.content ?? "";
}
