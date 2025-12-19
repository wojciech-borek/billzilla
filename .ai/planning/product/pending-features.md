# Niezaimplementowane Funkcjonalności - Billzilla

**Data utworzenia:** 2025-12-19  
**Ostatnia aktualizacja:** 2025-12-19

---

## 1. Opuszczanie Grupy

### Opis

Funkcjonalność pozwalająca użytkownikowi na opuszczenie grupy, pod warunkiem że nie jest jej twórcą.

### Lokalizacja

- **Plik:** [Header.tsx:56-58](file:///c:/Users/wojbo/projects/billzilla/src/components/group/Header.tsx#L56-L58)
- **Komponent:** `Header`

### Wymagania Funkcjonalne

1. **Walidacja**:
   - Twórca grupy **nie może** opuścić grupy (może tylko zarchiwizować)
   - Uczestnik może opuścić grupę tylko jeśli jego saldo = 0 (nie ma długów)
   - Jeśli saldo != 0, wymagane dodatkowe potwierdzenie

2. **UI/UX Flow**:
   - Kliknięcie przycisku "Opuść grupę"
   - Dialog potwierdzenia z informacją o saldzie uczestnika
   - Jeśli saldo != 0, dodatkowe potwierdzenie checkbox z ostrzeżeniem
   - Przekierowanie na dashboard po opuszczeniu

3. **Backend**:
   - Endpoint: `DELETE /api/groups/:groupId/members/:userId`
   - Aktualizacja statusu uczestnika na `inactive`
   - Zachowanie historii członkostwa dla audytu
   - Nie można usunąć wpłaty na saldo z historii

### Propozycja Implementacji

#### Backend - Endpoint

```typescript
// src/pages/api/groups/[groupId]/members/[userId]/leave.ts
export const DELETE: APIRoute = async ({ params, locals }) => {
  const userId = params.userId;
  const groupId = params.groupId;
  const currentUser = locals.user;

  // Verify user is leaving themselves
  if (userId !== currentUser.id) {
    return new Response(JSON.stringify({
      error: { code: "FORBIDDEN", message: "You can only leave yourself" }
    }), { status: 403 });
  }

  // Check if user is creator
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("profile_id", userId)
    .single();

  if (membership.role === "creator") {
    return new Response(JSON.stringify({
      error: { code: "FORBIDDEN", message: "Creator cannot leave group" }
    }), { status: 403 });
  }

  // Set status to inactive
  await supabase
    .from("group_members")
    .update({ status: "inactive", left_at: new Date().toISOString() })
    .eq("group_id", groupId)
    .eq("profile_id", userId);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

#### Frontend - Hook

```typescript
// src/lib/hooks/useLeaveGroup.ts
export const useLeaveGroup = () => {
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const response = await fetch(`/api/groups/${groupId}/members/${userId}/leave`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to leave group");
      return response.json();
    },
  });
};
```

### Kryteria Akceptacji

- [ ] Twórca nie może opuścić grupy (błąd wyświetlany)
- [ ] Uczestnik z saldem=0 może opuścić bez dodatkowego ostrzeżenia
- [ ] Uczestnik z saldem!=0 widzi ostrzeżenie + wymaga dodatkowego potwierdzenia
- [ ] Status uczestnika zmienia się na `inactive`
- [ ] Historia członkostwa zachowana w bazie danych
- [ ] Użytkownik przekierowywany na dashboard po opuszczeniu grupy

---

## 2. Edycja Nazwy Grupy

### Opis

Twórca grupy może zmodyfikować nazwę grupy bezpośrednio z nagłówka (Header).

### Lokalizacja

- **Plik:** [Header.tsx:82-84](file:///c:/Users/wojbo/projects/billzilla/src/components/group/Header.tsx#L82-L84)
- **Komponent:** `Header`

### Wymagania Funkcjonalne

1. **Walidacja**:
   - Nazwa grupy: 1-100 znaków
   - Tylko twórca może edytować nazwę

2. **UI/UX**:
   - Inline editing bezpośrednio w nagłówku
   - Kliknięcie ikony edycji zamienia tytuł w input
   - Zapisanie: Enter lub kliknięcie poza input
   - Anulowanie: Escape
   - Real-time aktualizacja po zapisie

3. **Backend**:
   - Endpoint: `PATCH /api/groups/:groupId`
   - Walidacja długości i uprawnień
   - Zwraca zaktualizowane dane grupy

### Propozycja Implementacji

```typescript
// Frontend - Inline Editing State
const [isEditingName, setIsEditingName] = useState(false);
const [newGroupName, setNewGroupName] = useState(groupName);
const updateGroupName = useUpdateGroupName();

