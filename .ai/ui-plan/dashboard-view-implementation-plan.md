# Plan implementacji widoku Dashboard

## 1. Przegląd
Widok Dashboard prezentuje po zalogowaniu dwie niezależnie ładowane sekcje: listę oczekujących zaproszeń do grup oraz listę grup, do których należy użytkownik. Zapewnia szybkie akcje (akceptacja/odrzucenie zaproszenia, przejście do grupy, skrót „Dodaj wydatek”) oraz globalny stan pusty, gdy użytkownik nie ma ani grup, ani zaproszeń.

Cele:
- Szybki wgląd w bieżące grupy i zaproszenia.
- Niezależne ładowanie danych każdej sekcji (lepsza responsywność).
- Spójne UI z Tailwind 4 i shadcn/ui.

Założenia i zgodność:
- Zgodne z PRD (US-013) i planem endpointu GET /api/groups.
- Uwierzytelnienie przez middleware; widok dostępny tylko dla zalogowanych.
- Bazowanie na typach z `src/types.ts` (GroupListItemDTO, InvitationDTO itd.).

## 2. Routing widoku
- Ścieżka: `/dashboard` (główny widok po zalogowaniu).
- Plik strony: `src/pages/dashboard.astro` z układem `src/layouts/Layout.astro`.
- Ochrona dostępu: wykorzystanie istniejącego middleware `src/middleware/index.ts` (wymaga `locals.user`). W przypadku 401 na żądaniach sekcji – wyświetlić komunikat i przekierować do logowania.

## 3. Struktura komponentów
```text
DashboardView (React Island)
├─ DashboardHeaderActions (opcjonalnie)
├─ InvitationsSection
│  ├─ InvitationCard (lista)
│  └─ SectionEmptyState (gdy brak zaproszeń)
├─ GroupsSection
│  ├─ GroupCard (lista)
│  │  └─ AvatarList
│  └─ SectionEmptyState (gdy brak grup)
├─ DashboardEmptyState (gdy obie sekcje puste)
└─ FloatingActionButton ("Utwórz grupę")
```

Lokalizacja plików (propozycja):
- `src/pages/dashboard.astro` – strona Astro osadzająca `DashboardView` jako wyspę React.
- `src/components/dashboard/DashboardView.tsx`
- `src/components/dashboard/InvitationsSection.tsx`
- `src/components/dashboard/InvitationCard.tsx`
- `src/components/dashboard/GroupsSection.tsx`
- `src/components/dashboard/GroupCard.tsx`
- `src/components/dashboard/AvatarList.tsx`
- `src/components/dashboard/SectionEmptyState.tsx`
- `src/components/dashboard/FloatingActionButton.tsx`
- `src/components/dashboard/hooks/useGroupsList.ts`
- `src/components/dashboard/hooks/useInvitationsList.ts`

## 4. Szczegóły komponentów
### DashboardView
- Opis: Główny komponent widoku, koordynuje dwie niezależne sekcje, zarządza globalnym stanem pustym i wspólnymi interakcjami (np. odświeżenie po akceptacji zaproszenia).
- Główne elementy: nagłówek sekcji, siatka dwóch bloków (Zaproszenia, Twoje grupy), FAB.
- Obsługiwane interakcje:
  - Refetch obu sekcji po akcji w zaproszeniach (akceptacja/odrzucenie).
  - Nawigacje do podstron (grupa, nowa grupa, nowy wydatek).
- Walidacja: brak walidacji formularzowej; walidacja stanów i błędów żądań.
- Typy: `DashboardViewState`, `GroupsQueryState`, `InvitationsQueryState` (sekcja Typy).
- Propsy:
  - Brak (dane ładowane wewnątrz poprzez hooki). Opcjonalnie parametry konfiguracyjne: `groupsLimit?: number`, `groupsOffset?: number`.

