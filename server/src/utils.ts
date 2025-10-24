import { z } from "zod";

export const handleError = (res: any, error: any, defaultMessage: string) => {
  console.error('Error details:', {
    message: defaultMessage,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });

  if (error instanceof z.ZodError) {
    return res.status(400).json({ 
      message: "Validation error", 
      errors: error.issues 
    });
  }

  // Always include error message in development for debugging
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ 
      message: defaultMessage,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  res.status(500).json({ message: defaultMessage });
};