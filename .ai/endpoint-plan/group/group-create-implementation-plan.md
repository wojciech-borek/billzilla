# API Endpoint Implementation Plan: POST /api/groups

## 1. Przegląd punktu końcowego

Punkt końcowy `POST /api/groups` jest przeznaczony do tworzenia nowej grupy rozliczeniowej. Użytkownik, który tworzy grupę, automatycznie staje się jej twórcą (`creator`) i pierwszym członkiem. Endpoint obsługuje również opcjonalne zapraszanie nowych członków poprzez listę adresów e-mail.

Kluczowe operacje:
-   Utworzenie rekordu w tabeli `groups`.
-   Dodanie twórcy do tabeli `group_members` z rolą `creator`.
-   Dodanie waluty bazowej grupy do tabeli `group_currencies` z kursem 1.0.
-   Powyższe trzy operacje muszą być wykonane w ramach jednej transakcji bazy danych, aby zapewnić spójność danych.
-   Opcjonalne przetwarzanie listy e-maili `invite_emails` w trybie "best-effort" (niepowodzenie tego kroku nie powinno anulować utworzenia grupy). W ramach tego kroku:
    -   Istniejący użytkownicy są dodawani bezpośrednio do grupy.
    -   Dla nowych użytkowników tworzone są zaproszenia w tabeli `invitations`.

## 2. Szczegóły żądania

-   **Metoda HTTP:** `POST`
-   **Struktura URL:** `/api/groups`
-   **Nagłówki:**
    -   `Authorization: Bearer {access_token}` (wymagane)
    -   `Content-Type: application/json` (wymagane)
-   **Request Body:**

    ```json
    {
      "name": "Wyjazd w góry",
      "base_currency_code": "PLN",
      "invite_emails": ["user1@example.com", "user2@example.com"]
    }
    ```

-   **Walidacja (Zod Schema):**
    -   `name`: `string`, `min(1)`, `max(100)`
    -   `base_currency_code`: `string`, `length(3)`
    -   `invite_emails`: `array(string().email())`, `max(20)`, `optional`

## 3. Wykorzystywane typy

-   **Command Model (Request):** `CreateGroupCommand`
-   **DTO (Response):** `CreateGroupResponseDTO`
-   **DTOs pomocnicze:** `InvitationResultDTO`, `AddedMemberDTO`, `CreatedInvitationDTO`

Wszystkie typy pochodzą z pliku `src/types.ts`.

## 4. Szczegóły odpowiedzi

-   **Odpowiedź sukcesu (201 Created):**

    ```json
    {
      "id": "a1b2c3d4-...",
      "name": "Wyjazd w góry",
      "base_currency_code": "PLN",
      "status": "active",
      "created_at": "2025-10-18T12:00:00Z",
      "role": "creator",
      "invitations": {
        "added_members": [
          {
            "profile_id": "e5f6g7h8-...",
            "email": "user1@example.com",
            "full_name": "Jan Kowalski",
            "status": "active"
          }
        ],
        "created_invitations": [
          {
            "id": "i9j0k1l2-...",
            "email": "user2@example.com",
            "status": "pending"
          }
        ]
      }
    }
    ```

-   **Odpowiedzi błędu:**
    -   `400 Bad Request`: Błąd walidacji danych wejściowych.
    -   `401 Unauthorized`: Użytkownik nie jest zalogowany.
    -   `422 Unprocessable Entity`: Podany kod waluty nie istnieje.
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera (np. błąd transakcji).

## 5. Przepływ danych

1.  **Handler API (`/pages/api/groups/index.ts`):**
    -   Sprawdza, czy użytkownik jest zalogowany (`Astro.locals.user`). Jeśli nie, zwraca `401`.
    -   Pobiera ciało żądania i waliduje je przy użyciu schemy `zod`. W przypadku błędu zwraca `400`.
    -   Sanityzuje listę `invite_emails`: usuwa duplikaty, konwertuje na małe litery, usuwa e-mail samego twórcy.
    -   Wywołuje funkcję `groupService.createGroup` z danymi z żądania i ID użytkownika.
    -   Mapuje wynik z serwisu na `CreateGroupResponseDTO` i zwraca odpowiedź `201`.
    -   Obsługuje błędy z serwisu i mapuje je na odpowiednie kody statusu HTTP.

