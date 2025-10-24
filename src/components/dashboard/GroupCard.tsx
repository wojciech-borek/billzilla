import { Button } from "@/components/ui/button";
import { formatCurrency, getBalanceColor } from "@/lib/utils";
import AvatarList from "./AvatarList";
import type { GroupCardVM } from "./types";

interface GroupCardProps {
  group: GroupCardVM;
  onOpen?: (id: string) => void;
  onAddExpense?: (id: string) => void;
}

/**
 * Group card component
 * Displays group information with balance, members, and quick actions
 * Prefetches group data on hover for faster navigation
 */
export default function GroupCard({ group, onAddExpense }: GroupCardProps) {
  const handleCardClick = () => {
    window.location.href = `/groups/${group.id}`;
  };

  const handleAddExpense = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onAddExpense?.(group.id);
  };

  const handleMouseEnter = () => {
    // Prefetch group detail page data
    fetch(`/api/groups/${group.id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {
      // Silently fail - prefetch is optional optimization
    });
  };

  const balanceColor = getBalanceColor(group.myBalance);

  return (
    <article
      className="group relative flex cursor-pointer flex-col rounded-2xl border border-gray-100 bg-card p-6 shadow-md shadow-green-100/50 transition-all duration-300 ease-out hover:border-primary hover:shadow-lg hover:shadow-green-100 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Otwórz grupę ${group.name}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-lg font-bold tracking-tight text-foreground">{group.name}</h3>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground">Twoje saldo</p>
        <p className={`text-2xl font-bold ${balanceColor}`}>
          {formatCurrency(group.myBalance, group.baseCurrencyCode)}
        </p>
      </div>

      {/* Members avatars */}
      <div className="mb-4">
        <AvatarList avatars={group.avatars} maxVisible={5} />
      </div>

      {/* Quick action button */}
      <div className="mt-auto pt-2">
        <Button
          onClick={handleAddExpense}
          variant="outline"
          size="sm"
          className="w-full"
          aria-label={`Dodaj wydatek do grupy ${group.name}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Dodaj wydatek
        </Button>
      </div>
    </article>
  );
}
