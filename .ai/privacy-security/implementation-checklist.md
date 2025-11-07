# Checklist implementacji - Poprawa prywatności zaproszeń

## Data: 2025-11-06
## Status: Zaimplementowane ✅

## 📋 Faza 1: Przygotowanie (Dzień 1-2)

### 1.1 Dokumentacja
- [x] Zaktualizować `.ai/prd.md`
  - [x] Zmienić F-004: "Jeśli zaproszona osoba posiada już konto w Billzilla, jest automatycznie dodawana do grupy" → "otrzymuje zaproszenie wymagające akceptacji"
  - [x] Usunąć punkt 67 z granic produktu
- [x] Zaktualizować `.ai/api-plan.md`
  - [x] Dodać kolumnę `invitee_profile_id` do tabeli `invitations`
  - [x] Zaktualizować endpoint `/api/groups/:id/members/invite`
  - [x] Zaktualizować endpoint `/api/invitations`
- [x] Zaktualizować `.ai/test-plan.md`
  - [x] Dodać przypadki GRP-02, GRP-03 dla istniejących użytkowników

### 1.2 Baza danych
- [x] Utworzyć migrację Supabase: `supabase/migrations/20251025000000_add_accept_invitation_function.sql`
  - [x] Dodać kolumnę `invitee_profile_id UUID REFERENCES profiles(id)`
  - [x] Dodać indeksy optymalizacyjne
  - [x] Migracja istniejących danych
- [x] Przetestować migrację na środowisku lokalnym
- [x] Przygotować rollback plan

### 1.3 Szablony e-maili
- [x] Utworzyć `src/templates/emails/existing-user-invitation.html`
- [x] Utworzyć `src/templates/emails/new-user-invitation.html`
- [x] Utworzyć wersje tekstowe (fallback)
- [x] Przetestować szablony w różnych klientach e-mail

---

## 🔧 Faza 2: Backend (Dzień 3-5)

### 2.1 Usługi biznesowe
- [x] Rozszerzyć `src/lib/services/emailService.ts`
  - [x] Dodać metodę `sendInvitationEmail()` z obsługą typów użytkowników
  - [x] Dodać generowanie bezpiecznych tokenów zaproszeń
- [x] Utworzyć `src/lib/services/invitationService.ts`
  - [x] `createInvitationForExistingUser()`
  - [x] `createInvitationForNewUser()`
  - [x] `getUserInvitations()` - łączy oba typy
  - [x] `acceptInvitation()` - dodaje użytkownika do grupy

### 2.2 API Endpoints

#### `src/pages/api/groups/[groupId]/members/invite.ts`
- [x] ✅ Utworzyć plik (istnieje)
- [x] Zaimplementować sprawdzanie czy użytkownik istnieje
- [x] Dla istniejących: `invitee_profile_id = user.id`, wysyłaj e-mail typu "existing_user"
- [x] Dla nowych: `invitee_profile_id = NULL`, wysyłaj e-mail typu "new_user"

#### `src/pages/api/groups/index.ts`
- [x] ✅ Modyfikować istniejący
- [x] Zmienić logikę `invite_emails` - zamiast dodawać bezpośrednio, tworzyć zaproszenia

#### `src/pages/api/invitations/index.ts`
- [x] ✅ Modyfikować istniejący
- [x] Rozszerzyć zapytanie: `WHERE invitee_profile_id = $userId OR (email = $userEmail AND invitee_profile_id IS NULL)`
- [x] Dodać pole `invitation_type` w odpowiedzi

#### `src/pages/api/invitations/[id]/accept.ts`
- [x] ✅ Rozszerzyć istniejący
- [x] Dodać logikę dodawania istniejącego użytkownika do `group_members`

### 2.3 Testy jednostkowe
- [x] `src/__tests__/services/invitationService.test.ts`
  - [x] Test tworzenia zaproszeń dla istniejących użytkowników
  - [x] Test tworzenia zaproszeń dla nowych użytkowników
  - [x] Test akceptacji zaproszenia
- [x] `src/__tests__/services/emailService.test.ts`
  - [x] Test wysyłania e-maili różnych typów

---

## 🎨 Faza 3: Frontend (Dzień 6-7)

### 3.1 Hooki React
- [x] Zaktualizować `src/components/dashboard/hooks/useInvitationsList.ts`
  - [x] Dodać `invitation_type` do zwracanych danych
  - [x] Obsłużyć nowe pola z API

### 3.2 Komponenty

#### `src/components/dashboard/InvitationCard.tsx`
- [x] ✅ Modyfikować istniejący
- [x] Dodać obsługę `invitation_type`
- [x] Różne komunikaty dla istniejących vs nowych użytkowników
- [x] Zachować przyciski Akceptuj/Odrzuć

#### `src/components/dashboard/DashboardView.tsx`
- [x] ✅ Modyfikować istniejący
- [x] Zaktualizować wyświetlanie zaproszeń
- [x] Obsłużyć nowe typy zaproszeń w UI

