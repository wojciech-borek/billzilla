# Plan implementacji widoku Archiwizacji Grupy (Group Archive)

## 1. Przegląd

Funkcja archiwizacji grupy umożliwia twórcy grupy jej trwałe zarchiwizowanie (soft delete). Jest to nieodwracalna operacja, która zmienia status grupy z `active` na `archived`, przy czym wszystkie dane finansowe i historia wydatków pozostają zachowane. Zarchiwizowana grupa nie pojawia się na domyślnej liście grup użytkownika. Funkcja jest dostępna wyłącznie z poziomu widoku szczegółów grupy, w nagłówku (Header), dla użytkownika z rolą `creator`.

## 2. Routing widoku

Funkcja archiwizacji nie wymaga nowej ścieżki routingu. Jest zintegrowana z istniejącym widokiem grupy:

- **Ścieżka:** `/groups/:id/dashboard`
- **Dostęp:** Przycisk archiwizacji widoczny tylko dla użytkownika z rolą `creator`

## 3. Struktura komponentów

```
GroupLayout (Astro layout - /groups/:id/dashboard)
├── Header (React)
│   ├── BackButton
│   ├── GroupName (with EditButton for creator)
│   ├── LeaveGroupButton
│   └── ArchiveGroupButton (warunkowo dla creator)  ← implementacja
│       └── ArchiveConfirmationDialog (inline w Header)
│
└── DashboardTab (React - główny komponent dashboard)
    └── ... (istniejące komponenty)
```

## 4. Szczegóły komponentów

### 4.1. Header (modyfikacja istniejącego komponentu)

**Opis:** Nagłówek grupy wyświetlający przycisk powrotu, nazwę grupy i akcje grupy. Modyfikacja obejmuje implementację funkcji archiwizacji z dialogiem potwierdzenia.

**Główne elementy:**
- `<button>` - BackButton z ikoną strzałki wstecz
- `<div>` - GroupName z opcjonalnym EditButton (tylko dla twórcy)
- `<button>` - LeaveGroupButton
- `<button>` - ArchiveGroupButton (warunkowo dla twórcy) ← do implementacji
- `<ConfirmationDialog>` - Dialog potwierdzenia archiwizacji ← do dodania

**Obsługiwane interakcje:**
- Kliknięcie ArchiveGroupButton - otwarcie dialogu potwierdzenia
- Potwierdzenie w dialogu - wywołanie API archiwizacji, przekierowanie na pulpit po sukcesie
- Anulowanie w dialogu - zamknięcie dialogu bez akcji

**Obsługiwana walidacja:**
- Weryfikacja roli użytkownika (tylko `creator` widzi przycisk)
- Walidacja stanu ładowania (przycisk zablokowany podczas przetwarzania)

**Typy:**
- `HeaderProps` - rozszerzenie o `onGroupArchived?: () => void`
- `ArchiveGroupResponseDTO` - odpowiedź z API

**Props:**
```typescript
interface HeaderProps {
  groupName: string;
  groupId: string;
  userId: string;
  userRole: GroupRole;
  onBack?: () => void;
  onGroupArchived?: () => void;
}
```

**Stan komponentu:**
```typescript
interface ArchiveDialogState {
  isOpen: boolean;
}
```

### 4.2. useArchiveGroup (nowy hook)

**Opis:** Custom hook wykorzystujący React Query do zarządzania mutacją archiwizacji grupy.

**Główne elementy:**
- `useMutation` z `@tanstack/react-query`
- Wywołanie `POST /api/groups/:id/archive`
- Obsługa błędów i powiadomień toast

**Obsługiwane interakcje:**
- `archiveGroup(groupId)` - wywołanie archiwizacji
- Automatyczne powiadomienia o sukcesie/błędzie

**Typy:**
```typescript
interface UseArchiveGroupResult {
  archiveGroup: (groupId: string) => Promise<ArchiveGroupResponseDTO>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}
```

## 5. Typy

### 5.1. Istniejące typy (z `src/types.ts`)

```typescript
// Status grupy
export type GroupStatus = Enums<"group_status">; // 'active' | 'archived'

// Rola w grupie
export type GroupRole = Enums<"group_role">; // 'creator' | 'member'

// Odpowiedź błędu
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### 5.2. Nowy typ do dodania (w `src/types.ts`)

```typescript
/**
 * Archive group response
 * Used in: POST /api/groups/:id/archive
 */
export type ArchiveGroupResponseDTO = Pick<Group, 
  'id' | 'name' | 'base_currency_code' | 'status' | 'created_at'