### InvitationsSection
- Opis: Pobiera i wyświetla listę zaproszeń użytkownika. Umożliwia akcje „Akceptuj” i „Odrzuć”.
- Główne elementy: lista `InvitationCard`, stan ładowania, błąd, pustka.
- Obsługiwane interakcje:
  - Klik „Akceptuj” -> POST `/api/invitations/:id/accept` -> odświeżenie zaproszeń i grup.
  - Klik „Odrzuć” -> POST `/api/invitations/:id/decline` -> odświeżenie zaproszeń.
- Walidacja:
  - Debounce/lock akcji: przycisk disabled podczas trwającego żądania.
  - Idempotencja UI: jeśli żądanie zakończy się 2xx, karta znika; jeśli 4xx/5xx – pozostaje i pokaż błąd.
- Typy: `InvitationDTO` (z `src/types.ts`), `InvitationCardVM` (sekcja Typy).
- Propsy:
  - `onChanged?: () => void` – callback do poinformowania `DashboardView` o zmianie (refetch grup).

### InvitationCard
- Opis: Pojedyncza karta zaproszenia z nazwą grupy i akcjami.
- Główne elementy: tytuł (nazwa grupy), metadane (np. data), przyciski „Akceptuj” i „Odrzuć”.
- Obsługiwane interakcje: wywołania akcji sekcji z propagacją stanu „loading”.
- Walidacja: blokada wielokrotnego kliknięcia; obsługa błędów API.
- Typy: `InvitationCardVM`.
- Propsy:
  - `invitation: InvitationCardVM`
  - `onAccept: (id: string) => Promise<void>`
  - `onDecline: (id: string) => Promise<void>`
  - `disabled?: boolean`

### GroupsSection
- Opis: Pobiera i prezentuje listę grup użytkownika zwracanych przez GET `/api/groups` wraz z polami obliczanymi.
- Główne elementy: siatka `GroupCard`, stan ładowania, błąd, pustka.
- Obsługiwane interakcje:
  - Klik karty: przejście do `/groups/:id`.
  - Szybka akcja „Dodaj wydatek”: przejście do `/groups/:id/expenses/new`.
- Walidacja: brak formularzowej; poprawne mapowanie pól DTO do widoku; odporność na `null` w `full_name`/`avatar_url`.
- Typy: `GroupListItemDTO` (z `src/types.ts`), `GroupCardVM` (sekcja Typy).
- Propsy:
  - `query: { status?: 'active' | 'archived'; limit?: number; offset?: number }`
  - `onChanged?: () => void` (opcjonalne, do przyszłych akcji wpływających na listę)

### GroupCard
- Opis: Karta grupy z nazwą, saldem użytkownika i listą avatarów członków.
- Główne elementy: nazwa, znacznik roli, licznik członków, saldo (kolorystyka +/−), `AvatarList`, przycisk „Dodaj wydatek”.
- Obsługiwane interakcje: klik w kartę (nawigacja), klik w „Dodaj wydatek”.
- Walidacja: formatowanie liczb/waluty bazowej; kolor na podstawie znaku salda.
- Typy: `GroupCardVM`.
- Propsy:
  - `group: GroupCardVM`
  - `onOpen?: (id: string) => void`
  - `onQuickAddExpense?: (id: string) => void`

### AvatarList
- Opis: Wyświetla kilka pierwszych avatarów i znacznik „+N”.
- Główne elementy: avatar image lub placeholder z inicjałami, licznik pozostałych.
- Obsługiwane interakcje: tooltip nad „+N”.
- Walidacja: fallback obrazu; skracanie imion do inicjałów.
- Typy: `AvatarVM`.
- Propsy:
  - `avatars: AvatarVM[]`
  - `maxVisible?: number` (domyślnie 5)

### SectionEmptyState
- Opis: Pusty stan sekcji (np. „Brak zaproszeń”).
- Propsy: `title: string`, `description?: string`, `action?: { label: string; onClick: () => void }`

### DashboardEmptyState
- Opis: Globalny pusty stan, wyświetlany, gdy nie ma ani zaproszeń, ani grup.
- Zawartość: komunikat i CTA do utworzenia pierwszej grupy.