const handleSaveName = async () => {
  if (newGroupName === groupName || newGroupName.trim().length === 0) {
    setIsEditingName(false);
    setNewGroupName(groupName); // Reset to original
    return;
  }

  await updateGroupName.mutateAsync({ groupId, name: newGroupName.trim() });
  setIsEditingName(false);
};

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter") {
    handleSaveName();
  } else if (e.key === "Escape") {
    setNewGroupName(groupName);
    setIsEditingName(false);
  }
};

// Render
{isEditingName ? (
  <input
    type="text"
    value={newGroupName}
    onChange={(e) => setNewGroupName(e.target.value)}
    onBlur={handleSaveName}
    onKeyDown={handleKeyDown}
    autoFocus
    maxLength={100}
    className="text-lg font-semibold border-b-2 border-primary"
  />
) : (
  <h1 className="text-lg font-semibold">{groupName}</h1>
)}
```

### Kryteria Akceptacji

- [ ] Tylko twórca widzi ikonę edycji
- [ ] Kliknięcie ikony pokazuje inline input
- [ ] Walidacja: 1-100 znaków
- [ ] Zapisanie: Enter lub blur
- [ ] Anulowanie: Escape
- [ ] Real-time update nazwy w UI po zapisie
- [ ] Error handling dla błędów sieci i walidacji

---

## 3. Zapraszanie Uczestników (UI)

### Opis

Dialog do zapraszania nowych uczestników do grupy z poziomu ustawień.

### Lokalizacja

- **Plik:** [GroupSettingsCards.tsx:18-20](file:///c:/Users/wojbo/projects/billzilla/src/components/group/GroupSettingsCards.tsx#L18-L20)
- **Komponent:** `GroupSettingsCards`

### Wymagania Funkcjonalne

1. **Walidacja**:
   - Email musi być w poprawnym formacie
   - Maksymalnie 20 emaili na raz
   - Nie można zaprosić tego samego emaila dwukrotnie
   - Nie można zaprosić osoby już będącej w grupie

2. **UI/UX**:
   - Modal/Dialog z formularzem
   - Chips input dla listy emaili
   - Pokazywanie błędów walidacji w czasie rzeczywistym
   - Lista oczekujących zaproszeń aktualizuje się po wysłaniu
   - Feedback wizualny dla sukcesu/błędów

3. **Backend**:
   - Wykorzystanie istniejącego `POST /api/groups/:groupId/members/invite`
   - Wysyłka emaili z zaproszeniami

### Propozycja Implementacji

```typescript
// Component structure
const InviteMembersDialog: React.FC<{
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ groupId, isOpen, onClose }) => {
  const { addEmail, removeEmail, emails, inputError } = useEmailChips();
  const inviteMembers = useInviteMembers();

  const handleInvite = async () => {
    if (emails.length === 0) return;
    
    await inviteMembers.mutateAsync({ groupId, emails });
    // Clear emails and close on success
    emails.forEach(email => removeEmail(email));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zaproś uczestników</DialogTitle>
          <DialogDescription>
            Dodaj adresy email osób, które chcesz zaprosić do grupy. 
            Maksymalnie 20 zaproszeń naraz.
          </DialogDescription>
        </DialogHeader>
        
        <EmailChipsInput
          emails={emails}
          onAddEmail={addEmail}
          onRemoveEmail={removeEmail}
          error={inputError}
          maxEmails={20}
          placeholder="Wpisz adres email i naciśnij Enter"
        />

        {inviteMembers.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {inviteMembers.error.message}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button 
            onClick={handleInvite} 
            disabled={emails.length === 0}
            loading={inviteMembers.isPending}
          >
            Wyślij zaproszenia ({emails.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

### Kryteria Akceptacji

- [ ] Modal otwiera się po kliknięciu przycisku "+"
- [ ] Można dodać do 20 emaili za pomocą chips input
- [ ] Walidacja formatu email w czasie rzeczywistym
- [ ] Nie można dodać duplikatu emaila
- [ ] Wyświetlanie komunikatu sukcesu po wysłaniu zaproszeń
- [ ] Lista oczekujących zaproszeń odświeża się automatycznie
- [ ] Obsługa błędów z wyraźnym feedbackiem dla użytkownika

---

## 4. Edycja Uczestnika

### Opis

Twórca grupy może edytować informacje o uczestniku (np. nadać pseudonim lokalny dla tej grupy).

### Lokalizacja

- **Plik:** [GroupSettingsCards.tsx:26-28](file:///c:/Users/wojbo/projects/billzilla/src/components/group/GroupSettingsCards.tsx#L26-L28)
- **Komponent:** `GroupSettingsCards`

### Wymagania Funkcjonalne

1. **Edytowalne pola**:
   - **Pseudonim w grupie** (opcjonalnie): Lokalna nazwa dla tego użytkownika widoczna tylko w tej grupie
   - Jeśli pole puste, wyświetla się `full_name` z profilu

2. **Walidacja**:
   - Pseudonim: 0-50 znaków (opcjonalny)
   - Tylko twórca może edytować uczestników
   - Nie można edytować samego siebie jako twórca

3. **UI/UX**:
   - Modal z formularzem
   - Podgląd obecnej nazwy i emaila uczestnika
   - Pole tekstowe dla pseudonimu z placeholderem

### Propozycja Implementacji

```typescript
const EditMemberDialog: React.FC<{
  member: GroupMemberDTO;
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}> = ({ member, isOpen, onClose, groupId }) => {
  const [alias, setAlias] = useState(member.alias || "");
  const updateMember = useUpdateGroupMember();

  const handleSave = async () => {
    await updateMember.mutateAsync({
      groupId,
      userId: member.profile_id,
      alias: alias.trim() || null // null if empty
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj uczestnika</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Nazwa użytkownika</Label>
            <p className="text-sm text-muted-foreground">
              {member.full_name || member.email}
            </p>
          </div>

          <div>
            <Label htmlFor="alias">
              Pseudonim w grupie (opcjonalnie)
            </Label>
            <Input
              id="alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder={member.full_name || "Brak pseudonimu"}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Pseudonim będzie widoczny tylko w tej grupie
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleSave} loading={updateMember.isPending}>
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

### Backend

```typescript
// src/pages/api/groups/[groupId]/members/[userId].ts
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { alias } = await request.json();
  
  // Validate alias length
  if (alias && alias.length > 50) {
    return new Response(JSON.stringify({
      error: { code: "VALIDATION_ERROR", message: "Alias too long" }
    }), { status: 400 });
  }

  // Update member
  await supabase
    .from("group_members")
    .update({ alias })
    .eq("group_id", params.groupId)
    .eq("profile_id", params.userId);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

### Kryteria Akceptacji

- [ ] Tylko twórca widzi przycisk edycji uczestnika
- [ ] Nie można edytować samego siebie (twórcy)
- [ ] Modal pokazuje obecne dane uczestnika
- [ ] Pseudonim jest opcjonalny (można zostawić puste)
- [ ] Walidacja: max 50 znaków
- [ ] Pseudonim wyświetla się zamiast imienia w interfejsie grupy
- [ ] Aktualizacja w czasie rzeczywistym po zapisie

---

## 5. Usuwanie Uczestnika

### Opis

Twórca grupy może usunąć (dezaktywować) uczestnika z grupy.

### Lokalizacja

- **Plik:** [GroupSettingsCards.tsx:30-32](file:///c:/Users/wojbo/projects/billzilla/src/components/group/GroupSettingsCards.tsx#L30-L32)
- **Komponent:** `GroupSettingsCards`

### Wymagania Funkcjonalne

1. **Walidacja**:
   - Tylko twórca może usuwać uczestników
   - Nie można usunąć samego siebie (twórcy)
   - Uczestnik z saldem != 0 wymaga dodatkowego potwierdzenia z ostrzeżeniem

2. **UI/UX**:
   - Kliknięcie ikony usuwania
   - Dialog potwierdzenia z:
     - Informacją o saldzie uczestnika
     - Dodatkowym ostrzeżeniem jeśli saldo != 0
     - Wymuszonym checkboxem potwierdzenia jeśli saldo != 0
   - Komunikat sukcesu po usunięciu

3. **Backend**:
   - Status uczestnika zmienia się na `inactive`
   - Historia zachowana dla audytu
   - Zachowanie wszystkich wydatków i rozliczeń w historii

### Propozycja Implementacji

```typescript
const handleRemoveMember = async (member: GroupMemberDTO) => {
  // Get member balance
  const balance = memberBalances.find(m => m.profile_id === member.profile_id)?.balance || 0;
  
  // Show confirmation dialog
  const confirmed = await confirmDialog({
    title: "Usuń uczestnika",
    description: balance !== 0 
      ? `Uczestnik ${member.full_name} ma saldo ${balance.toFixed(2)} ${baseCurrency}. 
         Usunięcie uczestnika z długiem/nadwyżką może wpłynąć na rozliczenia grupy.`
      : `Czy na pewno chcesz usunąć uczestnika ${member.full_name} z grupy?`,
    confirmText: "Usuń",
    variant: "destructive",
    requireExtraConfirmation: balance !== 0, // Show checkbox if balance != 0
    extraConfirmationText: "Rozumiem konsekwencje i chcę usunąć uczestnika"
  });

  if (!confirmed) return;

  // Call API
  await removeMemberMutation.mutateAsync({
    groupId,
    userId: member.profile_id
  });

  // Show success toast
  toast.success(`Uczestnik ${member.full_name} został usunięty z grupy`);
};
```

### Backend

```typescript
// src/pages/api/groups/[groupId]/members/[userId].ts
export const DELETE: APIRoute = async ({ params, locals }) => {
  // Verify only creator can remove members
  const { data: requestingMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", params.groupId)
    .eq("profile_id", locals.user.id)
    .single();

  if (requestingMembership.role !== "creator") {
    return new Response(JSON.stringify({
      error: { code: "FORBIDDEN", message: "Only creator can remove members" }
    }), { status: 403 });
  }

  // Cannot remove self
  if (params.userId === locals.user.id) {
    return new Response(JSON.stringify({
      error: { code: "FORBIDDEN", message: "Cannot remove yourself" }
    }), { status: 403 });
  }

  // Set member status to inactive
  await supabase
    .from("group_members")
    .update({ status: "inactive", removed_at: new Date().toISOString() })
    .eq("group_id", params.groupId)
    .eq("profile_id", params.userId);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

### Kryteria Akceptacji

- [ ] Tylko twórca widzi przycisk usuwania uczestnika
- [ ] Nie można usunąć samego siebie (komunikat błędu)
- [ ] Dialog potwierdzenia wyświetla saldo uczestnika
- [ ] Jeśli saldo != 0, wymagany dodatkowy checkbox potwierdzenia
- [ ] Status uczestnika zmienia się na `inactive`
- [ ] Historia wydatków i rozliczeń pozostaje nienaruszona
- [ ] Lista uczestników aktualizuje się natychmiast po usunięciu
- [ ] Komunikat sukcesu wyświetlany po usunięciu

---

## 6. Zarządzanie Walutami Grupy

### Opis

Funkcjonalność pozwalająca na dodawanie dodatkowych walut do grupy z niestandardowymi kursami wymiany. Każda grupa może mieć własne kursy walut przechowywane w tabeli `group_currencies`.

### Lokalizacja

- **Plik:** [GroupSettingsCards.tsx:22-24](file:///c:/Users/wojbo/projects/billzilla/src/components/group/GroupSettingsCards.tsx#L22-L24)
- **Komponent:** `GroupSettingsCards`

### Kontekst Biznesowy

**Dlaczego ta funkcja jest potrzebna:**

Użytkownicy mogą już tworzyć wydatki w dowolnej walucie, ale system automatycznie konwertuje je na walutę bazową grupy. **Problem** polega na tym, że:
- Kursy wymiany muszą być dodane do grupy zanim użytkownik będzie mógł wybrać daną walutę w wydatku
- Każda grupa powinna móc definiować własne kursy wymiany (np. grupa urlop może użyć kursu kantoru, a grupa firmowa - kursu urzędowego)
- Domyślnie grupa ma tylko walutę bazową z kursem 1.0

**Struktura bazy danych:**

```sql
-- Tabela group_currencies
CREATE TABLE group_currencies (
  group_id uuid REFERENCES groups(id),
  currency_code varchar(3) REFERENCES currencies(code),
  exchange_rate numeric(10, 4) NOT NULL CHECK (exchange_rate > 0),
  PRIMARY KEY (group_id, currency_code)
);
```

### Wymagania Funkcjonalne

1. **Walidacja**:
   - Tylko twórca grupy może zarządzać walutami
   - Nie można usunąć waluty bazowej grupy
   - Kurs wymiany musi być > 0
   - Nie można dodać duplikatu waluty dla grupy

2. **UI/UX**:
   - Modal z wyszukiwarką walut (lista dostępna z tabeli `currencies`)
   - Autocomplete z popularnymi walutami (USD, EUR, GBP, CHF, etc.)
   - Pole tekstowe dla kursu wymiany
   - Informacja jednostki kursu: "1 [CURRENCY] = X [BASE_CURRENCY]"
   - Lista już dodanych walut z możliwością edycji kursu lub usunięcia
   - Waluta bazowa oznaczona jako "Bazowa" i nieusuwalna

3. **Backend**:
   - Endpoint: `POST /api/groups/:groupId/currencies`
   - Request body: `{ currency_code: string, exchange_rate: number }`
   - Endpoint: `PATCH /api/groups/:groupId/currencies/:code`
   - Request body: `{ exchange_rate: number }`
   - Endpoint: `DELETE /api/groups/:groupId/currencies/:code`

### Propozycja Implementacji

#### UI - Modal Dodawania Waluty

```typescript
const AddCurrencyDialog: React.FC<{
  groupId: string;
  baseCurrency: string;
  existingCurrencies: GroupCurrencyDTO[];
  isOpen: boolean;
  onClose: () => void;
}> = ({ groupId, baseCurrency, existingCurrencies, isOpen, onClose }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<string>("");
  const addCurrency = useAddCurrency();

  // Filter out already added currencies
  const availableCurrencies = allCurrencies.filter(
    c => !existingCurrencies.some(ec => ec.code === c.code)
  );

  const handleAdd = async () => {
    await addCurrency.mutateAsync({
      groupId,
      currency_code: selectedCurrency,
      exchange_rate: parseFloat(exchangeRate)
    });
    setSelectedCurrency("");
    setExchangeRate("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj walutę do grupy</DialogTitle>
          <DialogDescription>
            Wybierz walutę i ustaw kurs wymiany względem {baseCurrency}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="currency">Waluta</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz walutę" />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rate">
              Kurs wymiany (1 {selectedCurrency} = ? {baseCurrency})
            </Label>
            <Input
              id="rate"
              type="number"
              step="0.0001"
              min="0.0001"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              placeholder="np. 4.5000"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Przykład: Jeśli 1 EUR = 4.50 PLN, wpisz 4.5000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button 
            onClick={handleAdd}
            disabled={!selectedCurrency || !exchangeRate || parseFloat(exchangeRate) <= 0}
            loading={addCurrency.isPending}
          >
            Dodaj walutę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

#### Lista Walut z Edycją

```typescript
const CurrencyList: React.FC<{
  currencies: GroupCurrencyDTO[];
  baseCurrency: string;
  onEditRate: (code: string, newRate: number) => void;
  onRemove: (code: string) => void;
}> = ({ currencies, baseCurrency, onEditRate, onRemove }) => {
  return (
    <div className="space-y-2">
      {currencies.map((currency) => (
        <div key={currency.code} className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{currency.code}</span>
              <span className="text-sm text-muted-foreground">{currency.name}</span>
              {currency.code === baseCurrency && (
                <Badge variant="secondary">Bazowa</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              1 {currency.code} = {currency.exchange_rate.toFixed(4)} {baseCurrency}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currency.code !== baseCurrency && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newRate = prompt(`Nowy kurs dla ${currency.code}:`, currency.exchange_rate.toString());
                    if (newRate) onEditRate(currency.code, parseFloat(newRate));
                  }}
                >
                  Edytuj kurs
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onRemove(currency.code)}
                >
                  Usuń
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### Backend - Endpoint Dodawania Waluty

```typescript
// src/pages/api/groups/[groupId]/currencies/index.ts
export const POST: APIRoute = async ({ params, request, locals }) => {
  const { currency_code, exchange_rate } = await request.json();
  
  // Validate
  if (!currency_code || !exchange_rate || exchange_rate <= 0) {
    return new Response(JSON.stringify({
      error: { code: "VALIDATION_ERROR", message: "Invalid currency data" }
    }), { status: 400 });
  }

  // Check if user is creator
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", params.groupId)
    .eq("profile_id", locals.user.id)
    .single();

  if (membership.role !== "creator") {
    return new Response(JSON.stringify({
      error: { code: "FORBIDDEN", message: "Only creator can manage currencies" }
    }), { status: 403 });
  }

  // Check if currency already exists for group
  const { data: existing } = await supabase
    .from("group_currencies")
    .select("*")
    .eq("group_id", params.groupId)
    .eq("currency_code", currency_code)
    .single();

  if (existing) {
    return new Response(JSON.stringify({
      error: { code: "CONFLICT", message: "Currency already added to group" }
    }), { status: 409 });
  }

  // Insert
  await supabase
    .from("group_currencies")
    .insert({
      group_id: params.groupId,
      currency_code,
      exchange_rate
    });

  return new Response(JSON.stringify({ success: true }), { status: 201 });
};
```

### Kryteria Akceptacji

- [ ] Tylko twórca widzi przyciski zarządzania walutami
- [ ] Modal pokazuje listę dostępnych walut (z globalnej tabeli `currencies`)
- [ ] Nie można dodać waluty która już istnieje w grupie
- [ ] Wprowadzony kurs wymiany musi być > 0
- [ ] Format kursu: 4 miejsca po przecinku (0.0001 - 9999.9999)
- [ ] Lista walut pokazuje wszystkie dodane waluty z możliwością edycji kursu
- [ ] Waluta bazowa jest oznaczona i nie można jej usunąć
- [ ] Po dodaniu waluty, użytkownicy mogą ją wybrać przy tworzeniu wydatku
- [ ] System automatycznie konwertuje wydatki używając zdefiniowanych kursów
- [ ] Aktualizacja listy walut w czasie rzeczywistym po dodaniu/edycji/usunięciu

---

## Następne Kroki

1. [x] Dokumentacja niezaimplementowanych funkcji
2. [x] Usunięcie komentarzy TODO z kodu
3. [ ] Implementacja według potrzeb biznesowych
4. [ ] Testy dla każdej zaimplementowanej funkcji

---

**Ostatnia aktualizacja:** 2025-12-19
