import pdf from "pdf-parse";

/**
 * Extract text from a PDF buffer
 * @param pdfBuffer - Buffer containing PDF data
 * @returns Promise<string> - Extracted text from the PDF
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdf(pdfBuffer);
    // Extract text from all pages
    return (data.text || "").trim();
  } catch (error) {
    throw new Error(
      `PDF extraction failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetch and extract text from a PDF file at a URL
 * @param fileUrl - HTTP(S) URL to the PDF or text file
 * @returns Promise<string> - Extracted text content
 */
export async function extractTextFromUrl(fileUrl: string): Promise<string> {
  try {
    // Validate URL format
    new URL(fileUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(fileUrl, {
        headers: {
          "User-Agent": "SkillConnect/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "";

      // Handle PDF files
      if (contentType.includes("application/pdf") || fileUrl.endsWith(".pdf")) {
        const buffer = await response.arrayBuffer();
        return extractTextFromPDF(Buffer.from(buffer));
      }

      // Handle plain text files
      if (
        contentType.includes("text/plain") ||
        contentType.includes("text/") ||
        fileUrl.endsWith(".txt")
      ) {
        return await response.text();
      }

      throw new Error(
        `Unsupported file format: ${contentType || "unknown"}. Supported formats: PDF, TXT`
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (
        fetchError instanceof Error &&
        fetchError.name === "AbortError"
      ) {
        throw new Error("File download timeout (>30 seconds)");
      }
      throw fetchError;
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Invalid URL")) {
      throw new Error(`Invalid file URL: ${fileUrl}`);
    }
    throw error;
  }
}
