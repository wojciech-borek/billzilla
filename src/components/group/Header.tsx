import React from "react";
import { ArrowLeft, UserMinus, Crown, Edit2 } from "lucide-react";
import type { GroupRole } from "@/types";

export interface HeaderProps {
  groupName: string;
  groupId: string;
  userId: string;
  userRole: GroupRole;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ groupName, groupId: _groupId, userId: _userId, userRole, onBack }) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Default behavior - navigate to dashboard
      window.location.href = "/";
    }
  };

  const handleLeaveGroup = () => {
    // TODO: Implement leave group functionality
  };

  const handleArchiveGroup = () => {
    // TODO: Implement archive group functionality
  };

  const handleEditGroupName = () => {
    // TODO: Implement edit group name functionality
  };

  const isCreator = userRole === "creator";

  return (
    <header className="sticky top-16 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
              onClick={handleArchiveGroup}
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:scale-105 h-10 w-10"
              aria-label="Archiwizuj grupę"
            >
              <Crown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
