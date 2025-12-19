/**
 * Dialog for confirming currency deletion
 */

import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGroupCurrencies } from "./hooks/useGroupCurrencies";
import { toast } from "sonner";
import type { GroupCurrencyDTO } from "@/types";

interface DeleteCurrencyDialogProps {
  groupId: string;
  currency: GroupCurrencyDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteCurrencyDialog({ groupId, currency, isOpen, onClose }: DeleteCurrencyDialogProps) {
  const { removeCurrency } = useGroupCurrencies(groupId);

  const handleDelete = async () => {
    if (!currency) return;

    try {
      await removeCurrency.mutateAsync(currency.code);

      toast.success(`Waluta ${currency.code} została pomyślnie usunięta z grupy.`);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się usunąć waluty";

      // Check if it's a "currency in use" error
      if (errorMessage.includes("used in existing expenses") || errorMessage.includes("is used")) {
        toast.error("Ta waluta jest używana w istniejących wydatkach. Usuń najpierw wydatki w tej walucie.");
      } else {
        toast.error(errorMessage);
      }
    }
  };

  if (!currency) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Usuń walutę</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz usunąć walutę {currency.code} - {currency.name} z grupy?
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Ta operacja jest nieodwracalna. Nie będziesz mógł usunąć waluty, jeśli jest używana w istniejących
            wydatkach.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={removeCurrency.isPending}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={removeCurrency.isPending}>
            {removeCurrency.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Usuń walutę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
