import { useState, useCallback } from 'react';
import type { CreateGroupCommand, CreateGroupResponseDTO } from '../../types';
import type { CreateGroupFormValues } from '../schemas/groupSchemas';

type MutationState = {
  isLoading: boolean;
  error: Error | null;
  fieldErrors: Record<string, string> | null;
};

type UseCreateGroupMutationResult = MutationState & {
  createGroup: (values: CreateGroupFormValues) => Promise<CreateGroupResponseDTO>;
  reset: () => void;
};

/**
 * Hook for creating a new group
 * Handles API call, loading state, and error mapping
 */
export function useCreateGroupMutation(): UseCreateGroupMutationResult {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
    fieldErrors: null,
  });

  const createGroup = useCallback(async (values: CreateGroupFormValues): Promise<CreateGroupResponseDTO> => {
    setState({ isLoading: true, error: null, fieldErrors: null });

    try {
      // Prepare request body according to CreateGroupCommand
      const command: CreateGroupCommand = {
        name: values.name.trim(),
        base_currency_code: values.base_currency_code,
        invite_emails: values.invite_emails && values.invite_emails.length > 0 
          ? values.invite_emails.map(email => email.trim().toLowerCase())
          : undefined,
      };

      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        // Handle different error status codes
        if (response.status === 401) {
          throw new Error('Nie jesteś zalogowany. Zaloguj się ponownie.');
        }

        if (response.status === 400 || response.status === 422) {
          const errorData = await response.json();
          
          // Map field errors from API response
          if (errorData.error?.details) {
            setState({ 
              isLoading: false, 
              error: new Error(errorData.error.message || 'Błąd walidacji'),
              fieldErrors: errorData.error.details 
            });
            throw new Error(errorData.error.message || 'Błąd walidacji');
          }
          
          throw new Error(errorData.error?.message || 'Nieprawidłowe dane formularza');
        }

        if (response.status === 500) {
          throw new Error('Wystąpił błąd serwera. Spróbuj ponownie później.');
        }

        throw new Error('Nie udało się utworzyć grupy');
      }

      const data: CreateGroupResponseDTO = await response.json();
      
      setState({ isLoading: false, error: null, fieldErrors: null });
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Nieznany błąd');
      
      setState(prev => ({ 
        ...prev,
        isLoading: false, 
        error 
      }));
      
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, fieldErrors: null });
  }, []);

  return {
    ...state,
    createGroup,
    reset,
  };
}

