# Plan implementacji widoku dodawania wydatku

## 1. Przegląd
Widok dodawania wydatku to modalny formularz umożliwiający użytkownikom ręczne tworzenie nowych wydatków w grupie. Formularz obsługuje dwa tryby podziału kosztów: równy podział na wszystkich uczestników oraz indywidualne przypisanie kwot. Widok integruje się z systemem walut grupy, zapewniając wybór spośród dostępnych walut oraz automatyczne przeliczenia na walutę bazową. Celem jest zapewnienie intuicyjnego i bezpiecznego procesu dodawania wydatków z pełną walidacją po stronie klienta i serwera.

## 2. Routing widoku
Widok jest dostępny pod dedykowaną ścieżką `/groups/[groupId]/expenses/new`. Jest otwierany poprzez nawigację z poziomu widoku grupy lub przycisk FAB (Floating Action Button) na pulpicie nawigacyjnym.

## 3. Struktura komponentów
```
src/pages/groups/[groupId]/expenses/
├── new.astro (strona główna)
src/components/group/expenses/
├── AddExpenseModal.tsx (modal wrapper dla formularza)
├── forms/
│   ├── ExpenseForm.tsx (główny komponent formularza - orchestruje podkomponenty)
│   ├── ExpenseBasicInfo.tsx (informacje podstawowe: opis, kwota, waluta, data, płatnik)
│   ├── ExpenseSplitSection.tsx (sekcja podziału kosztów)
│   ├── SimpleSplitInput.tsx (wprowadzanie kwot dla uczestników)
│   └── CurrencySelector.tsx (wybór waluty)
```

## 4. Szczegóły komponentów

### AddExpenseModal
- **Opis komponentu:** Modal wrapper dla formularza dodawania wydatku. Zarządza stanem ładowania, błędami oraz komunikacją między komponentami.
- **Główne elementy:** Dialog z ExpenseForm, przyciski zamykania, obsługa stanów ładowania i błędów.
- **Obsługiwane interakcje:** onExpenseCreated (po pomyślnym utworzeniu wydatku), onClose (zamknięcie modala).
- **Obsługiwana walidacja:** Brak bezpośredniej walidacji - deleguje do ExpenseForm.
- **Typy:** ExpenseDTO (response), ErrorResponseDTO (błędy).
- **Propsy:**
  ```typescript
  interface AddExpenseModalProps {
    groupId: string;
    groupMembers: GroupMemberSummaryDTO[];
    groupCurrencies: GroupCurrencyDTO[];
    currentUserId: string;
    isOpen: boolean;
    onClose: () => void;
    onExpenseCreated?: (expense: ExpenseDTO) => void;
    isLoading?: boolean;
    error?: string | null;
  }
  ```

### ExpenseForm
- **Opis komponentu:** Główny komponent formularza - orchestruje podkomponenty i zarządza komunikacją między nimi.
- **Główne elementy:** ExpenseBasicInfo, ExpenseSplitSection, obsługa błędów i przycisk submit.
- **Obsługiwane interakcje:** onSubmit (wysyłanie formularza do API).
- **Obsługiwana walidacja:** Deleguje walidację do podkomponentów i useExpenseForm hook.
- **Typy:** CreateExpenseCommand (dane formularza), ExpenseDTO (response).
- **Propsy:**
  ```typescript
  interface ExpenseFormProps {
    groupId: string;
    groupMembers: GroupMemberSummaryDTO[];
    groupCurrencies: GroupCurrencyDTO[];
    currentUserId: string;
    onSubmit: (expense: ExpenseDTO) => Promise<void>;
  }
  ```

### ExpenseBasicInfo
- **Opis komponentu:** Sekcja formularza zawierająca podstawowe informacje o wydatku.
- **Główne elementy:** Pola tekstowe dla opisu, kwoty, waluty, daty i płatnika.
- **Obsługiwana walidacja:** Walidacja formatów i wymaganych pól.
- **Propsy:**
  ```typescript
  interface ExpenseBasicInfoProps {
    form: UseFormReturn<CreateExpenseFormValues>;
    groupMembers: GroupMemberSummaryDTO[];
    groupCurrencies: GroupCurrencyDTO[];
    currentUserId: string;
  }
  ```

