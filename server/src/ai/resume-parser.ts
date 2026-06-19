import { z } from "zod";
import { generateGeminiAssistantReply } from "./provider";
import type { AssistantMessage } from "./schemas";

// Schema for parsed resume data
export const parsedResumeSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experience: z
    .array(
      z.object({
        title: z.string().optional(),
        company: z.string().optional(),
        duration: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        degree: z.string().optional(),
        institution: z.string().optional(),
        year: z.string().optional(),
        details: z.string().optional(),
      })
    )
    .default([]),
  certifications: z.array(z.string()).default([]),
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;

/**
 * Generate a prompt for Gemini to parse resume text into structured data
 */
function generateResumeParsePrompt(resumeText: string): string {
  return `You are a resume parsing assistant. Extract structured information from the following resume text and return ONLY a valid JSON object (no markdown, no code blocks, no extra text).

Resume Text:
---
${resumeText}
---

Extract and return ONLY this JSON structure (fill with actual data or null if not found):
{
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "headline": "string or null",
  "summary": "string or null",
  "skills": ["array of skill strings"],
  "experience": [
    {
      "title": "string or null",
      "company": "string or null",
      "duration": "string or null",
      "description": "string or null"
    }
  ],
  "education": [
    {
      "degree": "string or null",
      "institution": "string or null",
      "year": "string or null",
      "details": "string or null"
    }
  ],
  "certifications": ["array of certification strings"]
}

Return ONLY the JSON object, nothing else.`;
}

/**
 * Parse extracted resume text with Gemini AI and return structured data
 * @param resumeText - Raw text extracted from resume
 * @returns Promise<ParsedResume> - Structured resume data
 */
export async function parseResumeWithAI(
  resumeText: string
): Promise<ParsedResume> {
  if (!resumeText || resumeText.trim().length === 0) {
    throw new Error("Cannot parse empty resume text");
  }

  const prompt = generateResumeParsePrompt(resumeText);

  const messages: AssistantMessage[] = [
    {
      role: "user",
      text: prompt,
    },
  ];

  try {
    const response = await generateGeminiAssistantReply(messages);

    // Try to parse JSON response
    let parsed: unknown;
    try {
      // Remove markdown code blocks if present
      const jsonStr = response
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      throw new Error(
        `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }

    // Validate against schema
    const validated = parsedResumeSchema.parse(parsed);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Resume parsing validation failed: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
}
