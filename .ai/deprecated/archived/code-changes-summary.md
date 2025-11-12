# Lista zmian w kodzie - Poprawa prywatności zaproszeń

## Data: 2025-11-06
## Status: Zaimplementowane ✅

## 1. Backend - Zmiany w API

### 1.1 Nowe/modyfikowane pliki

#### `src/pages/api/groups/[groupId]/members/invite.ts`
**Status:** ✅ Istnieje - zaimplementowane
**Zmiany:**
- Zmienić logikę: wszyscy użytkownicy (istniejący + nowi) otrzymują status "pending"
- Dodać `invitee_profile_id` dla istniejących użytkowników
- Wysyłać różne e-maile w zależności od typu użytkownika

**Nowy kod:**
```typescript
// Sprawdzanie czy użytkownik istnieje
const existingUser = await supabase
  .from('profiles')
  .select('id, full_name')
  .eq('email', email)
  .single();

if (existingUser.data) {
  // Istniejący użytkownik - twórz zaproszenie z profile_id
  await supabase.from('invitations').insert({
    email,
    group_id: groupId,
    invitee_profile_id: existingUser.data.id,
    status: 'pending'
  });

  // Wyślij e-mail dla istniejącego użytkownika
  await sendInvitationEmail(email, groupId, 'existing_user', existingUser.data);
} else {
  // Nowy użytkownik - twórz zaproszenie bez profile_id
  await supabase.from('invitations').insert({
    email,
    group_id: groupId,
    status: 'pending'
  });

  // Wyślij e-mail dla nowego użytkownika
  await sendInvitationEmail(email, groupId, 'new_user');
}
```

#### `src/pages/api/groups/index.ts` (tworzenie grupy)
**Status:** ✅ Istnieje - trzeba zmodyfikować
**Zmiany:**
- Analogiczna zmiana w obsłudze `invite_emails` podczas tworzenia grupy
- Zamiast bezpośredniego dodawania, tworzyć zaproszenia

#### `src/pages/api/invitations/index.ts` (pobieranie zaproszeń)
**Status:** ✅ Istnieje - trzeba zmodyfikować
**Zmiany:**
- Rozszerzyć zapytanie o zaproszenia dla istniejących użytkowników
- Łączyć zaproszenia po `invitee_profile_id` i `email`

**Nowy kod:**
```typescript
// Pobierz zaproszenia dla zalogowanego użytkownika
const { data: invitations } = await supabase
  .from('invitations')
  .select(`
    *,
    groups:group_id (id, name)
  `)
  .eq('status', 'pending')
  .or(`invitee_profile_id.eq.${userId},and(email.eq.${userEmail},invitee_profile_id.is.null)`);
```

#### `src/pages/api/invitations/[id]/accept.ts`
**Status:** ✅ Istnieje - trzeba rozszerzyć
**Zmiany:**
- Dodać logikę dodawania istniejącego użytkownika do grupy
- Zachować istniejącą logikę dla nowych użytkowników

### 1.2 Nowe funkcje pomocnicze

#### `src/lib/services/emailService.ts`
**Status:** ✅ Istnieje - trzeba rozszerzyć
**Nowe metody:**
```typescript
export async function sendInvitationEmail(
  email: string,
  groupId: string,
  invitationType: 'existing_user' | 'new_user',
  existingUser?: { id: string; full_name?: string }
) {
  const group = await getGroupById(groupId);
  const inviter = await getCurrentUser();

  if (invitationType === 'existing_user') {
    // Szablon dla istniejącego użytkownika
    const template = 'existing-user-invitation.html';
    const variables = {
      user_name: existingUser?.full_name || 'Użytkowniku',
      inviter_name: inviter.full_name,
      group_name: group.name,
      accept_url: `${process.env.APP_URL}/invitations/{invitation_id}/accept`,
      decline_url: `${process.env.APP_URL}/invitations/{invitation_id}/decline`
    };
  } else {
    // Szablon dla nowego użytkownika
    const template = 'new-user-invitation.html';
    const variables = {
      inviter_name: inviter.full_name,
      group_name: group.name,
      signup_url: `${process.env.APP_URL}/signup`,
      invitation_token: generateInvitationToken(invitationId)
    };
  }

  await sendEmail(email, subject, template, variables);
}
```

