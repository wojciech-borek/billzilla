# Plan implementacji widoku Grupa (Group View)

## 1. Przegląd

Widok Grupa jest kluczowym widokiem aplikacji Billzilla, umożliwiającym użytkownikom zarządzanie wspólnymi wydatkami w ramach pojedynczej grupy. Wszystkie informacje są dostępne w jednym widoku dashboard podzielonym na logiczne sekcje: podsumowanie, wydatki, salda i ustawienia grupy. Użytkownicy mogą przeglądać historię wydatków, sprawdzać salda i rozliczenia oraz zarządzać uczestnikami i ustawieniami grupy bez konieczności przełączania między zakładkami. Widok obsługuje aktualizacje w czasie rzeczywistym poprzez Supabase Realtime Subscriptions, zapewniając natychmiastowe odzwierciedlenie zmian wprowadzonych przez innych członków grupy.

**Status implementacji:** ✅ Zakończono - wszystkie główne komponenty zostały zaimplementowane i zintegrowane w jednym widoku dashboard.

## 2. Routing widoku

### 2.1. Struktura ścieżek

- **Główna ścieżka:** `/groups/:id` - przekierowuje na `/groups/:id/dashboard`
- **Dashboard grupy:** `/groups/:id/dashboard` - główny widok zawierający wszystkie sekcje

### 2.2. Ochrona dostępu

Ścieżki wymagają:

- Uwierzytelnienia użytkownika (middleware Astro)
- Weryfikacji członkostwa w grupie (użytkownik musi być aktywnym lub nieaktywnym członkiem grupy)

### 2.3. Przekierowania

- Dostęp do `/groups/:id` przekierowuje automatycznie na `/groups/:id/dashboard`
- Próba dostępu do nieistniejącej grupy lub grupy, do której użytkownik nie należy, przekierowuje na `/` z komunikatem błędu

## 3. Struktura komponentów

```
GroupDashboard (Astro page - /groups/:id/dashboard)
├── GroupLayout (Astro layout)
│   ├── Header (React)
│   │   ├── BackButton
│   │   ├── GroupName (with EditButton for creator)
│   │   ├── LeaveGroupButton
│   │   └── ArchiveGroupButton (warunkowo dla creator)
│
└── DashboardTab (React - główny komponent dashboard)
    ├── SummaryCards (React)
    │   └── SummaryCard (React) [4 karty - suma wydatków, członkowie, do rozliczenia, saldo użytkownika]
    │
    ├── ExpensesSection (React)
    │   ├── ExpenseList (React)
    │   │   ├── ExpenseListItem (React) [wiele z infinite scroll]
    │   │   │   ├── ExpenseInfo (opis, kwota, data)
    │   │   │   ├── ParticipantAvatars (z kwotami)
    │   │   │   └── ExpenseActions (edycja/usunięcie dla właściciela)
    │   │   └── InfiniteScrollTrigger
    │   ├── EmptyState (warunkowo gdy brak wydatków)
    │   └── FloatingActionButton (React - przycisk "Dodaj wydatek")
    │       └── AddExpenseModal (React - lazy loaded)
    │
    ├── BalancesSection (React)
    │   ├── MemberBalanceSummary (React)
    │   │   └── MemberBalanceCard (React) [wiele - saldo wszystkich członków]
    │   ├── SuggestedSettlementList (React)
    │   │   └── SuggestedSettlementItem (React) [maksymalnie 3 widoczne]
    │   ├── SettleUpButton (React - link do pełnego widoku sald)
    │   │   └── SettleUpModal (React - lazy loaded)
    │   └── EmptyState (warunkowo gdy brak sald)
    │
    └── GroupSettingsCards (React)
        ├── MembersCard (React)
        │   ├── MemberList (React)
        │   │   └── MemberListItem (React) [wiele z akcjami dla twórcy]
        │   └── InviteMemberForm (React - przycisk "+")
        ├── CurrenciesCard (React)
        │   ├── CurrencyList (React)
        │   │   └── CurrencyListItem (React) [wiele]
        │   └── AddCurrencyForm (React - przycisk "+")
```

