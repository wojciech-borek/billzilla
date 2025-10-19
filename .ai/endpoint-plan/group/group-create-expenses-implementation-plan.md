## API Endpoint Implementation Plan: POST /api/groups/:groupId/expenses

### 1. Przegląd punktu końcowego
Dodaje nowy wydatek w obrębie grupy wraz z podziałem kwoty na uczestników. Endpoint waliduje sumę podziałów, sprawdza członkostwo uczestników w grupie, weryfikuje dostępność waluty w grupie oraz wylicza kwotę w walucie bazowej grupy na potrzeby odpowiedzi.

### 2. Szczegóły żądania
- **Metoda HTTP**: POST
- **Struktura URL**: `/api/groups/:groupId/expenses`
- **Parametry**:
  - **Wymagane**:
    - `groupId` (path): UUID grupy
  - **Opcjonalne**: brak w query
- **Request Body** (JSON; oparty o `CreateExpenseCommand`):
  - `description`: string (1–500)
  - `amount`: number (> 0, max 2 miejsca po przecinku)
  - `currency_code`: string (ISO 4217, 3 znaki, wielkie litery)
  - `expense_date`: string (ISO 8601)
  - `payer_id`: string (UUID) — musi odpowiadać `locals.user.id`
  - `splits`: `ExpenseSplitCommand[]`
    - `profile_id`: string (UUID)
    - `amount`: number (> 0, suma = `amount` w tolerancji ±0.01)

Walidacja wejścia (Zod):
- Format pól (typy, zakresy, długości, regex dla waluty).
- Suma `splits[].amount` = `amount` z tolerancją ±0.01.
- Brak duplikatów `profile_id` w `splits` (lub agregacja do jednej pozycji w usługach).
- `payer_id` musi być równy `locals.user.id` (anti-spoofing, spójność z RLS: `created_by`).
- Płatnik nie musi być uczestnikiem wydatku (może płacić za innych bez dzielenia kosztów).

### 3. Wykorzystywane typy
- DTO/Commands z `src/types.ts`:
  - `CreateExpenseCommand`
  - `ExpenseSplitCommand`
  - `ExpenseDTO`, `ExpenseSplitDTO`
  - `ErrorResponseDTO`
- Typ klienta: `SupabaseClient` z `src/db/supabase.client.ts`

### 4. Szczegóły odpowiedzi
- **201 Created** — `ExpenseDTO`:
  - Pola z `expenses` (bez `created_by` w surowej postaci),
  - `amount_in_base_currency`: number (wyliczony: `amount * exchange_rate`),
  - `created_by`: `UserInfoDTO` (id, full_name, avatar_url),
  - `splits`: `ExpenseSplitDTO[]` (z nazwami uczestników).
- **Błędy**:
  - 400: nieprawidłowe dane wejściowe/semantyka (suma podziałów, waluta poza grupą, brak uczestników, duplikaty nieobsłużone)
  - 401: brak uwierzytelnienia
  - 404: grupa nie istnieje lub użytkownik nie jest jej członkiem (RLS → brak rekordu)
  - 500: nieoczekiwany błąd serwera / błąd transakcji

Przykład odpowiedzi 201:
```json
{
  "id": "uuid-expense",
  "group_id": "uuid-group",
  "description": "Kolacja",
  "amount": 100.0,
  "currency_code": "PLN",
  "expense_date": "2025-10-18T20:00:00.000Z",
  "created_at": "2025-10-19T10:00:00.000Z",
  "amount_in_base_currency": 100.0,
  "created_by": { "id": "uuid-user", "full_name": "John Doe", "avatar_url": null },
  "splits": [
    { "profile_id": "uuid1", "full_name": "John Doe", "amount": 33.33 },
    { "profile_id": "uuid2", "full_name": "Jane Smith", "amount": 33.33 },
    { "profile_id": "uuid3", "full_name": "Alice Johnson", "amount": 33.34 }
  ]
}
```

