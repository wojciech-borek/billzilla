## Plan implementacji widoku Utwórz grupę (Create Group Modal)

## 1. Przegląd

Widok w formie modalnego okna dialogowego, które pozwala utworzyć nową grupę rozliczeniową. Użytkownik podaje nazwę grupy, wybiera walutę bazową i opcjonalnie wpisuje listę e‑maili do zaproszenia. Po sukcesie grupa jest utworzona, twórca staje się jej członkiem (rola "creator"), a zaproszenia są przetwarzane w trybie best‑effort.

Cele:

- Szybkie utworzenie grupy zgodnie z PRD (US-002, F-018, F-021/US-013 akcja z pulpitu).
- Walidacja po stronie klienta spójna z API.
- Integracja z `POST /api/groups` i prezentacja wyników zaproszeń.

## 2. Routing widoku

- Modal dostępny zarówno na `/` (strona główna), jak i na `/groups/:id` (podgląd grupy).
- Otwieranie modala sterowane parametrem URL: `?modal=create-group`.
  - Wejście na `/?modal=create-group` lub `/groups/:id?modal=create-group` otwiera modal.
  - Zamknięcie modala usuwa parametr z URL (replace/push history zgodnie z kontekstem).
- Alternatywnie (opcjonalnie): wsparcie dla otwierania wyłącznie stanem lokalnym (bez URL). Rekomendowane jest jednak użycie parametru URL dla deep-linku i obsługi back/forward.
- Nie tworzymy oddzielnej trasy typu `/create/group` – modal pozostaje nakładką na aktualny widok.

## 3. Struktura komponentów

```
DashboardView (istniejący) / GroupDetailView (istniejący)
└─ CreateGroupModal (React)
   ├─ CreateGroupForm
   │  ├─ NameField
   │  ├─ BaseCurrencySelect
   │  ├─ InviteEmailsInput
   │  │  └─ InviteEmailChip*
   │  ├─ SubmitButton
   │  └─ CancelButton
   └─ FormLevelError

* komponent prosty/niższej rangi może być zagnieżdżony w polu wejściowym
```

## 4. Szczegóły komponentów

### CreateGroupModal

- Opis: Kontener modalny z nagłówkiem, treścią (formularz) i stopką akcji.
- Główne elementy: `Dialog` (shadcn/ui), `DialogHeader`, `DialogContent`, `DialogFooter`.
- Obsługiwane interakcje: otwarcie/zamknięcie, zamknięcie po ESC i kliknięciu tła, anulowanie.
- Walidacja: brak własnej; deleguje do `CreateGroupForm`.
- Typy: `CreateGroupFormValues`, zdarzenia: `onClose`, `onSuccess(groupId)`.
- Propsy: `{ open: boolean; onOpenChange(open: boolean): void }`.

### CreateGroupForm

- Opis: Formularz oparty na React Hook Form, obsługujący wysyłkę do API i renderujący błędy pól.
- Główne elementy: `form`, `NameField`, `BaseCurrencySelect`, `InviteEmailsInput`, przyciski.
- Interakcje: submit, reset/anuluj, dodawanie/usuwanie e‑maili.
- Walidacja (klient):
  - `name`: wymagane, długość 1–100.
  - `base_currency_code`: wymagane, dokładnie 3 litery (A–Z).
  - `invite_emails`: opcjonalne, maks. 20; każdy poprawny e‑mail; unikalne (case‑insensitive); bez e‑maila zalogowanego użytkownika; trymowane i znormalizowane do lowercase.
- Typy: `CreateGroupFormValues`, `CreateGroupCommand`, `CreateGroupResponseDTO`.
- Propsy: `{ onCancel(): void; onSuccess(result: CreateGroupSuccessResult): void }`.

### NameField

- Opis: Pole tekstowe nazwy grupy z walidacją długości i wymagalności.
- Elementy: `Label`, `Input`, komunikaty błędów.
- Interakcje: onChange, onBlur.
- Walidacja: jak wyżej (1–100, required).
- Propsy: przekazywane przez RHF (`register`, `formState.errors`).

### BaseCurrencySelect

