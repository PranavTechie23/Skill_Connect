import { AiServiceError } from "./provider";

/**
 * Generate a 768-dimensional float vector embedding for the given text using Gemini
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiServiceError(500, {
      error: "GEMINI_API_KEY is not set",
      message: "Missing Gemini API key",
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${encodeURIComponent(apiKey)}`;
  
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
          model: "models/gemini-embedding-001",
          content: {
            parts: [{ text: text.trim() }],
          },
          outputDimensionality: 768
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status >= 500 || response.status === 429) {
          const errText = await response.text().catch(() => "");
          throw new Error(`Transient HTTP error ${response.status}: ${errText}`);
        }
        const errText = await response.text().catch(() => "");
        throw new AiServiceError(502, {
          error: "Upstream Gemini embedding error",
          status: response.status,
          message: errText || "Gemini embedding request failed",
        });
      }

      const data = await response.json();
      const embeddingValues = (data as any)?.embedding?.values;

      if (!Array.isArray(embeddingValues) || embeddingValues.length === 0) {
        throw new AiServiceError(502, {
          error: "No embedding generated",
          message: "Gemini returned empty or invalid embedding format",
        });
      }

      return embeddingValues;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      const errorMsg = error.name === "AbortError" ? "Request timed out (15s)" : (error.message || String(error));
      console.warn(`[AI Embeddings] Attempt ${attempt} failed: ${errorMsg}`);

      if (error instanceof AiServiceError && error.statusCode !== 502) {
        throw error;
      }

      if (attempt < maxAttempts) {
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  if (lastError instanceof AiServiceError) {
    throw lastError;
  }
  throw new AiServiceError(504, {
    error: "Gemini embedding request timed out or failed after multiple retries",
    message: lastError?.message || "Timeout or transient error",
  });
}

/**
 * Perform high-performance JS-side cosine similarity calculation for two float vectors
 */
export function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Format a job data structure into a standardized text string for vectorization
 */
export function buildJobEmbeddingText(job: {
  title: string;
  description: string;
  requirements?: string | null;
  skills: string[];
}): string {
  const requirementsText = job.requirements ? `Requirements: ${job.requirements}` : "";
  const skillsText = job.skills && job.skills.length > 0 ? `Skills: ${job.skills.join(", ")}` : "";
  return `Job Title: ${job.title}\nDescription: ${job.description}\n${requirementsText}\n${skillsText}`.trim();
}

/**
 * Format a professional profile structure into a standardized text string for vectorization
 */
export function buildProfileEmbeddingText(profile: {
  headline?: string | null;
  bio?: string | null;
  skills: string[];
}): string {
  const headlineText = profile.headline ? `Headline: ${profile.headline}` : "";
  const bioText = profile.bio ? `Bio: ${profile.bio}` : "";
  const skillsText = profile.skills && profile.skills.length > 0 ? `Skills: ${profile.skills.join(", ")}` : "";
  return `${headlineText}\n${bioText}\n${skillsText}`.trim();
}
