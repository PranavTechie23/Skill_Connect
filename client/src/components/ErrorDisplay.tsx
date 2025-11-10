import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorDisplay({ 
  title = "Something went wrong", 
  message, 
  onRetry,
  retryLabel = "Try Again"
}: ErrorDisplayProps) {
  return (
    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-red-900 dark:text-red-100">{title}</CardTitle>
        </div>
        <CardDescription className="text-red-700 dark:text-red-300">{message}</CardDescription>
      </CardHeader>
      {onRetry && (
        <CardContent>
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {retryLabel}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

