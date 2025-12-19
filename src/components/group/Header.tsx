"use client";

import React, { useCallback, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArrowLeft, UserMinus, Archive, Edit2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useArchiveGroup } from "@/lib/hooks";
import type { GroupRole } from "@/types";

// Create a singleton QueryClient for Header
let headerQueryClient: QueryClient | undefined;

const getHeaderQueryClient = () => {
  if (typeof window === "undefined") {
    return new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30 * 1000, gcTime: 5 * 60 * 1000 },
        mutations: { retry: false },
      },
    });
  }

  if (!headerQueryClient) {
    headerQueryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30 * 1000, gcTime: 5 * 60 * 1000 },
        mutations: { retry: false },
      },
    });
  }

  return headerQueryClient;
};

export interface HeaderProps {
  groupName: string;
  groupId: string;
  userId: string;
  userRole: GroupRole;
  onBack?: () => void;
  onGroupArchived?: () => void;
}

const HeaderContent: React.FC<HeaderProps> = ({ groupName, groupId, userRole, onBack, onGroupArchived }) => {
  const [isArchiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const archiveGroupMutation = useArchiveGroup();

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }
    window.location.href = "/";
  }, [onBack]);

  const handleLeaveGroup = () => {
    // Feature tracked in pending-features.md #1: Opuszczanie Grupy
  };

  const handleOpenArchiveDialog = useCallback(() => {
    setArchiveDialogOpen(true);
  }, []);

  const handleCloseArchiveDialog = useCallback(() => {
    if (archiveGroupMutation.isPending) {
      return;
    }
    setArchiveDialogOpen(false);
  }, [archiveGroupMutation.isPending]);

  const handleConfirmArchive = useCallback(async () => {
    try {
      await archiveGroupMutation.mutateAsync(groupId);
      setArchiveDialogOpen(false);
      onGroupArchived?.();
      window.location.href = "/";
    } catch {
      // Keep dialog open so the user can retry or cancel
    }
  }, [archiveGroupMutation, groupId, onGroupArchived]);

  const handleEditGroupName = () => {
    // Feature tracked in pending-features.md #2: Edycja Nazwy Grupy
  };

  const isCreator = userRole === "creator";

  return (
    <header className="sticky top-16 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <ConfirmationDialog
        isOpen={isArchiveDialogOpen}
        onClose={handleCloseArchiveDialog}
        onConfirm={handleConfirmArchive}
        title="Archiwizuj grupę"
        description={`Czy na pewno chcesz zarchiwizować grupę '${groupName}'? Zarchiwizowana grupa nie będzie widoczna na liście, ale historia wydatków pozostanie zadokumentowana.`}
        confirmText="Archiwizuj"
        cancelText="Anuluj"
        variant="destructive"
        isLoading={archiveGroupMutation.isPending}
      />

      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
            aria-label="Powrót do pulpitu"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót
          </button>

          {/* Group Name */}
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground truncate">{groupName}</h1>
            {isCreator && (
              <button
                onClick={handleEditGroupName}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8"
                aria-label="Edytuj nazwę grupy"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Group Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLeaveGroup}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:scale-105 h-10 w-10"
            aria-label="Opuść grupę"
          >
            <UserMinus className="w-4 h-4" />
          </button>

          {isCreator && (
            <button
              onClick={handleOpenArchiveDialog}
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:scale-105 h-10 w-10"
              aria-label="Archiwizuj grupę"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

// Main exported component wrapped in QueryClientProvider
export const Header: React.FC<HeaderProps> = (props) => {
  const queryClient = getHeaderQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <HeaderContent {...props} />
    </QueryClientProvider>
  );
};