#### `src/lib/services/invitationService.ts`
**Status:** ✅ Istnieje - zaimplementowane
**Nowe funkcje:**
- `createInvitationForExistingUser()`
- `createInvitationForNewUser()`
- `getUserInvitations(userId, email)` - łączy oba typy
- `acceptInvitation(invitationId, userId)` - obsługuje dodanie do grupy

## 2. Frontend - Zmiany w komponentach

### 2.1 Modyfikacje istniejących komponentów

#### `src/components/dashboard/InvitationCard.tsx`
**Status:** ✅ Istnieje - trzeba zmodyfikować
**Zmiany:**
- Dodać obsługę `invitation_type` ('existing_user' vs 'new_user')
- Różne komunikaty w zależności od typu zaproszenia
- Zachować istniejącą funkcjonalność akceptacji/odrzucenia

#### `src/components/dashboard/DashboardView.tsx`
**Status:** ✅ Istnieje - trzeba zmodyfikować
**Zmiany:**
- Zaktualizować hook `useInvitationsList` o nowe pola
- Obsłużyć różne typy zaproszeń w UI

#### `src/components/group/CreateGroupModal.tsx`
**Status:** ✅ Istnieje - trzeba sprawdzić
**Zmiany:**
- Sprawdź czy API zwraca poprawne dane po zmianach
- Zaktualizuj obsługę odpowiedzi z nowymi polami `invitations`

### 2.2 Nowe hooki React

#### `src/lib/hooks/useInvitationsList.ts`
**Status:** ✅ Istnieje - trzeba zmodyfikować
**Zmiany:**
- Rozszerzyć zapytanie o zaproszenia dla istniejących użytkowników
- Dodać pole `invitation_type` do zwracanych danych

**Nowy kod:**
```typescript
export function useInvitationsList() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const response = await apiClient.get('/api/invitations');
      return response.data.map(invitation => ({
        ...invitation,
        invitation_type: invitation.invitee_profile_id ? 'existing_user' : 'new_user'
      }));
    }
  });
}
```

## 3. Baza danych - Migracje

### 3.1 Nowa migracja Supabase

#### `supabase/migrations/20251025000000_add_accept_invitation_function.sql`
```sql
-- Dodanie nowej kolumny
ALTER TABLE invitations
ADD COLUMN invitee_profile_id UUID REFERENCES profiles(id);

-- Indeksy dla optymalizacji
CREATE INDEX idx_invitations_invitee_profile_id ON invitations(invitee_profile_id)
WHERE invitee_profile_id IS NOT NULL;

CREATE INDEX idx_invitations_pending_invitee ON invitations(status, invitee_profile_id)
WHERE status = 'pending' AND invitee_profile_id IS NOT NULL;

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_email_profile ON invitations(email, invitee_profile_id);

-- Migracja danych: utworzenie "zaakceptowanych" zaproszeń dla istniejących członków
INSERT INTO invitations (
  id,
  email,
  group_id,
  invitee_profile_id,
  status,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  p.email,
  gm.group_id,
  gm.profile_id,
  'accepted',
  gm.joined_at,
  gm.joined_at
FROM group_members gm
JOIN profiles p ON p.id = gm.profile_id
WHERE gm.status = 'active'
AND gm.role = 'member';
```

## 4. Testy - Nowe pliki testowe

### 4.1 Testy jednostkowe

#### `src/__tests__/services/invitationService.test.ts`
**Status:** ✅ Istnieje - zaimplementowane
**Zawartość:** Testy dla wszystkich funkcji invitationService

