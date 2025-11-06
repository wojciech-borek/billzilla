import { useState, useEffect, useCallback } from "react";
import type { InvitationDTO } from "@/types";
import type { InvitationCardVM, InvitationsQueryState } from "../types";
import { createClient } from "@/db/supabase.client";

interface InvitationActionResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for fetching and managing invitations list
 * Maps InvitationDTO to InvitationCardVM for presentation
 */
export function useInvitationsList(): InvitationsQueryState & {
  refetch: () => Promise<void>;
  accept: (id: string) => Promise<InvitationActionResult>;
  decline: (id: string) => Promise<InvitationActionResult>;
} {
  const [state, setState] = useState<InvitationsQueryState>({
    data: [],
    loading: true,
    error: null,
  });

  const fetchInvitations = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Pobierz access token z Supabase
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/invitations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });

      if (response.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to fetch invitations: ${response.status}`);
      }

      const invitations: InvitationDTO[] = await response.json();

      // Map DTOs to ViewModels
      const invitationCards: InvitationCardVM[] = invitations.map((invitation) => ({
        id: invitation.id,
        groupId: invitation.group.id,
        groupName: invitation.group.name,
        createdAt: invitation.created_at,
      }));

      setState({
        data: invitationCards,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }));
    }
  }, []);

  const accept = useCallback(async (id: string): Promise<InvitationActionResult> => {
    try {
      // Pobierz access token z Supabase
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/invitations/${id}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return { success: false, error: "Unauthorized" };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to accept invitation: ${response.status}`);
      }

      // Remove the accepted invitation from the list
      setState((prev) => ({
        ...prev,
        data: prev.data.filter((inv) => inv.id !== id),
      }));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }, []);

  const decline = useCallback(async (id: string): Promise<InvitationActionResult> => {
    try {
      // Pobierz access token z Supabase
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/invitations/${id}/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return { success: false, error: "Unauthorized" };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to decline invitation: ${response.status}`);
      }

      // Remove the declined invitation from the list
      setState((prev) => ({
        ...prev,
        data: prev.data.filter((inv) => inv.id !== id),
      }));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    ...state,
    refetch: fetchInvitations,
    accept,
    decline,
  };
}