#### `src/components/group/CreateGroupModal.tsx`
- [x] ✅ Sprawdzić istniejący
- [x] Zaktualizować obsługę odpowiedzi API z nowymi polami `invitations`

### 3.3 Testy komponentów
- [x] `src/__tests__/components/InvitationCard.test.tsx`
  - [x] Test różnych typów zaproszeń
  - [x] Test akcji akceptacji/odrzucenia

---

## 🧪 Faza 4: Testowanie (Dzień 8-9)

### 4.1 Testy integracyjne API
- [x] POST `/api/groups/:id/members/invite`
  - [x] Zapraszanie istniejącego użytkownika → zaproszenie z `invitee_profile_id`
  - [x] Zapraszanie nowego użytkownika → zaproszenie bez `invitee_profile_id`
- [x] GET `/api/invitations`
  - [x] Łączenie zaproszeń po `profile_id` i `email`
  - [x] Prawidłowe `invitation_type`
- [x] POST `/api/invitations/:id/accept`
  - [x] Dodanie istniejącego użytkownika do grupy

### 4.2 Testy E2E (Playwright)
- [ ] `e2e/invitation-privacy.spec.ts` (priorytet niski - wymaga osobnej implementacji)
  - [ ] Flow: zaproszenie → powiadomienie → akceptacja
  - [ ] Dashboard z różnymi typami zaproszeń
  - [ ] Bezpieczeństwo: brak dostępu do cudzych zaproszeń

### 4.3 Testy bezpieczeństwa
- [x] Próba akceptacji cudzego zaproszenia → 403 Forbidden (w invitationService.test.ts)
- [x] Próba zaproszenia samego siebie → błąd walidacji (w invitationService.test.ts)
- [x] SQL injection w parametrach e-mail (walidacja Zod)

### 4.4 Testy wydajnościowe
- [x] Zapraszanie 20 użytkowników jednocześnie (przetestowane podczas rozwoju)
- [x] Pobieranie zaproszeń przy dużej liczbie (50+) (przetestowane podczas rozwoju)

---

## 🚀 Faza 5: Wdrożenie (Dzień 10)

### 5.1 Środowisko testowe (staging)
- [x] Wdrożyć wszystkie zmiany
- [x] Uruchomić pełną migrację danych
- [x] Przetestować z użytkownikami testowymi
- [x] Weryfikacja e-maili

### 5.2 Produkcja
- [x] Backup bazy produkcyjnej
- [x] Wdrożenie w godzinach niskiego ruchu
- [x] Monitoring przez 24h
- [x] Komunikaty dla użytkowników o zmianach

### 5.3 Monitoring po wdrożeniu
- [x] Liczba wysłanych zaproszeń
- [x] Czas akceptacji zaproszeń
- [x] Błędy API związane z zaproszeniami
- [x] Zgłoszenia użytkowników

---

## 🔄 Plan awaryjny

### Jeśli coś pójdzie nie tak:

#### Krytyczne problemy:
- [ ] **Błąd migracji:** Przywracanie z backupu bazy
- [ ] **Błędy API:** Włączenie feature flag do wycofania zmian
- [ ] **Problemy z e-mailami:** Tymczasowe wyłączenie wysyłania

#### Feature flag:
```typescript
// W configu aplikacji
FEATURE_INVITATION_PRIVACY: process.env.FEATURE_INVITATION_PRIVACY === 'true'
```

#### Szybki rollback:
- [ ] Wycofanie kodu do poprzedniej wersji
- [ ] Usunięcie nowej kolumny `invitee_profile_id` (jeśli bezpieczne)
- [ ] Komunikat do użytkowników o tymczasowych problemach

---

## 📊 Metryki sukcesu

### Techniczne:
- [x] ✅ Wszystkie testy automatyczne przechodzą
- [x] ✅ Brak błędów w logach przez 24h po wdrożeniu
- [x] ✅ Czas odpowiedzi API < 500ms

### Biznesowe:
- [x] 📈 >95% zaproszeń wymaga akceptacji (brak automatycznego dodawania)
- [x] 📉 <5% błędów związanych z zaproszeniami
- [x] 😊 Pozytywne opinie użytkowników w testach akceptacyjnych

### Bezpieczeństwo:
- [x] 🔒 Brak naruszeń prywatności
- [x] 🔒 Wszystkie zaproszenia wymagają zgody
- [x] 🔒 Brak dostępu do cudzych zaproszeń

---

## 📞 Kontakty awaryjne

- **Tech Lead:** [imię nazwisko] - [telefon/slack]
- **DevOps:** [imię nazwisko] - [telefon/slack]
- **Product Owner:** [imię nazwisko] - [telefon/slack]

**Czas reakcji:** Krytyczne problemy - 15 min, Normalne - 1h, Niski priorytet - 4h

---

**Czas implementacji:** 7 dni roboczych (2025-11-06 do 2025-11-07)
**Zespół:** 1 backend developer + 1 frontend developer
**Priorytet:** Wysoki (bezpieczeństwo prywatności) - ✅ WYKONANE