- Opis: Select waluty bazowej (kody ISO 4217) ładowany z tabeli walut (endpoint/kwerenda). PLN ma być listowany jako pierwszy i ustawiany jako domyślnie zaznaczony.
- Elementy: `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` (shadcn/ui).
- Interakcje: wybór pozycji, filtrowanie (opcjonalnie), focus/blur.
- Walidacja: required, pattern `^[A-Z]{3}$`. Błąd 422 z API mapowany na błąd pola.
- Propsy: `{ options: CurrencyOption[]; defaultCode?: string }` + RHF kontrola (`control`, `name`).

### InviteEmailsInput

- Opis: Pole z listą "chips" do wpisywania wielu e‑maili (enter/komentarz/średnik/blur = commit). MVP: akceptujemy swobodne wpisywanie e‑maili; backend dopasuje istniejących użytkowników i utworzy zaproszenia dla pozostałych.
- Elementy: `Input`, lista chipów (`InviteEmailChip`), przycisk wyczyszczenia (opc.).
- Interakcje: dodaj e‑mail, usuń chip, walidacja natychmiastowa, deduplikacja, limit 20.
- Walidacja: RFC 5322 (praktyczny regex); unikalność; max 20; brak własnego e‑maila.
- Propsy: `{ value: string[]; onChange(next: string[]): void; errors?: string }` lub integracja z RHF Controller.
- Uwaga (rozszerzenie opcjonalne): można dodać typeahead (debounce) do podpowiedzi istniejących użytkowników po e‑mailu/napisie – nie wymagane w MVP.

### SubmitButton / CancelButton

- Opis: Przyciski akcji formularza.
- Elementy: `Button` (shadcn/ui), stan `loading` podczas wysyłki.
- Interakcje: `onClick` submit/anuluj; `disabled` przy błędach/ładowaniu.
- Walidacja: submit zablokowany, jeśli formularz nieważny lub trwa request.
- Propsy: sterowane przez RHF i `isSubmitting`.

### FormLevelError

- Opis: Pasek błędu na poziomie formularza dla błędów ogólnych (np. 500, sieć).
- Elementy: `Alert`/`Callout` (shadcn/ui), treść komunikatu.
- Interakcje: zamknięcie (opcjonalnie), automatyczne ukrycie po poprawie.

## 5. Typy

- DTO (z `src/types.ts`):
  - `CreateGroupCommand`: `{ name: string; base_currency_code: string; invite_emails?: string[] }`.
  - `CreateGroupResponseDTO`: `Group & { role: GroupRole; invitations: InvitationResultDTO }`.
  - `InvitationResultDTO`: `{ added_members: AddedMemberDTO[]; created_invitations: CreatedInvitationDTO[] }`.
  - `AddedMemberDTO`, `CreatedInvitationDTO` – do prezentacji wyników zaproszeń (liczby, szczegóły).
- Nowe ViewModel:
  - `CreateGroupFormValues`:
    - `name: string`
    - `base_currency_code: string` (ISO 4217, 3 znaki)
    - `invite_emails: string[]` (<= 20)
  - `CurrencyOption`:
    - `code: string` (np. "PLN")
    - `label: string` (np. "PLN — Polish Zloty")
  - `CreateGroupSuccessResult`:
    - `groupId: string`
    - `groupName: string`
    - `baseCurrency: string`
    - `invitations: InvitationResultDTO`

## 6. Zarządzanie stanem

- Lokalny stan formularza: React Hook Form + Zod resolver dla spójności z backendem.
- Stan modala: synchronizacja z URL param `modal=create-group` na `/` i `/groups/:id`; alternatywnie lokalny stan (fallback bez deep-linku).
- Ładowanie walut: `useCurrenciesList()` – pobierz listę z tabeli walut; posortuj tak, by `PLN` był pierwszy; ustaw `defaultCode="PLN"` i wstępnie zaznacz tę opcję w formularzu.
- Mutacja tworzenia: `useCreateGroupMutation()` – kapsułkuje `fetch('/api/groups', { method: 'POST' ... })`, zarządza `isLoading`, `error`, retry (opc.).

## 7. Integracja API

