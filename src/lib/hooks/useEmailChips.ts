import { useState, useCallback } from "react";
import type { KeyboardEvent } from "react";
import { z } from "zod";

/**
 * Zod schema for individual email validation in the email chips hook
 * Uses the same validation logic as the group form schema
 */
const emailValidationSchema = z
  .string()
  .email("Nieprawidłowy adres e-mail")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Nieprawidłowy format adresu e-mail")
  .trim()
  .toLowerCase();

export interface UseEmailChipsOptions {
  maxEmails?: number;
}

export interface UseEmailChipsReturn {
  inputValue: string;
  inputError: string | null;
  addEmail: (email: string, currentEmails: string[], onChange: (emails: string[]) => void) => void;
  removeEmail: (emailToRemove: string, currentEmails: string[], onChange: (emails: string[]) => void) => void;
  handleKeyDown: (
    e: KeyboardEvent<HTMLInputElement>,
    currentEmails: string[],
    onChange: (emails: string[]) => void
  ) => void;
  handleBlur: (currentEmails: string[], onChange: (emails: string[]) => void) => void;
  setInputValue: (value: string) => void;
  setInputError: (error: string | null) => void;
}

export function useEmailChips(options: UseEmailChipsOptions = {}): UseEmailChipsReturn {
  const { maxEmails = 20 } = options;

  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const addEmail = useCallback(
    (email: string, currentEmails: string[], onChange: (emails: string[]) => void) => {
      // Clear any previous input error
      setInputError(null);

      // Validate email format using Zod
      const validationResult = emailValidationSchema.safeParse(email);

      if (!validationResult.success) {
        const errorMessage = validationResult.error.issues[0]?.message || "Nieprawidłowy adres e-mail";
        setInputError(errorMessage);
        return;
      }

      const validatedEmail = validationResult.data;

      // Check for duplicates
      if (currentEmails.includes(validatedEmail)) {
        setInputError("Ten adres e-mail został już dodany");
        return;
      }

      // Check max limit
      if (currentEmails.length >= maxEmails) {
        setInputError(`Możesz zaprosić maksymalnie ${maxEmails} osób`);
        return;
      }

      // Add email
      onChange([...currentEmails, validatedEmail]);
      setInputValue("");
    },
    [maxEmails]
  );

  const removeEmail = useCallback(
    (emailToRemove: string, currentEmails: string[], onChange: (emails: string[]) => void) => {
      onChange(currentEmails.filter((email) => email !== emailToRemove));
    },
    []
  );

  const handleKeyDown = useCallback(
    (
      e: KeyboardEvent<HTMLInputElement>,
      currentEmails: string[],
      onChange: (emails: string[]) => void
    ) => {
      // Add email on Enter, comma, or semicolon
      if (e.key === "Enter" || e.key === "," || e.key === ";") {
        e.preventDefault();
        if (inputValue.trim()) {
          addEmail(inputValue, currentEmails, onChange);
        }
      }

      // Remove last email on Backspace when input is empty
      if (e.key === "Backspace" && !inputValue && currentEmails.length > 0) {
        onChange(currentEmails.slice(0, -1));
      }
    },
    [inputValue, addEmail]
  );

  const handleBlur = useCallback(
    (currentEmails: string[], onChange: (emails: string[]) => void) => {
      // Add email on blur if there's a value
      if (inputValue.trim()) {
        addEmail(inputValue, currentEmails, onChange);
      }
    },
    [inputValue, addEmail]
  );

  return {
    inputValue,
    inputError,
    addEmail,
    removeEmail,
    handleKeyDown,
    handleBlur,
    setInputValue,
    setInputError,
  };
}
