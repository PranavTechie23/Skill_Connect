import { buildSkillConnectAssistantMessages } from "./assistant-context";
import { normalizeAssistantMessages } from "./guardrails";
import { generateGeminiAssistantReply } from "./provider";
import { assistantChatRequestSchema } from "./schemas";
import { storage } from "../storage";

export async function createAssistantReply(body: unknown, userId?: string | null): Promise<string> {
  const parsed = assistantChatRequestSchema.safeParse(body ?? {});
  if (!parsed.success) {
    const error = new Error("Expected { messages: [...] }") as Error & {
      statusCode: number;
      responseBody: Record<string, unknown>;
    };
    error.statusCode = 400;
    error.responseBody = {
      error: "Invalid request",
      message: "Expected { messages: [...] }",
    };
    throw error;
  }

  const messages = normalizeAssistantMessages(parsed.data.messages);
  
  // 1. Fetch user data and application status if userId is provided
  let contextPrefix = "";
  if (userId) {
    try {
      const user = await storage.getUser(userId);
      if (user) {
        const typeRaw = (user as any).userType || (user as any).user_type || "";
        const firstName = user.firstName || (user as any).first_name || "";
        const lastName = user.lastName || (user as any).last_name || "";
        contextPrefix += `User Information:\n- Name: ${firstName} ${lastName}\n- Role: ${typeRaw}\n- Location: ${user.location || "Not specified"}\n\n`;
        
        // Fetch recent applications for Professional users
        const userTypeLower = String(typeRaw).toLowerCase();
        if (userTypeLower === "professional" || userTypeLower === "job_seeker" || userTypeLower === "job-seeker") {
          const apps = await storage.getApplicationsWithDetailsByApplicant(userId).catch(() => []);
          if (apps && apps.length > 0) {
            contextPrefix += `Recent Applications:\n`;
            for (const app of apps) {
              const jobTitle = app.job?.title || "Unknown Job";
              const companyName = app.company?.name || "Unknown Company";
              const status = app.status || "applied";
              const appliedAt = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "unknown";
              contextPrefix += `- Job: "${jobTitle}" at "${companyName}", Status: "${status}", Applied On: ${appliedAt}\n`;
            }
            contextPrefix += `\n`;
          } else {
            contextPrefix += `Recent Applications: None.\n\n`;
          }
        }
      }
    } catch (dbErr) {
      console.error("[Assistant Service] Error fetching user context for chatbot:", dbErr);
    }
  }

  // 2. Perform regex-based escalation check on user's last message
  const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
  if (lastUserMessage && lastUserMessage.text) {
    const isEscalation = /(escalate|human support|contact admin|representative|customer support)/i.test(lastUserMessage.text);
    if (isEscalation && userId) {
      // Trigger escalation in the background
      setImmediate(async () => {
        try {
          const user = await storage.getUser(userId);
          if (!user) return;
          const allUsers = await storage.getAllUsers();
          const admins = allUsers.filter((u: any) => String(u.userType || u.user_type || "").toLowerCase() === "admin");
          
          // Get the last 3 messages as excerpt
          const recentMsgs = messages.slice(-3).map(m => `${m.role}: ${m.text}`).join("\n");
          
          const firstName = user.firstName || (user as any).first_name || "";
          const lastName = user.lastName || (user as any).last_name || "";
          
          await Promise.all(admins.map(async (admin) => {
            await storage.createNotification({
              userId: admin.id,
              type: "support_escalation",
              title: "Support Escalation Request",
              body: `User ${firstName} ${lastName} (${user.email}) has requested support escalation regarding their account or application.`,
              metadata: {
                userId,
                email: user.email,
                conversationExcerpt: recentMsgs
              }
            });
          }));
          console.log(`[Assistant Service] Escalation created for ${admins.length} admins.`);
        } catch (escErr) {
          console.error("[Assistant Service] Error during escalation process:", escErr);
        }
      });
    }
  }

  // Build the context messages
  const systemMessages = buildSkillConnectAssistantMessages(messages);
  if (contextPrefix) {
    // Prepend user details to the system context message or inject it
    if (systemMessages.length > 0 && systemMessages[0].role === "user") {
      systemMessages[0].text = contextPrefix + systemMessages[0].text;
    }
  }

  return generateGeminiAssistantReply(systemMessages);
}
