# Przypadki testowe - Nowa logika zaproszeń

## Data: 2025-11-06
## Status: Planowanie

## 1. Testy jednostkowe - Backend

### InvitationService

#### TC-001: Zapraszanie istniejącego użytkownika
**Cel:** Sprawdzenie tworzenia zaproszenia dla użytkownika, który już istnieje

**Given:**
- Użytkownik A należy do grupy G
- Użytkownik B istnieje w systemie (ma profil)
- Użytkownik A próbuje zaprosić użytkownika B do grupy G

**When:**
```typescript
await invitationService.inviteUsers(groupId, ['userB@email.com'])
```

**Then:**
- ✅ Utworzone zostaje zaproszenie ze statusem 'pending'
- ✅ Pole `invitee_profile_id` zawiera ID użytkownika B
- ✅ Pole `email` zawiera 'userB@email.com'
- ✅ Wysłany zostaje e-mail powiadamiający istniejącego użytkownika

#### TC-002: Zapraszanie nowego użytkownika
**Cel:** Sprawdzenie tworzenia zaproszenia dla użytkownika, który nie istnieje

**Given:**
- Użytkownik A należy do grupy G
- Adres e-mail 'newuser@email.com' nie istnieje w systemie

**When:**
```typescript
await invitationService.inviteUsers(groupId, ['newuser@email.com'])
```

**Then:**
- ✅ Utworzone zostaje zaproszenie ze statusem 'pending'
- ✅ Pole `invitee_profile_id` jest NULL
- ✅ Pole `email` zawiera 'newuser@email.com'
- ✅ Wysłany zostaje e-mail z zaproszeniem dla nowego użytkownika

#### TC-003: Akceptacja zaproszenia przez istniejącego użytkownika
**Cel:** Sprawdzenie dodania użytkownika do grupy po akceptacji zaproszenia

**Given:**
- Istnieje zaproszenie dla użytkownika B do grupy G
- `invitee_profile_id` wskazuje na użytkownika B
- Status zaproszenia to 'pending'

**When:**
```typescript
await invitationService.acceptInvitation(invitationId, userB.id)
```

**Then:**
- ✅ Status zaproszenia zmienia się na 'accepted'
- ✅ Użytkownik B zostaje dodany do `group_members` z rolą 'member' i statusem 'active'
- ✅ Zwrócona zostaje informacja o pomyślnej akceptacji

#### TC-004: Odrzucenie zaproszenia przez istniejącego użytkownika
**Cel:** Sprawdzenie obsługi odrzucenia zaproszenia

**Given:**
- Istnieje zaproszenie dla użytkownika B do grupy G

**When:**
```typescript
await invitationService.declineInvitation(invitationId, userB.id)
```

**Then:**
- ✅ Status zaproszenia zmienia się na 'declined'
- ✅ Użytkownik B nie zostaje dodany do grupy
- ✅ Zwrócona zostaje informacja o pomyślnej odmowie

#### TC-005: Pobieranie zaproszeń dla zalogowanego użytkownika
**Cel:** Sprawdzenie łączenia zaproszeń dla istniejących i nowych użytkowników

**Given:**
- Użytkownik A ma profil z ID i e-mailem
- Istnieje zaproszenie typu "existing_user" (invitee_profile_id = userA.id)
- Istnieje zaproszenie typu "new_user" (email = userA.email, invitee_profile_id = NULL)

**When:**
```typescript
const invitations = await invitationService.getUserInvitations(userA.id, userA.email)
```

**Then:**
- ✅ Zwrócone zostają oba zaproszenia
- ✅ Każde zaproszenie ma pole `invitation_type` ('existing_user' lub 'new_user')
- ✅ Wszystkie zaproszenia mają status 'pending'

### EmailService

#### TC-006: Wysyłanie e-maila dla istniejącego użytkownika
**Cel:** Sprawdzenie wysyłania odpowiedniego szablonu e-mail

**Given:**
- Istniejący użytkownik B
- Zaproszenie do grupy G

**When:**
```typescript
await emailService.sendInvitationEmail('userB@email.com', groupId, 'existing_user')
```

**Then:**
- ✅ Wysłany zostaje e-mail z szablonem "existing-user-invitation.html"
- ✅ E-mail zawiera link do akceptacji/odrzucenia zaproszenia
- ✅ Temat zawiera nazwę grupy

#### TC-007: Wysyłanie e-maila dla nowego użytkownika
**Cel:** Sprawdzenie wysyłania zaproszenia dla nowego użytkownika

**Given:**
- Nowy adres e-mail 'newuser@email.com'
- Zaproszenie do grupy G

**When:**
```typescript
await emailService.sendInvitationEmail('newuser@email.com', groupId, 'new_user')
```

**Then:**
- ✅ Wysłany zostaje e-mail z szablonem "new-user-invitation.html"
- ✅ E-mail zawiera informacje o rejestracji/logowaniu
- ✅ Temat zawiera nazwę grupy

## 2. Testy integracyjne - API

### POST /api/groups/:groupId/members/invite

#### TC-008: Zapraszanie mieszanej listy użytkowników
**Given:**
- Grupa G z użytkownikiem A jako członkiem
- Lista e-maili: ['existing@email.com', 'newuser@email.com', 'another-existing@email.com']