### ExpenseSplitSection
- **Opis komponentu:** Sekcja formularza odpowiedzialna za podział kosztów między uczestników.
- **Główne elementy:** SimpleSplitInput z przyciskiem "podziel po równo".
- **Obsługiwana walidacja:** Walidacja sumy podziałów.
- **Propsy:**
  ```typescript
  interface ExpenseSplitSectionProps {
    form: UseFormReturn<CreateExpenseFormValues>;
    groupMembers: GroupMemberSummaryDTO[];
  }
  ```

### SimpleSplitInput
- **Opis komponentu:** Komponent do wprowadzania kwot podziału dla każdego uczestnika grupy.
- **Główne elementy:** Lista członków grupy z polami input dla kwot, przycisk "podziel po równo".
- **Obsługiwana walidacja:** Suma kwot = całkowita kwota (±0.01 tolerancja).
- **Propsy:**
  ```typescript
  interface SimpleSplitInputProps {
    members: GroupMemberSummaryDTO[];
    totalAmount: number;
    currencyCode: string;
    splits: ExpenseSplitCommand[];
    onSplitsChange: (splits: ExpenseSplitCommand[]) => void;
  }
  ```

### CurrencySelector
- **Opis komponentu:** Selektor waluty spośród dostępnych w grupie.
- **Główne elementy:** Select component z Shadcn/ui.
- **Obsługiwane interakcje:** onValueChange (zmiana wybranej waluty).
- **Obsługiwana walidacja:** Wybrana waluta musi istnieć w group_currencies.
- **Typy:** GroupCurrencyDTO[] (dostępne waluty).
- **Propsy:**
  ```typescript
  interface CurrencySelectorProps {
    currencies: GroupCurrencyDTO[];
    value: string;
    onChange: (currencyCode: string) => void;
    error?: string;
    disabled?: boolean;
  }
  ```

## 5. Typy
Wymagane typy obejmują istniejące DTO z `types.ts` oraz typy używane w hookach:

```typescript
// Istniejące DTO (z types.ts)
- CreateExpenseCommand
- ExpenseDTO
- ExpenseSplitCommand
- ExpenseSplitDTO
- GroupMemberSummaryDTO
- GroupCurrencyDTO
- ErrorResponseDTO
- CreateExpenseFormValues (z expenseSchemas.ts)

// Typy hooków
type ExpenseFormState = {
  isSubmitting: boolean;
  submitError: string | null;
  fieldErrors: Record<string, string> | null;
};

type UseExpenseFormResult = ExpenseFormState & {
  form: ReturnType<typeof useForm<CreateExpenseFormValues>>;
  splitValidation: {
    totalAmount: number;
    currentSum: number;
    remaining: number;
    isValid: boolean;
  };
  handleSubmit: (groupId: string) => Promise<ExpenseDTO>;
  reset: () => void;
};
```

## 6. Zarządzanie stanem
Stan formularza jest zarządzany przez custom hook `useExpenseForm`, który integruje React Hook Form z logiką biznesową walidacji podziałów:

```typescript
function useExpenseForm(
  groupMembers: GroupMemberSummaryDTO[],
  groupCurrencies: GroupCurrencyDTO[],
  defaultPayerId?: string
): UseExpenseFormResult {
  const [state, setState] = useState<ExpenseFormState>({ /* ... */ });

  // Formularz z React Hook Form
  const form = useForm<CreateExpenseFormValues>({
    resolver: zodResolver(createExpenseFormSchema),
    mode: 'onChange',
    defaultValues: {
      description: undefined,
      amount: undefined,
      currency_code: groupCurrencies[0]?.currency_code || 'PLN',
      expense_date: new Date().toISOString().slice(0, 16),
      payer_id: defaultPayerId || undefined,
      splits: [],
    },
  });

  // Obliczenia walidacji podziałów
  const splitValidation = useMemo(() => {
    const totalAmount = form.watch('amount') || 0;
    const currentSum = form.watch('splits').reduce((sum, split) => sum + split.amount, 0);
    const remaining = Math.round((totalAmount - currentSum) * 100) / 100;
    const isValid = Math.abs(remaining) <= 0.01;

    return { totalAmount, currentSum, remaining, isValid };
  }, [form.watch('amount'), form.watch('splits')]);

  const handleSubmit = useCallback(async (groupId: string): Promise<ExpenseDTO> => {
    // Walidacja i wysłanie formularza do API
    // Obsługa błędów i transformacja danych
  }, [form]);

  return {
    ...state,
    form,
    splitValidation,
    handleSubmit,
    reset,
  };
}
```

Hook zapewnia walidację w czasie rzeczywistym, obsługę błędów oraz integrację z API.

