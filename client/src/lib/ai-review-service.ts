import { apiRequest } from "./queryClient";
import type { ReviewPack } from "../../../shared/schema";

/**
 * Fetches an AI-generated Review Pack for a specific application.
 * 
 * @param applicationId The ID of the application
 * @returns A promise resolving to the generated Review Pack
 */
export async function fetchReviewPack(applicationId: string | number): Promise<ReviewPack> {
  const res = await apiRequest("GET", `/api/ai/applications/${applicationId}/review`);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch review pack");
  }

  return await res.json();
}