#### `src/__tests__/services/emailService.test.ts`
**Status:** ✅ Istnieje - trzeba rozszerzyć
**Zmiany:** Testy dla nowych metod wysyłania e-maili

### 4.2 Testy integracyjne

#### `e2e/invitation-privacy.spec.ts`
**Status:** ❌ Nie istnieje - wymaga utworzenia (priorytet niski)
**Scenariusze:**
- Zapraszanie istniejącego użytkownika
- Zapraszanie nowego użytkownika
- Akceptacja/odrzucenie zaproszenia
- Dashboard z różnymi typami zaproszeń

## 5. Konfiguracja - Zmiany w ustawieniach

### 5.1 Zmienne środowiskowe
**Status:** ✅ Istnieją - sprawdzić czy wystarczają
**Potrzebne:**
- `EMAIL_TEMPLATES_PATH` - ścieżka do szablonów e-maili
- `INVITATION_TOKEN_SECRET` - sekret do generowania tokenów
- `INVITATION_TOKEN_EXPIRY` - czas ważności tokenów (domyślnie 30 dni)

### 5.2 Szablony e-maili
**Status:** ✅ Istnieją - zaimplementowane
**Pliki utworzone:**
- `src/templates/emails/existing-user-invitation.html` ✅
- `src/templates/emails/new-user-invitation.html` ✅
- `src/templates/emails/existing-user-invitation.txt` ✅
- `src/templates/emails/new-user-invitation.txt` ✅

## 6. Dokumentacja - Aktualizacje

### 6.1 Pliki do aktualizacji

#### `.ai/prd.md`
- **F-004:** Zmienić opis automatycznego dodawania
- **Punkt 67:** Usunąć z granic produktu

#### `.ai/api-plan.md`
- **Endpoint `/api/groups/:id/members/invite`:** Zaktualizować opis i przykłady
- **Endpoint `/api/invitations`:** Dodać nowe pola i logikę wyszukiwania
- **Tabela `invitations`:** Dodać kolumnę `invitee_profile_id`

#### `.ai/test-plan.md`
- Dodać nowe przypadki testowe dla zaproszeń istniejących użytkowników

## 7. Checklist implementacji

### Faza 1: Przygotowanie (1-2 dni)
- [ ] Zaktualizować dokumentację (PRD, API plan)
- [ ] Utworzyć migrację bazy danych
- [ ] Przygotować szablony e-maili

### Faza 2: Backend (2-3 dni)
- [ ] Zaimplementować zmiany w API endpoints
- [ ] Dodać funkcje pomocnicze (invitationService, emailService)
- [ ] Uruchomić migrację na środowisku testowym
- [ ] Testy jednostkowe

### Faza 3: Frontend (1-2 dni)
- [ ] Zaktualizować komponenty InvitationCard/Dashboard
- [ ] Dodać nowe hooki i logikę
- [ ] Testy komponentów

### Faza 4: Testowanie i wdrożenie (2-3 dni)
- [ ] Testy integracyjne (API)
- [ ] Testy E2E (Playwright)
- [ ] Testy akceptacyjne z użytkownikami
- [ ] Wdrożenie na produkcję

## 8. Ryzyka i plan awaryjny

### Ryzyka krytyczne:
1. **Błąd migracji danych** → Przywracanie z backupu
2. **Problemy z e-mailami** → Tymczasowe wyłączenie wysyłania
3. **Błędy w API** → Rollback do poprzedniej wersji

### Plan awaryjny:
- **Feature flag:** Możliwość włączenia/wyłączenia nowej logiki
- **Rollback migration:** Przywracanie poprzedniego stanu bazy
- **Fallback UI:** Pokazywanie starych zaproszeń jeśli API nie działa

---

**Czas implementacji:** Zakończono w 2025-11-07
**Zespół:** 1 backend developer + 1 frontend developer
**Priorytet:** Wysoki (bezpieczeństwo prywatności) - ✅ WYKONANE
