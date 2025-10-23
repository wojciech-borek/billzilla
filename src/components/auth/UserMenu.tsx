import { memo } from "react";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/lib/hooks";
import type { AuthUserWithProfile } from "@/types";

interface UserMenuProps {
  user: AuthUserWithProfile;
}

function getInitials(fullName: string | null, email: string): string {
  // Jeśli jest full_name, użyj inicjałów
  if (fullName && fullName.trim()) {
    const names = fullName.trim().split(" ");
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  // Fallback: pierwsza litera emaila
  return email.charAt(0).toUpperCase();
}

export const UserMenu = memo(function UserMenu({ user }: UserMenuProps) {
  const initials = getInitials(user.full_name, user.email);
  const { logout, isLoggingOut } = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-primary/20"
          aria-label="Menu użytkownika"
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name || "Avatar użytkownika"}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold text-base aspect-square">
              {initials}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold text-foreground leading-none">{user.full_name || "Użytkownik"}</p>
            <p className="text-xs text-gray-600 leading-none">{user.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          disabled={isLoggingOut}
          onSelect={(e) => {
            e.preventDefault();
            logout();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
