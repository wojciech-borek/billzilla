import React from "react";

interface ErrorMessageProps {
  message?: string;
  id?: string;
}

/**
 * Reusable error message component for form validation
 */
export function ErrorMessage({ message, id }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      className="text-sm text-destructive"
      role="alert"
    >
      {message}
    </p>
  );
}
