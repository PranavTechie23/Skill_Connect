import { generateGeminiAssistantReply, AiServiceError } from "./provider";
import { moderationResultSchema, type ModerationResult } from "../../../shared/schema";

export async function generateModerationScan(params: {
  type: "employer" | "job" | "story" | "application";
  details: Record<string, any>;
}): Promise<ModerationResult> {
  let promptDetails = "";

  switch (params.type) {
    case "employer":
      promptDetails = `
Company Name: ${params.details.name || "N/A"}
Description: ${params.details.description || "N/A"}
Industry: ${params.details.industry || "N/A"}
Size: ${params.details.size || "N/A"}
Location: ${params.details.location || "N/A"}
Website: ${params.details.website || "N/A"}

Check for:
- Suspicious company names or descriptions (e.g., scams, MLMs)
- Inappropriate or misleading information
- Non-professional or abusive language
`;
      break;

    case "job":
      promptDetails = `
Job Title: ${params.details.title || "N/A"}
Description: ${params.details.description || "N/A"}
Requirements: ${params.details.requirements || "N/A"}
Location: ${params.details.location || "N/A"}
Salary Range: ${params.details.salaryRange || "N/A"}

Check for:
- Spam or scam job postings
- Requests for upfront payments or personal financial info
- Unclear or deceptive job descriptions
- Discriminatory language
`;
      break;

    case "story":
      promptDetails = `
Story Title: ${params.details.title || "N/A"}
Content: ${params.details.content || "N/A"}
Submitter: ${params.details.submitterName || "N/A"} (${params.details.submitterEmail || "N/A"})
Tags: ${(params.details.tags || []).join(", ") || "N/A"}

Check for:
- Overly promotional or spammy content (not a genuine success story)
- Inappropriate language or abusive content
- Irrelevant topics
`;
      break;

    case "application":
      promptDetails = `
Applicant Name: ${params.details.applicantName || "N/A"}
Job Title Applied For: ${params.details.jobTitle || "N/A"}
Cover Letter: ${params.details.coverLetter || "N/A"}
Notes: ${params.details.notes || "N/A"}

Check for:
- Spam applications
- Abusive or highly inappropriate language in the cover letter
- Bots or mass-applied generic text
`;
      break;
      
    default:
      promptDetails = JSON.stringify(params.details, null, 2);
  }

  const prompt = `
You are an expert Trust & Safety Moderator for a professional platform.
Your task is to review the following submitted ${params.type} and assess its risk level.

DETAILS:
${promptDetails}

Analyze the content and return ONLY a valid JSON object matching this exact schema. Do not include any markdown formatting (like \`\`\`json) or extra text outside the JSON block.

SCHEMA:
{
  "riskLevel": "low", // "low", "medium", or "high"
  "flags": ["Spam Keywords", "Suspicious Link"], // Array of strings detailing specific concerns. Leave empty if none.
  "reasoning": "A concise explanation for the assigned risk level and any flags.",
  "suggestedAction": "approve" // "approve", "reject", "suspend", "flag_for_review", or "none"
}
`;

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const replyText = await generateGeminiAssistantReply([
        { role: "user", text: prompt.trim() },
      ]);

      let jsonString = replyText.trim();
      if (jsonString.startsWith("```json")) {
        jsonString = jsonString.slice(7);
      }
      if (jsonString.startsWith("```")) {
        jsonString = jsonString.slice(3);
      }
      if (jsonString.endsWith("```")) {
        jsonString = jsonString.slice(0, -3);
      }

      const parsed = JSON.parse(jsonString.trim());
      const validated = moderationResultSchema.parse(parsed);
      return validated;
    } catch (error) {
      lastError = error as Error;
      console.warn(`[Moderation Scan] Attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) break;
    }
  }

  throw new AiServiceError(500, {
    error: "Failed to generate moderation scan",
    message: lastError?.message || "Unknown parsing error",
  });
}
