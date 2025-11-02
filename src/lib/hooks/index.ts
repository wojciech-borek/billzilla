/**
 * Centralized exports for all custom React hooks
 *
 * This file provides a single entry point for importing hooks,
 * improving code organization and making imports cleaner.
 */

// Voice transcription hooks
export { useAudioRecorder } from "./useAudioRecorder";
export { useVoiceTranscription } from "./useVoiceTranscription";
export { useTranscriptionPolling } from "./useTranscriptionPolling";
export { useTranscriptionErrorHandler } from "./useTranscriptionErrorHandler";

// Expense hooks
export { useExpense } from "./useExpense";
export { useExpenseForm } from "./useExpenseForm";
export { useDeleteExpense } from "./useDeleteExpense";

// Group management hooks
export { useCreateGroupMutation } from "./useCreateGroupMutation";
export { useCreateGroupFormLogic } from "./useCreateGroupFormLogic";
export { useGroupDetails } from "./useGroupDetails";

// Utility hooks
export { useCurrenciesList } from "./useCurrenciesList";

// Authentication hooks
export { useAuthForm } from "./useAuthForm";
export { useLoginForm } from "./useLoginForm";
export { usePasswordResetForm } from "./usePasswordResetForm";
export { useSetNewPasswordForm } from "./useSetNewPasswordForm";
export { useSignup } from "./useSignup";
export { useSupabaseAuth } from "./useSupabaseAuth";
export { useLogout } from "./useLogout";
export { usePasswordReset } from "./usePasswordReset";
export { useSetNewPassword } from "./useSetNewPassword";