## 7. Integracja API
Integracja wykorzystuje istniejący endpoint `POST /api/groups/:groupId/expenses` z następującymi typami:

**Żądanie (Request):**
```typescript
POST /api/groups/:groupId/expenses
Content-Type: application/json
Authorization: Bearer <token>

Body: CreateExpenseCommand {
  description: string;        // 1-500 znaków
  amount: number;             // > 0, max 2 miejsca po przecinku
  currency_code: string;      // ISO 4217, 3 wielkie litery
  expense_date: string;       // ISO 8601
  payer_id: string;           // UUID, musi = current user
  splits: ExpenseSplitCommand[]; // profile_id + amount, suma = total
}
```

**Odpowiedź (Response):**
```typescript
201 Created
Content-Type: application/json

Body: ExpenseDTO {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency_code: string;
  expense_date: string;
  created_at: string;
  amount_in_base_currency: number;  // obliczone przez API
  created_by: UserInfoDTO;          // {id, full_name, avatar_url}
  splits: ExpenseSplitDTO[];        // z nazwami uczestników
}
```

**Obsługa błędów:**
- 400: Validation/Semantic Error (np. zła suma, uczestnik poza grupą)
- 401: Unauthorized
- 404: Group/Wallet not found
- 500: Internal Server Error

## 8. Interakcje użytkownika
1. **Otwarcie modala:** Załadowanie danych grupy (członkowie, waluty) przez API call
2. **Wypełnienie pól podstawowych:** Walidacja formatów w czasie rzeczywistym przez React Hook Form + Zod
3. **Wybór waluty:** Dostępne waluty z grupy, domyślnie pierwsza dostępna
4. **Wybór płatnika:** Lista aktywnych członków grupy, domyślnie aktualny użytkownik
5. **Wprowadzanie kwot podziału:** Dla każdego członka grupy można wprowadzić kwotę (uczestnicy to osoby z kwotą > 0)
6. **Podziel po równo:** Przycisk automatycznie dzieli kwotę równo między wszystkich członków grupy
7. **Wprowadzanie kwot własnych:** Real-time walidacja sumy podziałów
8. **Wysyłanie formularza:** Końcowa walidacja, API call, toast success/error, zamknięcie modala

## 9. Warunki i walidacja
Warunki weryfikowane przez komponenty wpływają na stan UI poprzez disabled/enabled przyciski oraz wyświetlanie błędów:

- **ExpenseForm:** Walidacja wszystkich pól + suma podziałów - submit button disabled gdy błędy
- **ExpenseBasicInfo:** Walidacja opisu, kwoty, daty, płatnika - pola z błędami podświetlone
- **ExpenseSplitSection:** Deleguje walidację do SimpleSplitInput
- **SimpleSplitInput:** Suma kwot = całkowita kwota (±0.01) - wizualne wskazanie pozostałej kwoty
- **CurrencySelector:** Waluta dostępna w grupie - select pokazuje dostępne waluty

Wszystkie warunki są walidowane zarówno po stronie klienta (UX) jak i serwera (bezpieczeństwo).

## 10. Obsługa błędów
- **Błędy walidacji formularza:** Wyświetlanie pod polami przez React Hook Form
- **Błędy API:** Toast notifications przez Sonner z Shadcn/ui
- **Błędy sieci:** Retry logic + fallback messages
- **Błędy biznesowe:** Specyficzne komunikaty (np. "Uczestnik nie należy do grupy")
- **Edge cases:** Brak członków grupy (modal informacyjny), brak walut (disabled selector)

## 11. Kroki implementacji
1. ✅ Utworzyć schematy Zod w `src/lib/schemas/expenseSchemas.ts` dla walidacji formularza
2. ✅ Zaimplementować hook `useExpenseForm` w `src/lib/hooks/useExpenseForm.ts`
3. ✅ Stworzyć komponenty podrzędne (ExpenseBasicInfo, ExpenseSplitSection, SimpleSplitInput, CurrencySelector)
4. ✅ Zaimplementować główny `ExpenseForm` z integracją React Hook Form
5. ✅ Utworzyć `AddExpenseModal` jako wrapper z Dialog
6. ✅ Dodać wywołania API w serwisie `src/lib/services/expenseService.ts`
7. ✅ Zintegrować modal z istniejącym widokiem grupy
8. Dodać testy jednostkowe dla komponentów i hooków
9. Przetestować integrację end-to-end z API
10. Przeprowadzić testy UX i optymalizację wydajności
