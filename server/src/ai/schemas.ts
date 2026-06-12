import { z } from "zod";

export const assistantChatRequestSchema = z.object({
  messages: z.array(z.unknown()),
});

export type AssistantChatRequest = z.infer<typeof assistantChatRequestSchema>;

export type AssistantRole = "user" | "assistant";

export interface AssistantMessage {
  role: AssistantRole;
  text: string;
}

