# API Endpoint Implementation Plan: Archive Group

## 1. Przegląd punktu końcowego

Endpoint `POST /api/groups/:id/archive` służy do archiwizacji grupy (soft delete). Operacja zmienia status grupy z `active` na `archived`, zachowując wszystkie dane finansowe i historię wydatków. Jest to operacja nieodwracalna dostępna wyłącznie dla twórcy grupy (użytkownika z rolą `creator`).

### Kluczowe cechy:
- Soft delete - dane nie są usuwane fizycznie
- Tylko twórca grupy może wykonać tę operację
- Zarchiwizowana grupa nie pojawia się na domyślnej liście grup użytkownika
- Historia wydatków i rozliczeń pozostaje zachowana

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/groups/:id/archive`
- **Parametry:**
  - **Wymagane:**
    - `id` (uuid, URL parameter) - Identyfikator grupy do zarchiwizowania
  - **Opcjonalne:** Brak
- **Request Body:** Brak (endpoint nie przyjmuje body)
- **Wymagane nagłówki:**
  - `Authorization: Bearer {access_token}` - Token JWT z Supabase Auth

## 3. Wykorzystywane typy

### Istniejące typy (z `src/types.ts`):
```typescript
// Encja bazy danych
export type Group = Tables<"groups">;

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

### Nowe typy do dodania:
```typescript
// Odpowiedź archiwizacji (używa istniejącego typu Group)
export type ArchiveGroupResponseDTO = Pick<Group, 
  'id' | 'name' | 'base_currency_code' | 'status' | 'created_at'
>;
```

### Schemat Zod do walidacji (z `src/lib/schemas/groupSchemas.ts`):
```typescript
import { z } from "zod";

/**
 * Schema for validating UUID parameter
 * Used in: POST /api/groups/:id/archive
 */
export const groupIdParamSchema = z.object({
  groupId: z.string().uuid("Invalid group ID format"),
});

export type GroupIdParam = z.infer<typeof groupIdParamSchema>;
```

### Istniejące błędy do wykorzystania:
- `GroupAccessError` - gdy użytkownik nie ma dostępu do grupy
- `GroupDataError` - błędy operacji na danych grupy

### Nowy błąd do dodania:
```typescript
// src/lib/services/errors/groupErrors.ts
export class GroupNotCreatorError extends Error {
  constructor(message = "Only the group creator can perform this action") {
    super(message);
    this.name = "GroupNotCreatorError";
  }
}
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK):
```json
{
  "id": "uuid",
  "name": "Wyjazd do Zakopanego",
  "base_currency_code": "PLN",
  "status": "archived",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Błędy:

| Kod HTTP | Kod błędu | Opis |
|----------|-----------|------|
| 400 | `VALIDATION_ERROR` | Nieprawidłowy format UUID |
| 401 | `UNAUTHORIZED` | Brak lub nieprawidłowy token autoryzacji |
| 403 | `FORBIDDEN` | Użytkownik nie jest twórcą grupy |
| 404 | `NOT_FOUND` | Grupa nie istnieje lub użytkownik nie jest jej członkiem |
| 500 | `INTERNAL_SERVER_ERROR` | Nieoczekiwany błąd serwera |

## 5. Przepływ danych

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Klient (Frontend)                            │
│                                                                     │
│  POST /api/groups/:id/archive                                       │
│  Authorization: Bearer {token}                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Astro Middleware                                  │
│                                                                     │
│  1. Weryfikacja tokenu JWT (Supabase Auth)                         │
│  2. Ustawienie locals.user i locals.supabase                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│              API Route: /api/groups/[groupId]/archive.ts            │
│                                                                     │
│  1. Sprawdzenie czy user jest zalogowany (locals.user)              │
│  2. Walidacja parametru groupId (UUID format)                       │
│  3. Wywołanie archiveGroup() z groupService                         │
│  4. Obsługa błędów i zwrot odpowiedzi                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Service: groupService.archiveGroup()                   │
│                                                                     │
│  1. Walidacja inputów (groupId, userId)                             │
│  2. Specyfikacja: UserIsGroupCreatorSpecification                   │
│     - Sprawdza czy user jest członkiem z rolą 'creator'             │
│  3. Repository: GroupRepository.archiveGroup()                      │
│     - UPDATE groups SET status = 'archived' WHERE id = groupId      │
│  4. Zwrot zaktualizowanych danych grupy                             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL + Supabase)                       │
│                                                                     │
│  - RLS: sprawdzenie dostępu do grupy                                │
│  - UPDATE: zmiana statusu na 'archived'                             │
│  - RETURN: zaktualizowany rekord grupy                              │
└─────────────────────────────────────────────────────────────────────┘
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie:
- Token JWT musi być obecny w nagłówku `Authorization`
- Token jest weryfikowany przez middleware Astro przy użyciu Supabase Auth
- Nieprawidłowy/wygasły token skutkuje błędem 401

### Autoryzacja:
- **Poziom 1 - RLS:** Supabase Row Level Security zapewnia, że użytkownik widzi tylko grupy, których jest członkiem
- **Poziom 2 - Logika biznesowa:** Dodatkowe sprawdzenie, czy użytkownik ma rolę `creator` w grupie

