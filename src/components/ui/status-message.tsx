import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "./alert";

type StatusType = "success" | "error" | "info";

interface StatusMessageProps {
  type: StatusType;
  title?: string;
  message: string;
  className?: string;
}

export function StatusMessage({ type, title, message, className }: StatusMessageProps) {
  if (type === "success") {
    return (
      <div className={`w-full rounded-lg border border-green-200 bg-green-50 px-4 py-3 ${className || ""}`}>
        <div className="w-full">
          {title && (
            <p className="text-sm font-medium text-green-800 mb-1">
              {title}
            </p>
          )}
          <p className="text-sm text-green-700">
            {message}
          </p>
        </div>
      </div>
    );
  }

  if (type === "error") {
    return (
      <Alert variant="destructive" className={`border-red-200 bg-red-50 ${className || ""}`}>
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {message}
        </AlertDescription>
      </Alert>
    );
  }

  // info type
  return (
    <Alert className={`bg-blue-50 border-blue-200 text-blue-800 ${className || ""}`}>
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        {message}
      </AlertDescription>
    </Alert>
  );
}