>;
```

### 5.3. Stan komponentu Header

```typescript
interface ArchiveDialogState {
  isOpen: boolean;
}
```

## 6. Zarządzanie stanem

### 6.1. Stan lokalny w Header

- **archiveDialogState** - kontroluje widoczność dialogu potwierdzenia
  - `isOpen: boolean` - czy dialog jest otwarty

### 6.2. Hook `useArchiveGroup`

Stan zarządzany przez React Query:
- **isPending** - czy mutacja jest w trakcie wykonywania
- **isError** - czy wystąpił błąd
- **error** - obiekt błędu (jeśli wystąpił)

Hook zapewnia:
- Automatyczne zarządzanie stanem ładowania
- Invalidację cache dla listy grup po sukcesie
- Powiadomienia toast (sukces/błąd)

## 7. Integracja API

### 7.1. Endpoint archiwizacji

**Request:**
```
POST /api/groups/:groupId/archive
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Nazwa grupy",
  "base_currency_code": "PLN",
  "status": "archived",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### 7.2. Kody błędów

| Kod HTTP | Kod błędu | Opis | Akcja UI |
|----------|-----------|------|----------|
| 200 | - | Sukces | Toast sukcesu, przekierowanie na pulpit |
| 400 | `VALIDATION_ERROR` | Nieprawidłowy format UUID | Toast z błędem |
| 401 | `UNAUTHORIZED` | Brak autoryzacji | Przekierowanie na login |
| 403 | `FORBIDDEN` | Użytkownik nie jest twórcą | Toast z błędem |
| 404 | `NOT_FOUND` | Grupa nie istnieje | Toast z błędem |
| 500 | `INTERNAL_SERVER_ERROR` | Błąd serwera | Toast z błędem |

### 7.3. Implementacja hooka

```typescript
// src/lib/hooks/useArchiveGroup.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "../../db/supabase.client";
import type { ArchiveGroupResponseDTO } from "../../types";

export function useArchiveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string): Promise<ArchiveGroupResponseDTO> => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/groups/${groupId}/archive`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate groups list cache
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Grupa została zarchiwizowana");
    },
    onError: (error) => {
      console.error("Failed to archive group:", error);
      toast.error("Nie udało się zarchiwizować grupy. Spróbuj ponownie.");
    },
  });
}
```

## 8. Interakcje użytkownika

### 8.1. Przepływ archiwizacji grupy

1. **Użytkownik z rolą `creator`** widzi przycisk archiwizacji w nagłówku grupy
2. **Kliknięcie przycisku archiwizacji** otwiera dialog potwierdzenia
3. **Dialog wyświetla:**
   - Tytuł: "Archiwizuj grupę"
   - Opis: "Czy na pewno chcesz zarchiwizować grupę '{nazwa}'? Zarchiwizowana grupa nie będzie widoczna na liście grup, ale wszystkie dane finansowe zostaną zachowane. Tej akcji nie można cofnąć."
   - Przyciski: "Anuluj", "Archiwizuj"
4. **Potwierdzenie:**
   - Przycisk "Archiwizuj" zmienia stan na ładowanie (spinner)
   - Wywołanie API `POST /api/groups/:id/archive`
   - Po sukcesie: toast sukcesu, przekierowanie na pulpit (`/`)
   - Po błędzie: toast z komunikatem błędu, dialog pozostaje otwarty
5. **Anulowanie:**
   - Zamknięcie dialogu bez akcji

### 8.2. Mapowanie interakcji

| Interakcja | Komponent | Akcja |
|------------|-----------|-------|
| Kliknięcie przycisku archiwizacji | Header | Otwarcie dialogu potwierdzenia |
| Kliknięcie "Anuluj" w dialogu | ConfirmationDialog | Zamknięcie dialogu |
| Kliknięcie "Archiwizuj" w dialogu | ConfirmationDialog | Wywołanie mutacji archiveGroup |
| Sukces archiwizacji | useArchiveGroup | Toast sukcesu, przekierowanie |
| Błąd archiwizacji | useArchiveGroup | Toast błędu |

## 9. Warunki i walidacja

### 9.1. Warunki widoczności

| Warunek | Komponent | Efekt |
|---------|-----------|-------|
| `userRole === 'creator'` | Header | Przycisk archiwizacji jest widoczny |
| `isPending === true` | ConfirmationDialog | Przycisk "Archiwizuj" pokazuje spinner |

### 9.2. Walidacja po stronie klienta

- **Rola użytkownika:** Przycisk archiwizacji renderowany tylko dla `creator`
- **Stan dialogu:** Dialog wymaga jawnego potwierdzenia przed akcją

### 9.3. Walidacja po stronie serwera

- **UUID groupId:** Format UUID walidowany przez Zod schema
- **Autoryzacja:** Token JWT musi być ważny
- **Rola creator:** Sprawdzenie czy użytkownik jest twórcą grupy
- **Członkostwo:** Użytkownik musi być aktywnym członkiem grupy

## 10. Obsługa błędów

### 10.1. Scenariusze błędów

| Scenariusz | Kod HTTP | Obsługa |
|------------|----------|---------|
| Brak autoryzacji | 401 | Toast z komunikatem, możliwe przekierowanie na login |
| Brak uprawnień (nie creator) | 403 | Toast: "Tylko twórca grupy może ją zarchiwizować" |
| Grupa nie istnieje | 404 | Toast: "Nie znaleziono grupy" |
| Błąd serwera | 500 | Toast: "Wystąpił błąd serwera. Spróbuj ponownie później" |
| Błąd sieci | - | Toast: "Nie udało się zarchiwizować grupy. Sprawdź połączenie" |

### 10.2. Komunikaty błędów

Wszystkie komunikaty błędów są wyświetlane za pomocą komponentu Toast (biblioteka sonner):

```typescript
// Sukces
toast.success("Grupa została zarchiwizowana");

