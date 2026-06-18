import type { AssistantMessage } from "./schemas";

export class AiServiceError extends Error {
  statusCode: number;
  responseBody: Record<string, unknown>;

  constructor(statusCode: number, responseBody: Record<string, unknown>) {
    super(String(responseBody.message || responseBody.error || "AI service failed"));
    this.name = "AiServiceError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

function toGeminiContents(messages: AssistantMessage[]) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.text }],
  }));
}

function extractGeminiReply(data: unknown): string {
  const parts = (data as any)?.candidates?.[0]?.content?.parts;
  return Array.isArray(parts)
    ? parts
        .map((part: any) => part?.text)
        .filter(Boolean)
        .join("")
    : "";
}

export async function generateGeminiAssistantReply(messages: AssistantMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiServiceError(500, {
      error: "GEMINI_API_KEY is not set",
      message: "Missing Gemini API key",
    });
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const maxAttempts = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: toGeminiContents(messages),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // If it's a 5xx or 429 error, it might be transient. We can retry.
        if (response.status >= 500 || response.status === 429) {
          const errText = await response.text().catch(() => "");
          throw new Error(`Transient HTTP error ${response.status}: ${errText}`);
        }
        
        const errText = await response.text().catch(() => "");
        throw new AiServiceError(502, {
          error: "Upstream Gemini error",
          status: response.status,
          message: errText || "Gemini request failed",
        });
      }

      const data = await response.json();
      const reply = extractGeminiReply(data);

      if (!reply) {
        throw new AiServiceError(502, {
          error: "No reply generated",
          message: "Gemini returned an empty response",
        });
      }

      return reply;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      // If it's an abort error (timeout), log it specifically
      const errorMsg = error.name === "AbortError" ? "Request timed out (15s)" : (error.message || String(error));
      console.warn(`[AI Provider] Attempt ${attempt} failed: ${errorMsg}`);

      // If it's an AiServiceError that is not transient (e.g. 500 with no API key, or invalid schema validation), don't retry
      if (error instanceof AiServiceError && error.statusCode !== 502) {
        throw error;
      }

      if (attempt < maxAttempts) {
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // If we exhausted all retries
  if (lastError instanceof AiServiceError) {
    throw lastError;
  }
  throw new AiServiceError(504, {
    error: "Gemini request timed out or failed after multiple retries",
    message: lastError?.message || "Timeout or transient error",
  });
}