### Walidacja danych:
- **Zod schema** (`groupIdParamSchema`) dla walidacji UUID parametru `groupId`
- Użycie `safeParse()` dla bezpiecznej walidacji z obsługą błędów
- Sanityzacja inputów przez Supabase SDK (parametryzowane zapytania)

### Potencjalne zagrożenia i mitygacje:
| Zagrożenie | Mitygacja |
|------------|-----------|
| Nieautoryzowany dostęp | JWT + RLS + sprawdzenie roli creator |
| SQL Injection | Parametryzowane zapytania (Supabase SDK) |
| IDOR (Insecure Direct Object Reference) | RLS + weryfikacja członkostwa |
| Brute force | Rate limiting na poziomie Cloudflare |

## 7. Obsługa błędów

### Scenariusze błędów i mapowanie:

```typescript
// Mapowanie błędów serwisu na odpowiedzi HTTP
const errorMapping = {
  // Brak/nieprawidłowy token
  'UNAUTHORIZED': { status: 401, code: 'UNAUTHORIZED' },
  
  // Nieprawidłowy format UUID
  'VALIDATION_ERROR': { status: 400, code: 'VALIDATION_ERROR' },
  
  // Użytkownik nie jest twórcą
  'GroupNotCreatorError': { status: 403, code: 'FORBIDDEN' },
  
  // Grupa nie istnieje lub brak dostępu
  'GroupAccessError': { status: 404, code: 'NOT_FOUND' },
  'GroupDataError': { status: 404, code: 'NOT_FOUND' },
  
  // Nieoczekiwany błąd
  'default': { status: 500, code: 'INTERNAL_SERVER_ERROR' }
};
```

### Logowanie błędów:
- Błędy 5xx powinny być logowane z pełnym stack trace
- Błędy 4xx logowane na poziomie warning
- Używać `console.error` dla krytycznych błędów (Cloudflare logs)

## 8. Rozważania dotyczące wydajności

### Optymalizacje:
- **Single query:** Operacja wykonuje pojedyncze zapytanie UPDATE z WHERE
- **RLS na poziomie DB:** Weryfikacja uprawnień na poziomie bazy danych
- **Brak CASCADE:** Status grupy nie wymaga aktualizacji powiązanych tabel

### Potencjalne wąskie gardła:
- Brak - operacja jest bardzo lekka (pojedynczy UPDATE)

### Indeksy wymagane:
- `groups.id` (PRIMARY KEY - już istnieje)
- `group_members.group_id` (już powinien istnieć)
- `group_members.profile_id` (już powinien istnieć)

## 9. Etapy wdrożenia

### Krok 1: Dodanie schematu Zod w `src/lib/schemas/groupSchemas.ts`

```typescript
/**
 * Schema for validating UUID parameter
 * Used in: POST /api/groups/:id/archive, and other endpoints with UUID params
 */
export const groupIdParamSchema = z.object({
  groupId: z.string().uuid("Invalid group ID format"),
});

export type GroupIdParam = z.infer<typeof groupIdParamSchema>;
```

### Krok 2: Dodanie nowego błędu w `src/lib/services/errors/groupErrors.ts`

```typescript
/**
 * Custom error for operations requiring creator role
 */
export class GroupNotCreatorError extends Error {
  constructor(message = "Only the group creator can perform this action") {
    super(message);
    this.name = "GroupNotCreatorError";
  }
}
```

### Krok 3: Dodanie specyfikacji w `src/lib/services/specifications/groupSpecifications.ts`

```typescript
/**
 * Specification for validating that a user is the creator of a group
 */
export class UserIsGroupCreatorSpecification extends GroupSpecification {
  constructor(private supabase: SupabaseClient) {
    super();
  }

  async isSatisfiedBy({ groupId, userId }: { groupId: string; userId: string }): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("profile_id", userId)
      .eq("status", "active")
      .eq("role", "creator")
      .single();

    return !error && data !== null;
  }
}
```

### Krok 4: Dodanie metody w `src/lib/services/repositories/GroupRepository.ts`

```typescript
/**
 * Archive a group by updating its status to 'archived'
 */
async archiveGroup(groupId: string): Promise<ArchiveGroupResponseDTO> {
  const { data, error } = await this.supabase
    .from("groups")
    .update({ status: "archived" })
    .eq("id", groupId)
    .select("id, name, base_currency_code, status, created_at");

  if (error) {
    throw new GroupDataError("archive group", error.message);
  }

  if (!data || data.length === 0) {
    throw new GroupDataError("archive group", "Group not found or no permission to archive");
  }

  if (data.length > 1) {
    throw new GroupDataError("archive group", "Multiple groups found with same ID (database integrity issue)");
  }

  return data[0] as ArchiveGroupResponseDTO;
}
```

**Uwaga:** Implementacja używa zwykłego `.select()` zamiast `.single()`, aby uniknąć błędu "Cannot coerce the result to a single JSON object". Następnie waliduje odpowiedź sprawdzając długość tablicy.

### Krok 5: Dodanie funkcji w `src/lib/services/groupService.ts`