### 5. Przepływ danych
1. Uwierzytelnienie: pobierz `locals.user`; w razie braku → 401.
2. Parsowanie `request.json()` z obsługą błędnego JSON (400: `INVALID_JSON`).
3. Walidacja Zod dla `CreateExpenseCommand` (400 przy błędzie, z `details`).
4. Walidacje semantyczne:
   - `payer_id === locals.user.id`, w przeciwnym razie 400.
   - `splits` niepuste; suma zgodna z `amount` (±0.01).
   - Pojedynczy wpis per `profile_id` (lub agregacja do jednej pozycji).
   - Płatnik nie musi być uczestnikiem wydatku.
5. Weryfikacja grupy i walut:
   - Pobierz grupę po `groupId` (RLS) i jej walutę bazową.
   - Sprawdź obecność `currency_code` w `group_currencies` i odczytaj `exchange_rate`.
6. Sprawdzenie członkostwa:
   - Sprawdź czy `payer_id` jest aktywnym członkiem grupy.
   - Sprawdź czy wszyscy uczestnicy z `splits` są aktywnymi członkami grupy.
   - Braki → 400 (płatnik lub uczestnik nie należy do grupy lub jest nieaktywny).
7. Obliczenia:
   - `amount_in_base = round(amount * exchange_rate, 2)` (zaokrąglenie tylko w odpowiedzi).
8. Zapis danych (atomowość):
   - Preferowane: RPC `create_expense_with_splits(p_group_id, p_created_by, p_description, p_amount, p_currency_code, p_expense_date, p_splits jsonb)` jako `SECURITY DEFINER`, która:
     - Wstawia rekord do `expenses` i zwraca `expense_id`;
     - Wstawia pakietowo `expense_splits`;
     - ROLLBACK w ramach funkcji przy błędzie; zwraca utworzony rekord.
   - Alternatywa (fallback):
     - Insert do `expenses` → on error 500;
     - Insert batch do `expense_splits` → jeśli błąd, usuń utworzony `expense` i zwróć 500.
9. Wzbogacenie odpowiedzi:
   - Dociągnij `created_by` (z `profiles`) oraz imiona dla `splits`.
10. Odpowiedź 201 z `ExpenseDTO`.

### 6. Względy bezpieczeństwa
- Autoryzacja: tylko zalogowani (`locals.user`).
- RLS już ogranicza odczyt/zapis do członków grupy; dodatkowo wymuszamy `created_by === locals.user.id` przez walidację `payer_id`.
- Waluta musi istnieć w `group_currencies` danej grupy (zapobiega nadużyciom kursów).
- Walidacja typów i zakresów (Zod) zapobiega niepoprawnym danym i nadmiernym wartościom.
- Brak masowej enumeracji: 404 dla nieistniejącej/grupy poza dostępem.
- Rozważ limit rate (poza zakresem tej implementacji) oraz audit trail (opcjonalnie w przyszłości).

### 7. Obsługa błędów
- 400 `VALIDATION_ERROR`: błąd schematu Zod (z `.flatten()`).
- 400 `SEMANTIC_ERROR`: suma podziałów, uczestnik spoza grupy, waluta spoza grupy, `payer_id` ≠ `locals.user.id`.
- 401 `UNAUTHORIZED`: brak `locals.user`.
- 404 `NOT_FOUND`: grupa/waluta w grupie nie odnaleziona w RLS.
- 500 `TRANSACTION_ERROR`/`INTERNAL_SERVER_ERROR`: zapis niepowiódł się.
- Logowanie: `console.error` (brak dedykowanej tabeli błędów w schemacie; możliwe rozszerzenie w osobnej migracji).

