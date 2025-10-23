import { memo } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/lib/hooks";

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline";
  className?: string;
  showIcon?: boolean;
}

export const LogoutButton = memo(function LogoutButton({
  variant = "ghost",
  className = "",
  showIcon = true,
}: LogoutButtonProps) {
  const { logout, isLoggingOut } = useLogout();

  return (
    <Button variant={variant} className={className} onClick={logout} disabled={isLoggingOut} aria-label="Wyloguj się">
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
    </Button>
  );
});
