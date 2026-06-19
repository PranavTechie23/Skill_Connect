import { generateGeminiAssistantReply, AiServiceError } from "./provider";
import { reviewPackSchema, type ReviewPack } from "../../../shared/schema";

export async function generateReviewPack(params: {
  candidateName: string;
  candidateProfile: any;
  resumeText?: string | null;
  jobTitle: string;
  jobDescription: string;
  jobRequirements: string;
  jobSkills: string[];
}): Promise<ReviewPack> {
  const prompt = `
You are an expert technical recruiter assistant. Your job is to help an employer screen a candidate by providing a concise, accurate, and fair "Review Pack".

JOB DETAILS:
Title: ${params.jobTitle}
Description: ${params.jobDescription}
Requirements: ${params.jobRequirements}
Required Skills: ${params.jobSkills.join(", ")}

CANDIDATE DETAILS:
Name: ${params.candidateName}
Headline: ${params.candidateProfile?.headline || "Not provided"}
Bio: ${params.candidateProfile?.bio || "Not provided"}
Skills: ${(params.candidateProfile?.skills || []).join(", ")}

${params.resumeText ? `RESUME EXCERPT:\n${params.resumeText}\n` : ""}

Analyze the candidate's fit for the job. Return ONLY a valid JSON object matching this schema exactly. Do not include any markdown formatting (like \`\`\`json) or extra text outside the JSON block.

SCHEMA:
{
  "candidateSummary": "A short paragraph (3-4 sentences) summarizing the candidate's strengths and overall fit for the role.",
  "matchedSkills": ["Skill 1", "Skill 2"],
  "missingSkills": ["Missing Skill 1", "Missing Skill 2"],
  "suggestedInterviewQuestions": ["Question 1", "Question 2", "Question 3"]
}
`;

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const replyText = await generateGeminiAssistantReply([
        { role: "user", text: prompt.trim() },
      ]);

      // Strip potential markdown code blocks if the model didn't listen
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
      
      // Validate with Zod
      const validated = reviewPackSchema.parse(parsed);
      return validated;
    } catch (error) {
      lastError = error as Error;
      console.warn(`[Review Pack Generation] Attempt ${attempt} failed:`, error);
      // If it's the last attempt, we throw
      if (attempt === maxRetries) {
        break;
      }
    }
  }

  throw new AiServiceError(500, {
    error: "Failed to generate review pack",
    message: lastError?.message || "Unknown parsing error",
  });
}