### 8. Rozważania dotyczące wydajności
- Zapytania łączone: jednorazowy odczyt członków przez `IN (...)` i walut grupy.
- Indeksy w schemacie pokrywają `group_members.profile_id`, `expenses.group_id`, `expense_splits.profile_id`, `group_currencies` klucz złożony — korzystamy z nich.
- Batch insert `expense_splits` w jednej operacji.
- Preferowana implementacja jako RPC w Postgres dla atomowości i mniejszego round-trip.

### 9. Etapy wdrożenia
1) Schematy walidacji (Zod)
   - Plik: `src/lib/schemas/expenseSchemas.ts`
   - Eksport: `createExpenseSchema`
   - Reguły: jak w sekcji „Szczegóły żądania” (typy, zakresy, suma podziałów ±0.01, `payer_id` = `locals.user.id`).

2) Serwis biznesowy
   - Plik: `src/lib/services/expenseService.ts`
   - Funkcje:
     - `createExpense(supabase: SupabaseClient, groupId: string, userId: string, command: CreateExpenseCommand): Promise<ExpenseDTO>`
       - Realizuje kroki 5–9 z „Przepływ danych”.
       - Wariant A: woła RPC; wariant B: insert + batch insert + manualny rollback.

3) Endpoint (Astro API)
   - Plik: `src/pages/api/groups/[groupId]/expenses/index.ts`
   - `export const prerender = false;`
   - `POST`: 
     - Auth z `locals.user` (401),
     - `groupId` z `params`,
     - parse JSON (400 przy błędzie),
     - walidacja Zod,
     - `command.payer_id` nadpisany/zweryfikowany do `user.id`,
     - wywołanie `expenseService.createExpense`,
     - 201 z `ExpenseDTO`;
     - mapowanie wyjątków na kody (400/404/500) zgodnie z „Obsługa błędów”.

4) (Opcjonalnie) Migracja RPC dla atomowości
   - Plik: `supabase/migrations/2025XXXXXX_create_expense_with_splits.sql`
   - Funkcja `create_expense_with_splits(...)` (`SECURITY DEFINER`, sprawdzenia wejścia, transakcja, zwrot rekordu wydatku).
   - Grant EXECUTE dla roli `authenticated`.

5) Typy/eksporty
   - Typy już dostępne w `src/types.ts`.
   - Dodaj eksport schematów w `src/lib/schemas/index.ts` (jeśli istnieje) dla spójności.

6) Testy ręczne (smoke)
   - Scenariusz happy-path: 3 splits, równa suma.
   - Błędy: zła suma, uczestnik spoza grupy, waluta spoza grupy, brak auth.

### 10. Przykładowe payloady
#### Równy podział (100 PLN na 3 osoby)
```json
{
  "description": "Kolacja",
  "amount": 100.0,
  "currency_code": "PLN",
  "expense_date": "2025-10-18T20:00:00.000Z",
  "payer_id": "uuid1",
  "splits": [
    { "profile_id": "uuid1", "amount": 33.33 },
    { "profile_id": "uuid2", "amount": 33.33 },
    { "profile_id": "uuid3", "amount": 33.34 }
  ]
}
```

#### Niestandardowy podział
```json
{
  "description": "Zakupy",
  "amount": 100.0,
  "currency_code": "PLN",
  "expense_date": "2025-10-18T12:00:00.000Z",
  "payer_id": "uuid1",
  "splits": [
    { "profile_id": "uuid1", "amount": 50.0 },
    { "profile_id": "uuid2", "amount": 30.0 },
    { "profile_id": "uuid3", "amount": 20.0 }
  ]
}
```

#### Płatnik nieuczestniczący w podziale
```json
{
  "description": "Prezent urodzinowy",
  "amount": 200.0,
  "currency_code": "PLN",
  "expense_date": "2025-10-18T15:00:00.000Z",
  "payer_id": "uuid1",
  "splits": [
    { "profile_id": "uuid2", "amount": 100.0 },
    { "profile_id": "uuid3", "amount": 100.0 }
  ]
}
```


