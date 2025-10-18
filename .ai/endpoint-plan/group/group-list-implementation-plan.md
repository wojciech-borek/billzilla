### API Endpoint Implementation Plan: GET /api/groups (List groups for user)

## 1. Przegląd punktu końcowego
- Cel: Zwraca listę grup, do których należy zalogowany użytkownik, wraz z polami obliczanymi i pełną listą aktywnych członków każdej grupy.
- Zastosowanie: Widok Dashboard (`/dashboard`) – karty grup wymagają: nazwa, saldo użytkownika, lista członków (awatar + imię), rola użytkownika.
- Zgodność: W oparciu o specyfikację API (2.3 GET /api/groups) i ustalenie: zwracamy wszystkich członków (nie tylko 3–5). Frontend sam obliczy liczbę na podstawie `members.length`.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Ścieżka: `/api/groups`
- Nagłówki: `Authorization: Bearer {access_token}`
- Parametry zapytania:
  - `status`: "active" | "archived" (opcjonalny; domyślnie "active")
  - `limit`: number z zakresu 1–100 (opcjonalny; domyślnie 50)
  - `offset`: number >= 0 (opcjonalny; domyślnie 0)

## 3. Wykorzystywane typy
- Z `src/types.ts`:
  - `GroupListItemDTO`: `Group` + `role: GroupRole` + `my_balance: number` + `members: GroupMemberSummaryDTO[]`
  - `GroupMemberSummaryDTO`: `{ profile_id, full_name, avatar_url, status, role }`
  - `PaginatedResponse<GroupListItemDTO>`
  - `ErrorResponseDTO`


## 4. Szczegóły odpowiedzi
- Kody statusu:
  - 200 OK – Sukces, zwracany `PaginatedResponse<GroupListItemDTO>`
  - 400 Bad Request – Nieprawidłowe parametry zapytania
  - 401 Unauthorized – Brak autoryzacji (brak `locals.user`)
  - 500 Internal Server Error – Błąd po stronie serwera

Przykład 200:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Wyjazd do Zakopanego",
      "base_currency_code": "PLN",
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z",
      "role": "creator",
      "my_balance": -123.45,
      "members": [
        { "profile_id": "u1", "full_name": "Jan Kowalski", "avatar_url": "https://...", "status": "active" },
        { "profile_id": "u2", "full_name": "Anna Nowak", "avatar_url": null, "status": "active" }
      ]
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

## 5. Przepływ danych
1) Middleware (`src/middleware/index.ts`): ustawia `locals.supabase` i `locals.user`.
2) Handler `GET` (`src/pages/api/groups/index.ts`):
   - 401, jeśli brak `locals.user`.
   - Parsowanie `status`, `limit`, `offset` z `url.searchParams` i walidacja Zod.
   - Wywołanie serwisu `listGroups(supabase, user.id, { status, limit, offset })`.
3) Serwis `listGroups` (`src/lib/services/groupService.ts`):
   - A) Lista grup użytkownika + rola:
     - Z `groups` dołącz `group_members` (dla `profile_id = userId`) aby pobrać `role`.
     - Filtruj po `groups.status = status`.
     - Zastosuj paginację: `limit`, `offset` i pobierz osobno `total` (bez paginacji) dla tych samych kryteriów.
   - B) Pełna lista członków: dla `groupIds` pobierz aktywnych członków (`group_members` join `profiles`) i zbuduj `members: GroupMemberSummaryDTO[]` dla każdej grupy.
   - D) Saldo użytkownika `my_balance` w walucie bazowej grupy:
     - `paid_in_base`: suma `expenses.amount * exchange_rate` gdzie `expenses.created_by = userId` i `expenses.group_id IN groupIds`.
     - `owed_in_base`: suma `expense_splits.amount * exchange_rate` gdzie `expense_splits.profile_id = userId` (join do `expenses` by mieć `group_id`, `currency_code`).
     - `settlements_in`: suma `settlements.amount` (payee_id = userId).
     - `settlements_out`: suma `settlements.amount` (payer_id = userId).
     - Konwersja walut: `exchange_rate` z `group_currencies` po `(group_id, currency_code)`; waluta bazowa = 1.0.
   - E) Złóż `GroupListItemDTO[]` z: danych grupy, `role`, `members`, `my_balance`.