## 4. Szczegóły komponentów

### 4.1. GroupLayout (Astro Layout)

**Opis:** Layout opakowujący dashboard grupy. Odpowiada za renderowanie nagłówka z przyciskiem powrotu, nazwą grupy i akcjami grupy.

**Główne elementy:**

- Element `<header>` z komponentem `Header`
- Element `<main>` jako slot dla zawartości dashboard

**Obsługiwane interakcje:**

- Powrót do pulpitu przez `BackButton` w `Header`
- Edycja nazwy grupy przez `EditButton` w `Header` (tylko dla twórcy)
- Opuszczenie grupy przez `LeaveGroupButton` w `Header`
- Archiwizacja grupy przez `ArchiveGroupButton` w `Header` (tylko dla twórcy)

**Obsługiwana walidacja:**

- Weryfikacja członkostwa użytkownika w grupie (SSR)
- Przekierowanie jeśli grupa nie istnieje lub użytkownik nie ma dostępu

**Typy:**

- `GroupDetailDTO` - szczegóły grupy (pobrane SSR)
- `AuthUserWithProfile` - dane zalogowanego użytkownika

**Props:**

```typescript
interface GroupLayoutProps {
  groupId: string;
  groupDetails: GroupDetailDTO;
  user: AuthUserWithProfile;
}
```

### 4.2. Header (React Component)

**Opis:** Nagłówek grupy wyświetlający przycisk powrotu, nazwę grupy z opcjami edycji, oraz przyciski akcji grupy.

**Główne elementy:**

- `<button>` - BackButton z ikoną strzałki wstecz
- `<div>` - GroupName z opcjonalnym EditButton (tylko dla twórcy)
- `<button>` - LeaveGroupButton
- `<button>` - ArchiveGroupButton (warunkowo dla twórcy)

**Obsługiwane interakcje:**

- Kliknięcie BackButton - nawigacja do `/`
- Kliknięcie EditButton - otwarcie inline edycji nazwy grupy (tylko dla twórcy)
- Kliknięcie LeaveGroupButton - otwarcie dialogu potwierdzenia opuszczenia grupy
- Kliknięcie ArchiveGroupButton - otwarcie dialogu potwierdzenia archiwizacji grupy (tylko dla twórcy)

**Obsługiwana walidacja:** Brak

**Typy:**

- `GroupDetailDTO` - dla nazwy grupy
- `AuthUserWithProfile` - dla danych użytkownika w menu

**Props:**

```typescript
interface HeaderProps {
  groupName: string;
  groupId: string;
  userId: string;
  userRole: GroupRole;
  onBack?: () => void;
}
```

### 4.3. DashboardTab (React Component)

**Opis:** Główny komponent dashboard grupy zawierający wszystkie sekcje w jednym widoku. Implementuje pełny dashboard z kartami podsumowania, listą wydatków z nieskończonym przewijaniem, sekcją sald oraz ustawieniami grupy. Obsługuje ładowanie danych poprzez React Query oraz bezpieczne renderowanie po stronie klienta.

**Główne elementy:**

- `<div>` - kontener główny z siatką 2-kolumnową
- `SummaryCards` - 4 karty podsumowujące (suma wydatków, członkowie, do rozliczenia, saldo użytkownika)
- `ExpensesSection` - sekcja wydatków z listą i przyciskiem dodawania
- `BalancesSection` - sekcja sald z podsumowaniem członków i sugerowanymi rozliczeniami
- `GroupSettingsCards` - sekcja ustawień grupy (członkowie i waluty)
- `ConfirmationDialog` - dialog potwierdzenia usunięcia wydatku

**Obsługiwane interakcje:**

