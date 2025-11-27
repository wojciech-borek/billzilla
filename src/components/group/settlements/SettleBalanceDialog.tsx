import { useState, useEffect, useId } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateSettlement } from "@/lib/hooks/useCreateSettlement";
import type { SettlementDTO } from "@/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SettleBalanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  baseCurrencyCode: string;
  prefillData?: {
    payerId: string;
    payeeId: string;
    amount: number;
  } | null;
  groupMembers: {
    profile_id: string;
    full_name: string | null;
  }[];
  onSettlementCreated?: (settlement: SettlementDTO) => void;
}

export function SettleBalanceDialog({
  isOpen,
  onClose,
  groupId,
  baseCurrencyCode,
  prefillData,
  groupMembers,
  onSettlementCreated,
}: SettleBalanceDialogProps) {
  const [payerId, setPayerId] = useState<string>("");
  const [payeeId, setPayeeId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  const { mutate: createSettlement, isPending } = useCreateSettlement(groupId, {
    onSuccess: (data) => {
      toast.success("Rozliczenie zostało zapisane");
      onSettlementCreated?.(data);
      onClose();
      // Reset form
      setPayerId("");
      setPayeeId("");
      setAmount("");
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
      toast.error("Błąd podczas zapisywania rozliczenia");
    },
  });

  // Update form when prefillData changes or dialog opens
  useEffect(() => {
    if (isOpen && prefillData) {
      setPayerId(prefillData.payerId);
      setPayeeId(prefillData.payeeId);
      setAmount(prefillData.amount.toString());
    }
  }, [isOpen, prefillData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!payerId || !payeeId || !amount) {
      setError("Wypełnij wszystkie pola");
      return;
    }

    if (payerId === payeeId) {
      setError("Płacący i odbiorca muszą być różnymi osobami");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Kwota musi być większa od 0");
      return;
    }

    if (prefillData && numAmount > prefillData.amount) {
      setError(`Kwota nie może przekraczać zadłużenia (${prefillData.amount} ${baseCurrencyCode})`);
      return;
    }

    createSettlement({
      payer_id: payerId,
      payee_id: payeeId,
      amount: numAmount,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Zarejestruj rozliczenie</DialogTitle>
          <DialogDescription>
            Wprowadź szczegóły spłaty długu. Transakcja zostanie zapisana w historii grupy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div id={errorId} className="p-3 text-sm text-destructive bg-destructive/10 rounded-md" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="payer">Kto zapłacił?</Label>
            <Select value={payerId} onValueChange={setPayerId} disabled={!!prefillData}>
              <SelectTrigger id="payer">
                <SelectValue placeholder="Wybierz osobę" />
              </SelectTrigger>
              <SelectContent>
                {groupMembers.map((member) => (
                  <SelectItem key={member.profile_id} value={member.profile_id}>
                    {member.full_name || "Nieznany"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payee">Komu zapłacono?</Label>
            <Select value={payeeId} onValueChange={setPayeeId} disabled={!!prefillData}>
              <SelectTrigger id="payee">
                <SelectValue placeholder="Wybierz osobę" />
              </SelectTrigger>
              <SelectContent>
                {groupMembers.map((member) => (
                  <SelectItem key={member.profile_id} value={member.profile_id}>
                    {member.full_name || "Nieznany"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Kwota ({baseCurrencyCode})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={prefillData?.amount}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-describedby={error ? errorId : undefined}
              aria-invalid={!!error}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zapisz rozliczenie
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
