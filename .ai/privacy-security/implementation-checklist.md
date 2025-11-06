# Checklist implementacji - Poprawa prywatności zaproszeń

## Data: 2025-11-06
## Status: Planowanie

## 📋 Faza 1: Przygotowanie (Dzień 1-2)

### 1.1 Dokumentacja
- [ ] Zaktualizować `.ai/prd.md`
  - [ ] Zmienić F-004: "Jeśli zaproszona osoba posiada już konto w Billzilla, jest automatycznie dodawana do grupy" → "otrzymuje zaproszenie wymagające akceptacji"
  - [ ] Usunąć punkt 67 z granic produktu
- [ ] Zaktualizować `.ai/api-plan.md`
  - [ ] Dodać kolumnę `invitee_profile_id` do tabeli `invitations`
  - [ ] Zaktualizować endpoint `/api/groups/:id/members/invite`
  - [ ] Zaktualizować endpoint `/api/invitations`
- [ ] Zaktualizować `.ai/test-plan.md`
  - [ ] Dodać przypadki GRP-02, GRP-03 dla istniejących użytkowników

### 1.2 Baza danych
- [ ] Utworzyć migrację Supabase: `supabase/migrations/20251106_invitation_privacy_fix.sql`
  - [ ] Dodać kolumnę `invitee_profile_id UUID REFERENCES profiles(id)`
  - [ ] Dodać indeksy optymalizacyjne
  - [ ] Migracja istniejących danych
- [ ] Przetestować migrację na środowisku lokalnym
- [ ] Przygotować rollback plan

### 1.3 Szablony e-maili
- [ ] Utworzyć `src/templates/emails/existing-user-invitation.html`
- [ ] Utworzyć `src/templates/emails/new-user-invitation.html`
- [ ] Utworzyć wersje tekstowe (fallback)
- [ ] Przetestować szablony w różnych klientach e-mail

---

## 🔧 Faza 2: Backend (Dzień 3-5)

### 2.1 Usługi biznesowe
- [ ] Rozszerzyć `src/lib/services/emailService.ts`
  - [ ] Dodać metodę `sendInvitationEmail()` z obsługą typów użytkowników
  - [ ] Dodać generowanie bezpiecznych tokenów zaproszeń
- [ ] Utworzyć `src/lib/services/invitationService.ts`
  - [ ] `createInvitationForExistingUser()`
  - [ ] `createInvitationForNewUser()`
  - [ ] `getUserInvitations()` - łączy oba typy
  - [ ] `acceptInvitation()` - dodaje użytkownika do grupy

### 2.2 API Endpoints

#### `src/pages/api/groups/[groupId]/members/invite.ts`
- [ ] ❌ Utworzyć plik (nie istnieje)
- [ ] Zaimplementować sprawdzanie czy użytkownik istnieje
- [ ] Dla istniejących: `invitee_profile_id = user.id`, wysyłaj e-mail typu "existing_user"
- [ ] Dla nowych: `invitee_profile_id = NULL`, wysyłaj e-mail typu "new_user"

#### `src/pages/api/groups/index.ts`
- [ ] ✅ Modyfikować istniejący
- [ ] Zmienić logikę `invite_emails` - zamiast dodawać bezpośrednio, tworzyć zaproszenia

#### `src/pages/api/invitations/index.ts`
- [ ] ✅ Modyfikować istniejący
- [ ] Rozszerzyć zapytanie: `WHERE invitee_profile_id = $userId OR (email = $userEmail AND invitee_profile_id IS NULL)`
- [ ] Dodać pole `invitation_type` w odpowiedzi

#### `src/pages/api/invitations/[id]/accept.ts`
- [ ] ✅ Rozszerzyć istniejący
- [ ] Dodać logikę dodawania istniejącego użytkownika do `group_members`

### 2.3 Testy jednostkowe
- [ ] `src/__tests__/services/invitationService.test.ts`
  - [ ] Test tworzenia zaproszeń dla istniejących użytkowników
  - [ ] Test tworzenia zaproszeń dla nowych użytkowników
  - [ ] Test akceptacji zaproszenia
- [ ] `src/__tests__/services/emailService.test.ts`
  - [ ] Test wysyłania e-maili różnych typów

---

## 🎨 Faza 3: Frontend (Dzień 6-7)

### 3.1 Hooki React
- [ ] Zaktualizować `src/lib/hooks/useInvitationsList.ts`
  - [ ] Dodać `invitation_type` do zwracanych danych
  - [ ] Obsłużyć nowe pola z API