**When:**
```bash
POST /api/groups/{groupId}/members/invite
Authorization: Bearer {token}
Content-Type: application/json

{
  "emails": ["existing@email.com", "newuser@email.com", "another-existing@email.com"]
}
```

**Then:**
```json
{
  "added_members": [
    {
      "profile_id": "uuid-existing-1",
      "email": "existing@email.com",
      "status": "pending"
    },
    {
      "profile_id": "uuid-existing-2",
      "email": "another-existing@email.com",
      "status": "pending"
    }
  ],
  "created_invitations": [
    {
      "id": "uuid-invitation",
      "email": "newuser@email.com",
      "status": "pending"
    }
  ]
}
```

### GET /api/invitations

#### TC-009: Pobieranie wszystkich zaproszeń użytkownika
**Given:**
- Zalogowany użytkownik A
- Istnieją zaproszenia różnych typów

**When:**
```bash
GET /api/invitations
Authorization: Bearer {token}
```

**Then:**
```json
[
  {
    "id": "uuid-1",
    "group": { "id": "group-1", "name": "Grupa 1" },
    "email": "userA@email.com",
    "status": "pending",
    "invitation_type": "existing_user",
    "created_at": "2025-11-06T10:00:00Z"
  },
  {
    "id": "uuid-2",
    "group": { "id": "group-2", "name": "Grupa 2" },
    "email": "userA@email.com",
    "status": "pending",
    "invitation_type": "new_user",
    "created_at": "2025-11-06T11:00:00Z"
  }
]
```

### POST /api/invitations/:id/accept

#### TC-010: Akceptacja zaproszenia przez istniejącego użytkownika
**Given:**
- Zaproszenie ID z `invitee_profile_id` ustawionym na użytkownika A

**When:**
```bash
POST /api/invitations/{id}/accept
Authorization: Bearer {token}
```

**Then:**
```json
{
  "message": "Zaproszenie zaakceptowane",
  "invitation_id": "uuid",
  "group_id": "group-uuid",
  "group_name": "Nazwa grupy"
}
```

**And:**
- ✅ Użytkownik zostaje członkiem grupy
- ✅ Status zaproszenia = 'accepted'

## 3. Testy E2E - Playwright

### Scenariusz: Zapraszanie i akceptacja przez istniejącego użytkownika

#### TC-011: Pełny flow zaproszenia istniejącego użytkownika
**Given:**
- Użytkownik A jest zalogowany i należy do grupy
- Użytkownik B istnieje w systemie ale nie należy do grupy

**When:**
1. Użytkownik A otwiera stronę grupy
2. Klika "Zaproś członków"
3. Wpisuje e-mail użytkownika B
4. Klika "Wyślij zaproszenie"

**Then:**
- ✅ Wyświetla się komunikat o wysłaniu zaproszenia
- ✅ Użytkownik B otrzymuje powiadomienie na dashboard
- ✅ Użytkownik B może zaakceptować/odrzucić zaproszenie

#### TC-012: Dashboard z zaproszeniami różnych typów
**Given:**
- Użytkownik ma zaproszenia typu "existing_user" i "new_user"

**When:**
- Użytkownik otwiera dashboard

**Then:**
- ✅ Wszystkie zaproszenia są widoczne w sekcji "Zaproszenia"
- ✅ Można odróżnić typ zaproszenia (istniejący vs nowy użytkownik)
- ✅ Przyciski "Akceptuj"/"Odrzuć" działają poprawnie

## 4. Testy bezpieczeństwa

#### TC-013: Próba akceptacji cudzego zaproszenia
**Given:**
- Zaproszenie należy do użytkownika B
- Użytkownik A próbuje je zaakceptować

**When:**
```bash
POST /api/invitations/{invitation-id}/accept
Authorization: Bearer {token-user-A}
```

**Then:**
- ❌ Status 403 Forbidden
- ❌ Użytkownik A nie zostaje członkiem grupy

#### TC-014: Próba zaproszenia samego siebie
**Given:**
- Użytkownik A należy już do grupy G

**When:**
```bash
POST /api/groups/{groupId}/members/invite
{
  "emails": ["userA@email.com"]
}
```

**Then:**
- ❌ Walidacja odrzuca zaproszenie
- ❌ Komunikat błędu: "Nie możesz zaprosić samego siebie"

## 5. Testy wydajnościowe

#### TC-015: Masowe zapraszanie użytkowników
**Given:**
- Lista 20 różnych e-maili (mieszanka istniejących i nowych)

**When:**
- Wysyłanie zaproszeń

**Then:**
- ✅ Czas wykonania < 5 sekund
- ✅ Wszystkie zaproszenia utworzone poprawnie
- ✅ Wszystkie e-maile wysłane

#### TC-016: Pobieranie zaproszeń przy dużej liczbie
**Given:**
- Użytkownik ma 50 oczekujących zaproszeń

**When:**
- Pobieranie listy zaproszeń

**Then:**
- ✅ Czas wykonania < 2 sekundy
- ✅ Wszystkie zaproszenia zwrócone
- ✅ Poprawne sortowanie (najnowsze pierwsze)