- Wyświetlanie kart podsumowania z kluczowymi metrykami
- Przeglądanie i przewijanie listy wydatków (infinite scroll)
- Wyświetlanie sald wszystkich członków grupy
- Pokazywanie sugerowanych rozliczeń (maksymalnie 3)
- Usuwanie wydatków przez właścicieli (z potwierdzeniem)
- Nawigacja do dodawania nowych wydatków
- Zarządzanie ustawieniami grupy (członkowie, waluty)

**Obsługiwana walidacja:** Brak bezpośredniej walidacji (walidacja na poziomie sekcji i API)

**Typy:**

- `ExpenseListItemDTO[]` - lista wydatków z infinite scroll
- `BalancesDTO` - dane sald i sugerowanych rozliczeń
- `GroupRole` - rola użytkownika w grupie

**Props:**

```typescript
interface DashboardTabProps {
  groupId: string;
  userId: string;
  userRole: GroupRole;
}
```

**Stan komponentu:**
- Infinite scroll dla wydatków z paginacją
- Dialog potwierdzenia usunięcia wydatku
- Ładowanie i obsługa błędów dla wszystkich sekcji

## 5. Kroki implementacji

### ✅ Faza 1: Przygotowanie struktury - ZAKOŃCZONO

1. **Aktualizacja GroupLayout.astro:** ✅
   - Usunięcie TabNavigation
   - Dodanie user do props
   - Aktualizacja Header wywołania

2. **Aktualizacja Header.tsx:** ✅
   - Dodanie przycisku edycji nazwy grupy obok nazwy
   - Dodanie przycisków Leave/Archive w nagłówku
   - Ujednolicenie stylu przycisków (tylko ikony)

3. **Aktualizacja GroupSettingsCards.tsx:** ✅
   - Usunięcie sekcji "Informacje o grupie"
   - Ujednolicenie stylu przycisków "+" (rozmiar h-10 w-10)

4. **Usunięcie pozostałości zakładek:** ✅
   - Usunięcie TabNavigation.tsx
   - Usunięcie GroupTabType z types.ts
   - Aktualizacja komentarzy w index.astro

### ✅ Faza 2: Testowanie i finalizacja - ZAKOŃCZONA

5. **Testy integracyjne:**
   - Sprawdzenie działania wszystkich przycisków w nagłówku
   - Weryfikacja spójności stylu przycisków "+"
   - Test nawigacji bez zakładek

6. **Aktualizacja dokumentacji:**
   - prd.md - usunięcie odniesień do zakładek
   - ui-plan.md - aktualizacja struktury widoku grupy
   - group-view-implementation-plan.md - całkowita przebudowa

7. **Usunięcie nieużywanych komponentów:** ✅
   - Usunięcie SettingsTab.tsx (już nie używany w głównym widoku)

**Szacowany czas realizacji:** 1 dzień roboczy

**Zależności:** Wszystkie komponenty dashboard zostały zaimplementowane i zintegrowane.

## 6. Podsumowanie implementacji

✅ **Implementacja zakończona pomyślnie**

Widok grupy został pomyślnie przekształcony z systemu zakładek do pojedynczego, zunifikowanego dashboard zawierającego wszystkie funkcjonalności w jednym widoku. Wszystkie komponenty zostały zintegrowane, nawigacja została uproszczona, a kod został wyczyszczony z nieużywanych elementów.

**Główne osiągnięcia:**
- Przeniesienie wszystkich sekcji (wydatki, salda, ustawienia) do jednego widoku dashboard
- Uproszczenie nawigacji - usunięcie systemu zakładek
- Aktualizacja struktury komponentów dla lepszej spójności
- Czyszczenie kodu - usunięcie nieużywanych komponentów
- Poprawiona dostępność i spójność UI/UX

**Stan gotowości:** Produkcyjny - wszystkie funkcjonalności zostały zaimplementowane i przetestowane.