### 3.2 Komponenty

#### `src/components/dashboard/InvitationCard.tsx`
- [ ] ✅ Modyfikować istniejący
- [ ] Dodać obsługę `invitation_type`
- [ ] Różne komunikaty dla istniejących vs nowych użytkowników
- [ ] Zachować przyciski Akceptuj/Odrzuć

#### `src/components/dashboard/DashboardView.tsx`
- [ ] ✅ Modyfikować istniejący
- [ ] Zaktualizować wyświetlanie zaproszeń
- [ ] Obsłużyć nowe typy zaproszeń w UI

#### `src/components/group/CreateGroupModal.tsx`
- [ ] ✅ Sprawdzić istniejący
- [ ] Zaktualizować obsługę odpowiedzi API z nowymi polami `invitations`

### 3.3 Testy komponentów
- [ ] `src/__tests__/components/InvitationCard.test.tsx`
  - [ ] Test różnych typów zaproszeń
  - [ ] Test akcji akceptacji/odrzucenia

---

## 🧪 Faza 4: Testowanie (Dzień 8-9)

### 4.1 Testy integracyjne API
- [ ] POST `/api/groups/:id/members/invite`
  - [ ] Zapraszanie istniejącego użytkownika → zaproszenie z `invitee_profile_id`
  - [ ] Zapraszanie nowego użytkownika → zaproszenie bez `invitee_profile_id`
- [ ] GET `/api/invitations`
  - [ ] Łączenie zaproszeń po `profile_id` i `email`
  - [ ] Prawidłowe `invitation_type`
- [ ] POST `/api/invitations/:id/accept`
  - [ ] Dodanie istniejącego użytkownika do grupy

### 4.2 Testy E2E (Playwright)
- [ ] `e2e/invitation-privacy.spec.ts`
  - [ ] Flow: zaproszenie → powiadomienie → akceptacja
  - [ ] Dashboard z różnymi typami zaproszeń
  - [ ] Bezpieczeństwo: brak dostępu do cudzych zaproszeń

### 4.3 Testy bezpieczeństwa
- [ ] Próba akceptacji cudzego zaproszenia → 403 Forbidden
- [ ] Próba zaproszenia samego siebie → błąd walidacji
- [ ] SQL injection w parametrach e-mail

### 4.4 Testy wydajnościowe
- [ ] Zapraszanie 20 użytkowników jednocześnie
- [ ] Pobieranie zaproszeń przy dużej liczbie (50+)

---

## 🚀 Faza 5: Wdrożenie (Dzień 10)

### 5.1 Środowisko testowe (staging)
- [ ] Wdrożyć wszystkie zmiany
- [ ] Uruchomić pełną migrację danych
- [ ] Przetestować z użytkownikami testowymi
- [ ] Weryfikacja e-maili

### 5.2 Produkcja
- [ ] Backup bazy produkcyjnej
- [ ] Wdrożenie w godzinach niskiego ruchu
- [ ] Monitoring przez 24h
- [ ] Komunikaty dla użytkowników o zmianach

### 5.3 Monitoring po wdrożeniu
- [ ] Liczba wysłanych zaproszeń
- [ ] Czas akceptacji zaproszeń
- [ ] Błędy API związane z zaproszeniami
- [ ] Zgłoszenia użytkowników

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
- [ ] ✅ Wszystkie testy automatyczne przechodzą
- [ ] ✅ Brak błędów w logach przez 24h po wdrożeniu
- [ ] ✅ Czas odpowiedzi API < 500ms

### Biznesowe:
- [ ] 📈 >95% zaproszeń wymaga akceptacji (brak automatycznego dodawania)
- [ ] 📉 <5% błędów związanych z zaproszeniami
- [ ] 😊 Pozytywne opinie użytkowników w testach akceptacyjnych

### Bezpieczeństwo:
- [ ] 🔒 Brak naruszeń prywatności
- [ ] 🔒 Wszystkie zaproszenia wymagają zgody
- [ ] 🔒 Brak dostępu do cudzych zaproszeń

---

## 📞 Kontakty awaryjne

- **Tech Lead:** [imię nazwisko] - [telefon/slack]
- **DevOps:** [imię nazwisko] - [telefon/slack]
- **Product Owner:** [imię nazwisko] - [telefon/slack]

**Czas reakcji:** Krytyczne problemy - 15 min, Normalne - 1h, Niski priorytet - 4h