// Błędy
toast.error("Nie udało się zarchiwizować grupy. Spróbuj ponownie.");
```

### 10.3. Stan UI podczas błędu

- Dialog pozostaje otwarty po błędzie
- Przycisk "Archiwizuj" wraca do stanu normalnego (bez spinnera)
- Użytkownik może ponowić próbę lub anulować

## 11. Kroki implementacji

### Krok 1: Dodanie typu ArchiveGroupResponseDTO

**Plik:** `src/types.ts`

Dodać nowy typ odpowiedzi:
```typescript
/**
 * Archive group response
 * Used in: POST /api/groups/:id/archive
 */
export type ArchiveGroupResponseDTO = Pick<Group, 
  'id' | 'name' | 'base_currency_code' | 'status' | 'created_at'
>;
```

### Krok 2: Utworzenie hooka useArchiveGroup

**Plik:** `src/lib/hooks/useArchiveGroup.ts`

Utworzyć nowy plik z hookiem wykorzystującym React Query:
- Import `useMutation`, `useQueryClient` z `@tanstack/react-query`
- Import `toast` z `sonner`
- Import `createClient` z `../../db/supabase.client`
- Implementacja mutacji z wywołaniem API
- Obsługa sukcesu (invalidacja cache, toast)
- Obsługa błędu (toast)

### Krok 3: Eksport hooka

**Plik:** `src/lib/hooks/index.ts`

Dodać eksport nowego hooka:
```typescript
export { useArchiveGroup } from "./useArchiveGroup";
```

### Krok 4: Modyfikacja komponentu Header

**Plik:** `src/components/group/Header.tsx`

1. Dodać import `Archive` z `lucide-react` (zamienić ikonę Crown)
2. Dodać import `ConfirmationDialog` z `@/components/ui/confirmation-dialog`
3. Dodać import `useArchiveGroup` z `@/lib/hooks`
4. Dodać stan lokalny dla dialogu: `useState<{isOpen: boolean}>({isOpen: false})`
5. Zaimplementować handler `handleArchiveGroup`:
   - Otwieranie dialogu
6. Zaimplementować handler `handleConfirmArchive`:
   - Wywołanie `archiveGroupMutation.mutateAsync(groupId)`
   - Po sukcesie: przekierowanie na `/`
7. Zaimplementować handler `handleCancelArchive`:
   - Zamknięcie dialogu
8. Dodać `ConfirmationDialog` z odpowiednimi propsami
9. Zamienić ikonę przycisku archiwizacji z Crown na Archive

### Krok 5: Testy jednostkowe

**Plik:** `src/__tests__/hooks/useArchiveGroup.test.ts`

Utworzyć testy dla:
- Sukces archiwizacji
- Błąd autoryzacji (401)
- Błąd uprawnień (403)
- Grupa nie istnieje (404)
- Błąd serwera (500)

### Krok 6: Testy E2E (opcjonalne)

**Plik:** `e2e/group-archive.spec.ts`

Utworzyć testy:
- Przycisk archiwizacji widoczny tylko dla creatora
- Przepływ archiwizacji z sukcesem
- Przepływ archiwizacji z błędem

### Podsumowanie kroków

| Krok | Plik | Akcja |
|------|------|-------|
| 1 | `src/types.ts` | Dodać typ `ArchiveGroupResponseDTO` |
| 2 | `src/lib/hooks/useArchiveGroup.ts` | Utworzyć hook |
| 3 | `src/lib/hooks/index.ts` | Eksportować hook |
| 4 | `src/components/group/Header.tsx` | Zaimplementować funkcjonalność |
| 5 | `src/__tests__/hooks/useArchiveGroup.test.ts` | Testy jednostkowe |
| 6 | `e2e/group-archive.spec.ts` | Testy E2E (opcjonalne) |

**Szacowany czas realizacji:** 2-4 godziny

**Zależności:**
- Endpoint `POST /api/groups/:id/archive` musi być zaimplementowany
- Komponent `ConfirmationDialog` już istnieje
- Biblioteka React Query jest skonfigurowana