### FloatingActionButton
- Opis: Pływający przycisk do tworzenia nowej grupy.
- Propsy: `onClick: () => void`
- Działanie: nawigacja do `/groups/new` (lub otwarcie modala – poza zakresem widoku). 

## 5. Typy
Wykorzystanie typów z `src/types.ts`:
- `GroupListItemDTO`: dane grupy + `role`, `member_count`, `my_balance`, `members`.
- `GroupMemberSummaryDTO`: `{ profile_id, full_name, avatar_url, status }`.
- `PaginatedResponse<T>`: wrapper odpowiedzi listowej.
- `InvitationDTO`: `{ ...invitation, group: { id, name } }` (bez e-maili). 
- `AcceptInvitationResponseDTO`, `DeclineInvitationResponseDTO` do akcji na zaproszeniach.

Nowe ViewModel-e (mapowane w warstwie prezentacji):
```ts
export type AvatarVM = {
  profileId: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type GroupCardVM = {
  id: string;
  name: string;
  baseCurrencyCode: string;
  role: string; // GroupRole
  memberCount: number;
  myBalance: number; // w walucie bazowej
  avatars: AvatarVM[]; // z GroupMemberSummaryDTO[]
};

export type InvitationCardVM = {
  id: string;
  groupId: string;
  groupName: string;
  createdAt?: string; // jeżeli dostępne w Invitation
  invitedByName?: string | null; // opcjonalnie, jeśli backend doda pole
};

export type GroupsQueryState = {
  data: GroupCardVM[];
  total: number;
  limit: number;
  offset: number;
  loading: boolean;
  error: string | null;
};

export type InvitationsQueryState = {
  data: InvitationCardVM[];
  loading: boolean;
  error: string | null;
};

export type DashboardViewState = {
  hasAnyGroups: boolean;
  hasAnyInvitations: boolean;
};
```

Mapowanie DTO→VM:
- GroupListItemDTO → GroupCardVM: przeniesienie pól + transformacja `members` → `avatars` (pierwsze N).
- InvitationDTO → InvitationCardVM: `id`, `group.id`, `group.name`, ewentualne dodatkowe metadane z invitation.

## 6. Zarządzanie stanem
- Hooki:
  - `useGroupsList({ status = 'active', limit = 50, offset = 0 })` – pobiera `PaginatedResponse<GroupListItemDTO>`, mapuje do `GroupCardVM[]`, zarządza loading/error, expose `refetch()`.
  - `useInvitationsList()` – pobiera `InvitationDTO[]`, mapuje do `InvitationCardVM[]`, zarządza loading/error, expose `refetch()` oraz metody akcji: `accept(id)`, `decline(id)`.
- Koordynacja stanu pustego:
  - `DashboardView` nasłuchuje wyników obu hooków i jeśli obie listy są puste (i nie ładują się) – wyświetla `DashboardEmptyState` zamiast sekcji.
- Optymalizacje:
  - Równoległe pobrania (sekcje niezależne).
  - Re-fetch grup po akceptacji zaproszenia.
  - Ewentualnie prefetch nawigacji do grupy.

## 7. Integracja API
- Grupy: `GET /api/groups`
  - Parametry query: `status?: 'active'|'archived'`, `limit?: 1..100`, `offset?: >=0`.
  - Odpowiedź: `PaginatedResponse<GroupListItemDTO>`.
  - Obsługa błędów: 400 (walidacja parametrów), 401 (brak autoryzacji), 500 (błąd serwera).

- Zaproszenia:
  - Lista: `GET /api/invitations` → `InvitationDTO[]` (na podstawie typów w `src/types.ts`).
  - Akceptacja: `POST /api/invitations/:id/accept` → `AcceptInvitationResponseDTO`.
  - Odrzucenie: `POST /api/invitations/:id/decline` → `DeclineInvitationResponseDTO`.

Nagłówki: `Authorization: Bearer {access_token}` – po stronie serwera zapewnione przez middleware; na froncie standardowe fetch do ścieżek `/api/...`.