- Endpoint: `POST /api/groups`.
- Nagłówki: `Content-Type: application/json`; autoryzacja oparta o sesję przeglądarki (Astro API route). Jeśli wymagany Bearer, pobór z klienta (zależne od auth implementacji w projekcie).
- Request body: `CreateGroupCommand`.
- Odpowiedź (201): `CreateGroupResponseDTO`.
- Błędy:
  - `400`: walidacja – mapować do błędów pól (z `details` jeśli dostępne).
  - `401`: brak sesji – komunikat + przekierowanie na logowanie.
  - `422`: nieistniejący kod waluty – błąd pola `base_currency_code`.
  - `500`: komunikat ogólny + opcja ponów.

## 8. Interakcje użytkownika

- Otwórz modal: klik przycisku „Utwórz grupę" na `/` (strona główna) lub w podglądzie grupy (`/groups/:id`). Oba przypadki ustawiają `?modal=create-group` w URL.
- Wpisywanie nazwy: inline walidacja długości i wymagalności.
- Wybór waluty: lista opcji z bazy; `PLN` wyświetlany jako pierwszy i domyślnie zaznaczony.
- Dodawanie e‑maili: enter/średnik/przecinek/blur dodaje chip; błędne e‑maile odrzucane z komunikatem; backend dopasowuje użytkowników lub tworzy zaproszenia.
- Usuwanie e‑maili: klik na `×` w chipie.
- Zapis: przycisk „Utwórz”; w trakcie disabled + spinner; po sukcesie modal się zamyka (parametr usuwany z URL), toast sukcesu oraz:
  - albo przekierowanie do widoku grupy `/groups/:id` (jeśli dostępny),
  - albo odświeżenie listy grup na pulpicie i focus na nowej grupie.

## 9. Warunki i walidacja

- `name`: required; `length 1–100`.
- `base_currency_code`: required; `^[A-Z]{3}$`; dodatkowo błąd 422 z serwera → error tego pola.
- `invite_emails`: optional; `<= 20`; każdy `isEmail`; unikalność case‑insensitive; usuń e‑mail zalogowanego użytkownika; normalizacja `trim().toLowerCase()`.
- Blokada submitu, gdy formularz nieważny lub trwa request.

## 10. Obsługa błędów

- Sieć/500: banner/alert na formularzu + możliwość ponowienia.
- 400: prezentacja przy polach z komunikatami; focus na pierwszym błędnym polu.
- 401: toast + przekierowanie do logowania.
- 422: komunikat pod selectem waluty "Nieznany kod waluty".
- Best‑effort zaproszeń: nawet przy częściowych niepowodzeniach tworzenie grupy nie jest cofane; w toście/po zapisie pokaż podsumowanie: ilu dodano, ile zaproszeń utworzono.

## 11. Kroki implementacji

1. Utwórz komponent `CreateGroupModal` w `src/components/dashboard/` (React + shadcn/ui `Dialog`).
2. Zaimplementuj `CreateGroupForm` z React Hook Form + Zod schema (klient) spójną z backendem.
3. Dodaj `NameField`, `BaseCurrencySelect`, `InviteEmailsInput` (z chipami) jako podkomponenty.
4. Dodaj hook `useCurrenciesList()` – pobierz waluty z bazy, posortuj `PLN` na początek i ustaw jako domyślny wybór w formularzu.
5. Dodaj hook `useCreateGroupMutation()` kapsułkujący wywołanie `POST /api/groups` i mapowanie błędów.
6. Zepnij modal ze stanem URL `?modal=create-group` na `/` i `/groups/:id` (otwarcie/ zamknięcie modyfikuje URL przez push/replace).
7. Po sukcesie: zamknij modal, usuń parametr z URL, pokaż toast, odśwież listę grup; jeśli istnieje trasa grupy – przekieruj do `/groups/:id`.
8. Dodaj testy jednostkowe dla walidacji (Zod) i komponentu chipów e‑maili; test integracyjny mutacji (mock fetch).
9. Przegląd UX: focus management, klawisze, role ARIA w `Dialog`, komunikaty błędów.
10. Przegląd dostępności i responsywności (mobile first, klawiatura, czytniki ekranu).
