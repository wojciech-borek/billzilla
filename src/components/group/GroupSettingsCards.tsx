import React, { useState } from "react";
import { Users, DollarSign, Mail, Plus, Clock, Edit2, Trash2, Bell } from "lucide-react";
import type { GroupMemberDTO, GroupRole, GroupCurrencyDTO } from "@/types";
import { useGroupDetails } from "@/lib/hooks/useGroupDetails";
import { useGroupCurrencies } from "./currencies/hooks/useGroupCurrencies";
import { AddCurrencyDialog } from "./currencies/AddCurrencyDialog";
import { EditCurrencyDialog } from "./currencies/EditCurrencyDialog";
import { DeleteCurrencyDialog } from "./currencies/DeleteCurrencyDialog";

export interface GroupSettingsCardsProps {
  groupId: string;
  userRole: GroupRole;
}

export const GroupSettingsCards: React.FC<GroupSettingsCardsProps> = ({ groupId, userRole }) => {
  const { data: groupDetails, isLoading, error } = useGroupDetails(groupId);
  const { currencies, isLoading: isLoadingCurrencies } = useGroupCurrencies(groupId);
  const [isAddCurrencyDialogOpen, setIsAddCurrencyDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<GroupCurrencyDTO | null>(null);
  const [deletingCurrency, setDeletingCurrency] = useState<GroupCurrencyDTO | null>(null);

  const members = groupDetails?.members || [];
  const pendingInvitations = groupDetails?.pending_invitations || [];
  const baseCurrencyCode = groupDetails?.base_currency_code || "PLN";
  const isCreator = userRole === "creator";

  // Get existing currency codes for filtering
  const existingCurrencyCodes = currencies?.additional_currencies.map((c) => c.code) || [];

  const handleInviteMembers = () => {
    // Feature tracked in pending-features.md #3: Zapraszanie Uczestników
  };

  const handleAddCurrency = () => {
    setIsAddCurrencyDialogOpen(true);
  };

  const handleEditMember = (_member: GroupMemberDTO) => {
    // Feature tracked in pending-features.md #4: Edycja Uczestnika
  };

  const handleRemoveMember = (_member: GroupMemberDTO) => {
    // Feature tracked in pending-features.md #5: Usuwanie Uczestnika
  };

  const handleEditCurrency = (currency: GroupCurrencyDTO) => {
    setEditingCurrency(currency);
  };

  const handleDeleteCurrency = (currency: GroupCurrencyDTO) => {
    setDeletingCurrency(currency);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <div className="text-center py-8">
            <div className="rounded-full bg-destructive/10 p-3 mb-3 mx-auto w-fit">
              <Users className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-destructive mb-3">Nie udało się załadować danych grupy</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Wystąpił błąd podczas ładowania danych"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Members Card */}
      <div className="bg-card rounded-2xl p-4 sm:p-6 border shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">Uczestnicy</h2>
          </div>
          <button
            onClick={handleInviteMembers}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 h-10 w-10 shadow-sm flex-shrink-0"
            aria-label="Zaproś nowych uczestników"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Pending Invitations - Alert Style */}
        {pendingInvitations.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-yellow-100 rounded-lg">
                <Bell className="w-4 h-4 text-yellow-700" />
              </div>
              <h3 className="text-base font-semibold text-yellow-800">Oczekujące zaproszenia</h3>
            </div>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border-2 border-yellow-300 bg-yellow-50 p-4 shadow-sm hover:shadow-md transition-shadow"
                  role="alert"
                  aria-live="polite"
                >
                  {/* Alert indicator stripe */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-l-xl" aria-hidden="true" />

                  <div className="flex items-center gap-3 pl-2 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center ring-2 ring-yellow-300 flex-shrink-0">
                      <Mail className="h-5 w-5 text-yellow-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-yellow-900 block truncate">{invitation.email}</span>
                      <div className="flex items-center gap-2 text-xs text-yellow-700">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>Wysłano {new Date(invitation.created_at).toLocaleDateString("pl-PL")}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-yellow-800 bg-yellow-200 px-3 py-1.5 rounded-full border border-yellow-300 whitespace-nowrap flex-shrink-0 self-start sm:self-center">
                    Oczekuje
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Members */}
        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="text-center py-8">
              <div className="rounded-full bg-muted p-3 mb-3 mx-auto w-fit">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-3">Brak uczestników w grupie</p>
              <button
                onClick={handleInviteMembers}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 h-10 w-10 shadow-sm"
                aria-label="Zaproś pierwszego uczestnika"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.profile_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                      member.role === "creator"
                        ? "border-yellow-400 ring-2 ring-yellow-400/30 bg-secondary/30"
                        : "border-card bg-primary/10"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${member.role === "creator" ? "text-primary" : "text-primary"}`}
                    >
                      {member.full_name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground truncate">{member.full_name || member.email}</span>
                      {member.status === "inactive" && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground flex-shrink-0">
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
                  <div className="flex items-center gap-1 self-start sm:self-center flex-shrink-0">
                    <button
                      onClick={() => handleEditMember(member)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8"
                      aria-label="Edytuj uczestnika"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      aria-label="Usuń uczestnika"
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
      <div className="bg-card rounded-2xl p-4 sm:p-6 border shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">Waluty</h2>
          </div>
          {isCreator && (
            <button
              onClick={handleAddCurrency}
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:scale-105 h-10 w-10 shadow-sm flex-shrink-0"
              aria-label="Dodaj walutę"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {isLoadingCurrencies ? (
          <div className="space-y-3">
            <div className="h-12 bg-muted rounded animate-pulse"></div>
            <div className="h-12 bg-muted rounded animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Base Currency */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{currencies?.base_currency.code}</span>
                    <span className="text-sm text-muted-foreground">{currencies?.base_currency.name}</span>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Bazowa
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    1 {currencies?.base_currency.code} = 1.0000 {currencies?.base_currency.code}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Currencies */}
            {currencies?.additional_currencies && currencies.additional_currencies.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">Dodatkowe waluty</div>
                {currencies.additional_currencies.map((currency) => (
                  <div key={currency.code} className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{currency.code}</span>
                          <span className="text-sm text-muted-foreground">{currency.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          1 {currency.code} = {currency.exchange_rate.toFixed(4)} {baseCurrencyCode}
                        </div>
                      </div>
                      {isCreator && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEditCurrency(currency)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8"
                            aria-label="Edytuj kurs"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCurrency(currency)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                            aria-label="Usuń walutę"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Brak dodatkowych walut</div>
            )}
          </div>
        )}
      </div>

      {/* Add Currency Dialog */}
      <AddCurrencyDialog
        groupId={groupId}
        baseCurrencyCode={baseCurrencyCode}
        existingCurrencies={existingCurrencyCodes}
        isOpen={isAddCurrencyDialogOpen}
        onClose={() => setIsAddCurrencyDialogOpen(false)}
        isCreator={isCreator}
      />

      {/* Edit Currency Dialog */}
      <EditCurrencyDialog
        groupId={groupId}
        currency={editingCurrency}
        baseCurrency={baseCurrencyCode}
        isOpen={!!editingCurrency}
        onClose={() => setEditingCurrency(null)}
      />

      {/* Delete Currency Dialog */}
      <DeleteCurrencyDialog
        groupId={groupId}
        currency={deletingCurrency}
        isOpen={!!deletingCurrency}
        onClose={() => setDeletingCurrency(null)}
      />
    </div>
  );
};