## 8. Interakcje użytkownika
- Akceptuj zaproszenie:
  - Klik przycisku „Akceptuj” na `InvitationCard` → pokaż stan `loading` na karcie → po 2xx usuń kartę, pokaż toast „Dołączono do grupy”, wywołaj `onChanged()` by odświeżyć listę grup.
- Odrzuć zaproszenie:
  - Klik „Odrzuć” → `loading` → po 2xx usuń kartę, pokaż toast „Zaproszenie odrzucone”.
- Otwórz grupę:
  - Klik `GroupCard` → nawigacja do `/groups/:id`.
- Dodaj wydatek (szybka akcja):
  - Klik „Dodaj wydatek” → nawigacja do `/groups/:id/expenses/new`.
- Utwórz nową grupę:
  - FAB → nawigacja do `/groups/new`.

## 9. Warunki i walidacja
- Parametry zapytań grup: komponent ogranicza `limit` do 1–100, `offset` ≥ 0, `status` w {active, archived}.
- Blokady akcji przy trwających żądaniach (zaproszenia) – disable przyciski i pokaż spinner.
- Formatowanie salda: liczba w walucie bazowej grupy, kolor: zielony (>0), czerwony (<0), neutralny (=0).
- Avatar fallback: brak `avatar_url` → inicjały z `full_name` lub placeholder.
- Globalny pusty stan wyłącznie gdy obie listy puste i nie w trakcie ładowania.

## 10. Obsługa błędów
- 401 Unauthorized: pokaż komunikat „Sesja wygasła” i przekieruj do logowania.
- 400 Bad Request (grupy): pokaż inline error w sekcji i przycisk „Spróbuj ponownie”.
- 500 Internal Server Error: toast + inline error; umożliw retry.
- Błędy sieci: retry z backoffem (prosty `setTimeout`) i przycisk „Ponów”.
- Akcje zaproszeń: jeśli błąd, odblokuj przyciski i pokaż komunikat na karcie.

## 11. Kroki implementacji
1) Utwórz stronę `src/pages/dashboard.astro` i osadź `DashboardView` (React Island) wewnątrz `Layout.astro`.
2) Zaimplementuj `DashboardView.tsx` z układem dwóch sekcji i FAB. Zaplanuj miejsca na stany: loading/error/empty.
3) Zaimplementuj hook `useGroupsList` (fetch GET `/api/groups`, mapowanie do `GroupCardVM`, stany, `refetch`).
4) Zaimplementuj hook `useInvitationsList` (fetch GET `/api/invitations`, akcje `accept/decline`, stany, `refetch`).
5) Zbuduj `GroupsSection.tsx` (siatka kart, skeletony, empty state, obsługa błędów, nawigacje).
6) Zbuduj `GroupCard.tsx` (nazwa, saldo, `AvatarList`, przycisk „Dodaj wydatek”).
7) Zbuduj `InvitationsSection.tsx` (lista kart, skeletony, empty state, błędy, delegacja akcji).
8) Zbuduj `InvitationCard.tsx` (UI przycisków, lock stanu, komunikaty błędów).
9) Dodaj `AvatarList.tsx` i `SectionEmptyState.tsx` (wspólne komponenty sekcji).
10) Dodaj `FloatingActionButton.tsx` (wykorzystaj `src/components/ui/button.tsx` lub tailwindowy okrągły przycisk z `aria-label`).
11) Formatowanie liczb/walut: util w `src/lib/utils.ts` (np. `formatCurrency(amount, code)`).
12) Dodaj obsługę 401 (globalny handler fetch lub w hookach) – redirect do logowania.
13) Stylowanie Tailwind 4: responsywny układ, dostępność (focus states, aria-live dla zmian list).
14) Testy ręczne: 
    - Brak danych → globalny pusty stan.
    - Tylko zaproszenia → tylko sekcja zaproszeń.
    - Tylko grupy → tylko sekcja grup.
    - Błędy 400/401/500 → komunikaty i retry.
    - Akceptacja/odrzucenie → aktualizacja UI i odświeżenie grup.


