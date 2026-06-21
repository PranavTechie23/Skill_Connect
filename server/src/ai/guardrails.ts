import type { AssistantMessage } from "./schemas";
import { checkBias, checkHallucination } from "./evaluation";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES = 16;

function normalizeAssistantRole(value: unknown): AssistantMessage["role"] {
  return value === "assistant" ? "assistant" : "user";
}

export function normalizeAssistantMessages(messages: unknown[]): AssistantMessage[] {
  return messages
    .filter((message): message is { role?: unknown; text: string } => {
      return Boolean(
        message &&
          typeof message === "object" &&
          "text" in message &&
          typeof (message as { text?: unknown }).text === "string",
      );
    })
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: normalizeAssistantRole(message.role),
      text: message.text.slice(0, MAX_MESSAGE_LENGTH),
    }));
}

export async function validateJobDescription(text: string): Promise<{ isValid: boolean; error?: string; suggestedEdits?: string[] }> {
  const biasCheck = await checkBias(text, "job_description");
  if (biasCheck.isBiased) {
    return { isValid: false, error: biasCheck.reasoning, suggestedEdits: biasCheck.suggestedEdits };
  }
  return { isValid: true };
}

export async function validateCandidateScreening(text: string, context: string): Promise<{ isValid: boolean; error?: string; suggestedEdits?: string[] }> {
  const hallucinationCheck = await checkHallucination(context, text);
  if (hallucinationCheck.isHallucinated) {
    return { isValid: false, error: "Hallucination detected: " + hallucinationCheck.reasoning };
  }

  const biasCheck = await checkBias(text, "screening_evaluation");
  if (biasCheck.isBiased) {
    return { isValid: false, error: "Bias detected: " + biasCheck.reasoning, suggestedEdits: biasCheck.suggestedEdits };
  }
  
  return { isValid: true };
}
