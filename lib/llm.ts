import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./prompts";

// ---------------------------------------------------------------------------
// LLM provider abstraction.
// Drop either ANTHROPIC_API_KEY or OPENAI_API_KEY into .env.local.
// Anthropic is preferred when both are present (better prose voice).
// ---------------------------------------------------------------------------

export type Provider = "anthropic" | "openai";

export function pickProvider(): Provider | null {
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim())
    return "anthropic";
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim())
    return "openai";
  return null;
}

// Models are sensible defaults; override per env if desired.
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

export async function generateWithSystem(
  system: string,
  userMessage: string,
  maxTokens = 2000,
): Promise<string> {
  const provider = pickProvider();
  if (!provider) {
    throw new Error(
      "No LLM API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env.local",
    );
  }

  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const res = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = res.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("Anthropic returned no text content");
    }
    return block.text;
  }

  // OpenAI
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const res = await client.chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: userMessage },
    ],
  });
  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned no content");
  return text;
}

export async function generateJSON(userMessage: string): Promise<string> {
  return generateWithSystem(SYSTEM_PROMPT, userMessage);
}

// ---------------------------------------------------------------------------
// Free-form chat (no JSON enforcement). Used by the Questions panel.
// ---------------------------------------------------------------------------

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function chatWithSystem(
  system: string,
  messages: ChatTurn[],
  maxTokens = 1024,
): Promise<string> {
  const provider = pickProvider();
  if (!provider) {
    throw new Error(
      "No LLM API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env.local",
    );
  }

  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const res = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const block = res.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("Anthropic returned no text content");
    }
    return block.text;
  }

  // OpenAI — plain chat, no response_format.
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const res = await client.chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });
  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned no content");
  return text;
}

// ---------------------------------------------------------------------------
// Parse + validate. Tolerate stray markdown fences just in case.
// ---------------------------------------------------------------------------

export type GeneratedLayer = {
  title: string;
  layerLabel: string;
  paragraphs: string[];
  quiz: unknown[];
};

export function parseLayerJSON(raw: string): GeneratedLayer {
  let text = raw.trim();
  // Strip markdown fences if the model slipped them in.
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  // Extract the outermost JSON object if there's leading/trailing prose.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start > 0 || end < text.length - 1) {
    if (start >= 0 && end > start) text = text.slice(start, end + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(`Model did not return valid JSON: ${(e as Error).message}`);
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as { title?: unknown }).title !== "string" ||
    typeof (parsed as { layerLabel?: unknown }).layerLabel !== "string" ||
    !Array.isArray((parsed as { paragraphs?: unknown }).paragraphs) ||
    !Array.isArray((parsed as { quiz?: unknown }).quiz)
  ) {
    throw new Error("Model output missing required fields");
  }

  return parsed as GeneratedLayer;
}
