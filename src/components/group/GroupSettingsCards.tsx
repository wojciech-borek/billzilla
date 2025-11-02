import React from "react";
import { Users, DollarSign, Mail, Plus, Crown, Clock, Edit2, Trash2 } from "lucide-react";
import type { GroupMemberDTO, PendingInvitationDTO, GroupRole } from "@/types";

export interface GroupSettingsCardsProps {
  groupId: string;
  userId: string;
  userRole: GroupRole;
}

// TODO: Replace with actual data fetching
const mockMembers: GroupMemberDTO[] = [];
const mockPendingInvitations: PendingInvitationDTO[] = [];
const mockBaseCurrencyCode = "PLN";

export const GroupSettingsCards: React.FC<GroupSettingsCardsProps> = ({
  groupId: _groupId,
  userId: _userId,
  userRole,
}) => {
  const handleInviteMembers = () => {
    // TODO: Implement invite members
  };

  const handleAddCurrency = () => {
    // TODO: Implement add currency
  };

  const handleEditMember = (_member: GroupMemberDTO) => {
    // TODO: Implement edit member
  };

  const handleRemoveMember = (_member: GroupMemberDTO) => {
    // TODO: Implement remove member
  };

  return (
    <div className="space-y-6">
      {/* Members Card */}
      <div className="bg-card rounded-2xl p-6 border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Członkowie</h2>
          </div>
          <button
            onClick={handleInviteMembers}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 h-10 w-10 shadow-sm"
            aria-label="Zaproś nowych członków"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Pending Invitations */}
        {mockPendingInvitations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Oczekujące zaproszenia
            </h3>
            <div className="space-y-3">
              {mockPendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between rounded-xl border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 border-amber-200 dark:border-amber-800/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">{invitation.email}</span>
                      <div className="text-xs text-muted-foreground">
                        Wysłano {new Date(invitation.created_at).toLocaleDateString("pl-PL")}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-3 py-1 rounded-full">
                    Oczekuje
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Members */}
        <div className="space-y-3">
          {mockMembers.length === 0 ? (
            <div className="text-center py-8">
              <div className="rounded-full bg-muted p-3 mb-3 mx-auto w-fit">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-3">Brak członków w grupie</p>
              <button
                onClick={handleInviteMembers}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 h-10 w-10 shadow-sm"
                aria-label="Zaproś pierwszego członka"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            mockMembers.map((member) => (
              <div
                key={member.profile_id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {member.full_name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{member.full_name || member.email}</span>
                      {member.role === "creator" && <Crown className="h-4 w-4 text-primary" />}
                      {member.status === "inactive" && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Nieaktywny
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Dołączono {new Date(member.joined_at).toLocaleDateString("pl-PL")}
                    </div>
                  </div>
                </div>

                {/* Actions for group creator */}
                {userRole === "creator" && member.role !== "creator" && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditMember(member)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8"
                      aria-label="Edytuj członka"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      aria-label="Usuń członka"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Currency Management Card */}
      <div className="bg-card rounded-2xl p-6 border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Waluty</h2>
          </div>
          <button
            onClick={handleAddCurrency}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:scale-105 h-10 w-10 shadow-sm"
            aria-label="Dodaj walutę"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-foreground mb-2">Waluta bazowa</div>
            <span className="text-muted-foreground">{mockBaseCurrencyCode}</span>
          </div>

          <div>
            <div className="text-sm font-medium text-foreground mb-2">Dodatkowe waluty</div>
            <div className="text-sm text-muted-foreground">Brak dodatkowych walut</div>
          </div>
        </div>
      </div>
    </div>
  );
};