2.  **Serwis (`/lib/services/groupService.ts`):**
    -   **Funkcja `createGroup(command, user)`:**
        -   Sprawdza, czy `base_currency_code` istnieje w tabeli `currencies`. Jeśli nie, rzuca błąd (`422`).
        -   Otwiera transakcję w Supabase (`supabase.rpc('create_group_and_add_creator', ...)` lub `supabase.from...` w ramach `Promise.all`).
            1.  `INSERT` do `groups`.
            2.  `INSERT` do `group_members` (użytkownik jako `creator`).
            3.  `INSERT` do `group_currencies` (waluta bazowa z kursem `1.0`).
        -   Jeśli transakcja się powiedzie, zatwierdza ją.
        -   Jeśli `invite_emails` istnieje, wywołuje wewnętrzną funkcję `handleInvitations`.
        -   Zwraca nowo utworzoną grupę oraz wyniki zaproszeń.
    -   **Funkcja `handleInvitations(groupId, emails)`:**
        1.  **Znajdź istniejących użytkowników:** `SELECT id, email, full_name FROM profiles WHERE email IN (...)`.
        2.  **Dodaj istniejących użytkowników:** `INSERT` do `group_members` (z `ON CONFLICT DO NOTHING`).
        3.  **Znajdź e-maile bez kont:** `emails` minus e-maile znalezione w kroku 1.
        4.  **Utwórz zaproszenia:** `INSERT` do `invitations` (z `ON CONFLICT DO NOTHING`).
        5.  Zwraca dwie listy: dodanych członków i utworzone zaproszenia.

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie:** Endpoint musi być chroniony, dostępny tylko dla zalogowanych użytkowników. Dane użytkownika będą pobierane z `Astro.locals.user`, co jest standardem w Astro.
-   **Autoryzacja:** Każdy zalogowany użytkownik może utworzyć grupę. Nie są wymagane dodatkowe uprawnienia.
-   **Walidacja danych:** `Zod` po stronie serwera zapobiega nieprawidłowym danym. Dodatkowa weryfikacja istnienia waluty chroni przed błędami integralności danych.
-   **Ochrona RLS:** Poprawne wstawienie `profile_id` twórcy do `group_members` jest kluczowe dla działania polityk Row-Level Security w Supabase.

## 7. Rozważania dotyczące wydajności

-   **Transakcje:** Użycie transakcji zapewnia spójność danych, ale powinna ona obejmować tylko minimalny, krytyczny zestaw operacji.
-   **Operacje masowe (Bulk Operations):** Logika zaproszeń musi używać operacji masowych (`SELECT ... WHERE email IN (...)`, `bulk INSERT`), aby zminimalizować liczbę zapytań do bazy danych i uniknąć pętli N+1.
-   **Zapytania:** Zapytania powinny być zoptymalizowane pod kątem użycia indeksów, zwłaszcza na kolumnie `email` w tabeli `profiles`.

## 8. Etapy wdrożenia

1.  **Utworzenie schemy walidacji Zod:**
    -   W nowym pliku `src/lib/schemas/groupSchemas.ts` zdefiniować `createGroupSchema`.

2.  **Implementacja serwisu `groupService`:**
    -   Utworzyć plik `src/lib/services/groupService.ts`.
    -   Zaimplementować funkcję `handleInvitations`, która wykonuje masowe operacje na bazie danych.
    -   Zaimplementować główną funkcję `createGroup`, która zarządza transakcją i deleguje obsługę zaproszeń.

3.  **Implementacja endpointu API:**
    -   Utworzyć plik `src/pages/api/groups/index.ts`.
    -   Dodać `export const prerender = false;`.
    -   Zaimplementować handler `POST`.
    -   W handlerze: sprawdzić sesję użytkownika, zwalidować body za pomocą `createGroupSchema`, wywołać `groupService.createGroup`.
    -   Dodać kompleksową obsługę błędów (`try...catch`) i zwracać odpowiednie kody statusu.

4.  **Testowanie:**
    -   **Przypadek podstawowy:** Utworzenie grupy bez zaproszeń.
    -   **Przypadek z zaproszeniami:** Utworzenie grupy z listą e-maili (mieszanka istniejących i nowych użytkowników).
    -   **Przypadki błędów:**
        -   Próba utworzenia grupy bez zalogowania (`401`).
        -   Przesłanie nieprawidłowych danych (`400`).
        -   Użycie nieistniejącego kodu waluty (`422`).
    -   **Przypadek krawędziowy:** Przesłanie pustej listy `invite_emails` lub listy z duplikatami/własnym e-mailem.