```typescript
import { GroupNotCreatorError } from "./errors/groupErrors";
import { UserIsGroupCreatorSpecification } from "./specifications/groupSpecifications";

/**
 * Archives a group (soft delete). Only the creator can archive a group.
 *
 * This function performs the following operations:
 * 1. Validates that the group exists and user is an active member
 * 2. Verifies that the user is the creator of the group
 * 3. Updates the group status to 'archived'
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group to archive
 * @param userId - ID of the user performing the action
 * @returns Archived group data
 * @throws {GroupAccessError} If user is not a member of the group
 * @throws {GroupNotCreatorError} If user is not the creator of the group
 * @throws {GroupDataError} If the archive operation fails
 */
export async function archiveGroup(
  supabase: SupabaseClient,
  groupId: string,
  userId: string
): Promise<Pick<Group, 'id' | 'name' | 'base_currency_code' | 'status' | 'created_at'>> {
  // Input validation
  if (!groupId) {
    throw new GroupDataError("archive group", "Group ID is required");
  }
  if (!userId) {
    throw new GroupDataError("archive group", "User ID is required");
  }

  const repository = new GroupRepository(supabase);

  // Verify user is an active member of the group
  const membershipSpec = new UserIsActiveGroupMemberSpecification(supabase);
  const isMember = await membershipSpec.isSatisfiedBy({ groupId, userId });
  if (!isMember) {
    throw new GroupAccessError();
  }

  // Verify user is the creator of the group
  const creatorSpec = new UserIsGroupCreatorSpecification(supabase);
  const isCreator = await creatorSpec.isSatisfiedBy({ groupId, userId });
  if (!isCreator) {
    throw new GroupNotCreatorError();
  }

  // Archive the group
  return await repository.archiveGroup(groupId);
}
```

### Krok 6: Utworzenie API route w `src/pages/api/groups/[groupId]/archive.ts`

```typescript
import type { APIRoute } from "astro";
import type { ErrorResponseDTO } from "../../../../types";
import { groupIdParamSchema } from "../../../../lib/schemas/groupSchemas";
import { archiveGroup } from "../../../../lib/services/groupService";
import { GroupAccessError, GroupDataError, GroupNotCreatorError } from "../../../../lib/services/errors/groupErrors";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

const respondWithError = (status: number, code: string, message: string): Response => {
  const payload: ErrorResponseDTO = {
    error: {
      code,
      message,
    },
  };

  return new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders,
  });
};

export const POST: APIRoute = async ({ params, locals }) => {
  if (!locals?.user) {
    return respondWithError(401, "UNAUTHORIZED", "Authentication required");
  }

  const validation = groupIdParamSchema.safeParse({ groupId: params.groupId });
  if (!validation.success) {
    return respondWithError(400, "VALIDATION_ERROR", "Invalid group ID format");
  }

  try {
    const archivedGroup = await archiveGroup(locals.supabase, validation.data.groupId, locals.user.id);
    return new Response(JSON.stringify(archivedGroup), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (error) {
    if (error instanceof GroupNotCreatorError) {
      return respondWithError(403, "FORBIDDEN", error.message);
    }

    if (error instanceof GroupAccessError) {
      return respondWithError(404, "NOT_FOUND", error.message);
    }

    if (error instanceof GroupDataError) {
      return respondWithError(404, "NOT_FOUND", error.message);
    }

    console.error("Unexpected error archiving group:", error);
    return respondWithError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred while archiving the group");
  }
};
```

**Uwaga:** Implementacja używa funkcji pomocniczej `respondWithError` dla bardziej zwięzłego i czytelnego kodu.

### Krok 7: Dodanie eksportu błędu w `src/lib/services/groupService.ts`

```typescript
// Aktualizacja eksportów na początku pliku
export { 
  CurrencyNotFoundError, 
  TransactionError, 
  GroupAccessError, 
  GroupDataError,
  GroupNotCreatorError 
} from "./errors/groupErrors";
```

### Krok 8: Opcjonalne - Dodanie typu odpowiedzi w `src/types.ts`

```typescript
/**
 * Archive group response
 * Used in: POST /api/groups/:id/archive
 */
export type ArchiveGroupResponseDTO = Pick<Group, 
  'id' | 'name' | 'base_currency_code' | 'status' | 'created_at'
>;
```

## 10. Testy jednostkowe (rekomendowane)

### Scenariusze do przetestowania:

1. **Sukces:** Twórca grupy archiwizuje swoją grupę
2. **Błąd 401:** Brak tokenu autoryzacji
3. **Błąd 400:** Nieprawidłowy format UUID
4. **Błąd 403:** Członek (nie-twórca) próbuje zarchiwizować grupę
5. **Błąd 404:** Grupa nie istnieje
6. **Błąd 404:** Użytkownik nie jest członkiem grupy
7. **Idempotentność:** Archiwizacja już zarchiwizowanej grupy (opcjonalnie - może zwrócić sukces)

### Lokalizacja testów:
- `src/__tests__/services/groupService.test.ts` - testy serwisu
- `e2e/group-archive.spec.ts` - testy E2E (opcjonalne)

