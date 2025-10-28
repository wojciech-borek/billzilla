import React from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ExpenseModalHeaderProps {
  onClose: () => void;
}

export function ExpenseModalHeader({ onClose }: ExpenseModalHeaderProps) {
  return (
    <DialogHeader className="px-6 py-4 border-b bg-background">
      <div className="flex items-center justify-between">
        <DialogTitle className="text-xl font-semibold">Dodaj wydatek</DialogTitle>
        <Button variant="ghost" size="sm" onClick={onClose} className="p-2 h-auto" aria-label="Zamknij modal">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </DialogHeader>
  );
}