4) Handler zwraca `PaginatedResponse<GroupListItemDTO>` jako JSON (200).

## 6. Względy bezpieczeństwa
- 401, gdy brak `locals.user`.
- Autoryzacja i izolacja danych poprzez RLS: zapytania/joins ograniczone do grup, których członkiem jest `userId` (istnienie w `group_members`).
- Walidacja wejścia: Zod dla `status`, `limit`, `offset` (coerce number, zakresy, domyślne wartości).
- Brak ujawniania e-maili w liście członków w widoku listy (zwracamy `full_name`, `avatar_url`, `status`, `profile_id`).

## 7. Obsługa błędów
- 400 VALIDATION_ERROR – błędne parametry (`status`, `limit`, `offset`).
- 401 UNAUTHORIZED – brak autoryzacji.
- 500 INTERNAL_SERVER_ERROR – nieoczekiwane błędy (loguj `console.error`).

Format błędu (`ErrorResponseDTO`):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {"limit":"Expected 1..100"}
  }
}
```

## 8. Rozważania dotyczące wydajności
- Unikaj N+1: pobrania po `groupIds` i agregacje w pamięci.
- Indeksy sugerowane: `group_members(group_id, status)`, `group_members(profile_id)`, `expenses(group_id)`, `expenses(created_by)`, `expense_splits(profile_id)`, `group_currencies(group_id, currency_code)`, `settlements(group_id, payer_id, payee_id)`.
- Paginacja grup po `limit`/`offset`. Pełne listy członków mogą być duże – rozważ w przyszłości oddzielny lightweight endpoint lub lazy-load, jeśli zajdzie potrzeba.
- Opcjonalnie (po MVP): widoki/funkcje SQL (RPC) łączące `group_members` + `profiles` oraz agregujące saldo w jednym wywołaniu.

## 9. Kroki implementacji
1) Walidacja query params
   - Dodaj `listGroupsQuerySchema` w `src/lib/schemas/groupSchemas.ts`:
     ```ts
     import { z } from 'zod';
     export const listGroupsQuerySchema = z.object({
       status: z.enum(['active','archived']).default('active').optional(),
       limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
       offset: z.coerce.number().int().min(0).default(0).optional()
     });
     export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;
     ```
2) Serwis `listGroups`
   - W `src/lib/services/groupService.ts` dodaj:
     - `export async function listGroups(supabase, userId, { status, limit, offset }): Promise<PaginatedResponse<GroupListItemDTO>>`
     - Implementacja: 
       - Główne pobranie grup + `role` z `group_members` (dla userId) z paginacją + osobne `total`.
       - Pobranie aktywnych członków dla `groupIds`, z join do `profiles` (budowa `members`).
       - Pobrania do balansu (`expenses`, `expense_splits`+`expenses`, `settlements`) + konwersja po `group_currencies`.
       - Złożenie `GroupListItemDTO[]` i opakowanie w `PaginatedResponse`.
3) Handler GET
   - W `src/pages/api/groups/index.ts` dodaj `export const GET` analogicznie do stylu istniejącego `POST`:
     - 401 przy braku `locals.user`.
     - Walidacja query przez `listGroupsQuerySchema`.
     - Wywołanie `listGroups` i zwrócenie 200 z JSON.
4) Testy ręczne (HTTP)
   - `GET /api/groups`
   - `GET /api/groups?status=archived`
   - `GET /api/groups?limit=5&offset=5`
   - Walidacje: `limit=0`, `offset=-1`, `status=foo` => 400

## 10. Uwagi implementacyjne
- Zwracamy pełną listę aktywnych członków w polu `members` (do slidera avatarów). Frontend oblicza liczbę członków z `members.length`.
- `role` to rola zalogowanego użytkownika (z `group_members`). W `GroupMemberSummaryDTO` każdy członek ma również swoje `role`.
- `my_balance` zgodnie ze specyfikacją: paid - owed + settlements_in - settlements_out po przeliczeniu do waluty bazowej grupy.
- Format błędów i walidacji spójny z istniejącym `POST /api/groups`.
- Pole `member_count` zostało usunięte z `GroupListItemDTO` – nie jest potrzebne, bo frontend może policzyć awatary lub pokazać "+N" na ostatnim awatarze.


