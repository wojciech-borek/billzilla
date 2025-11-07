# Zmiany w API - Poprawa prywatności zaproszeń

## Data: 2025-11-06
## Status: Zaimplementowane ✅

## 1. Endpoint: POST /api/groups/:groupId/members/invite

### Zmiany w logice

**Przed zmianami:**
- Istniejący użytkownik → natychmiast dodany do grupy (`group_members.status = 'active'`)
- Nowy użytkownik → zaproszenie ze statusem `pending`

**Po zmianach:**
- Wszyscy użytkownicy → zaproszenie ze statusem `pending`
- Wysyłanie powiadomień e-mail do wszystkich zaproszonych

### Kod zmiany

```typescript
// src/pages/api/groups/[groupId]/members/invite.ts

for (const email of emails) {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    // NOWE: Zawsze twórz zaproszenie, nawet dla istniejących użytkowników
    await createInvitation({
      email,
      group_id: groupId,
      invitee_profile_id: existingUser.id, // NOWE POLE
      status: 'pending'
    });

    // NOWE: Wyślij powiadomienie e-mail do istniejącego użytkownika
    await sendInvitationEmail(email, groupId, 'existing_user');
  } else {
    // Bez zmian dla nowych użytkowników
    await createInvitation({
      email,
      group_id: groupId,
      status: 'pending'
    });

    await sendInvitationEmail(email, groupId, 'new_user');
  }
}
```

## 2. Endpoint: POST /api/groups

### Zmiany w tworzeniu grupy z zaproszeniami

**Przed zmianami:**
- `invite_emails` → istniejący użytkownicy dodawani natychmiast

**Po zmianach:**
- `invite_emails` → wszyscy otrzymują zaproszenia wymagające akceptacji

```typescript
// src/pages/api/groups/index.ts
// Analogiczna zmiana jak w invite endpoint
```

## 3. Endpoint: GET /api/invitations

### Nowa logika wyszukiwania

**Przed zmianami:**
- Tylko zaproszenia dla nowych użytkowników (po `email`)

**Po zmianach:**
- Zaproszenia dla istniejących użytkowników (po `invitee_profile_id`)
- Zaproszenia dla nowych użytkowników (po `email`)

```typescript
// src/pages/api/invitations/index.ts

const userInvitations = await db
  .selectFrom('invitations')
  .selectAll()
  .where(eb => eb.or([
    // Istniejący użytkownik - zaproszenia po profile_id
    eb('invitee_profile_id', '=', userId),
    // Nowy użytkownik - zaproszenia po email
    eb.and([
      eb('email', '=', userEmail),
      eb('invitee_profile_id', 'is', null)
    ])
  ]))
  .where('status', '=', 'pending')
  .execute();
```

## 4. Endpoint: POST /api/invitations/:id/accept

### Rozszerzona obsługa

**Przed zmianami:**
- Tylko dla nowych użytkowników (dodanie do `profiles` + `group_members`)

**Po zmianach:**
- Dla istniejących użytkowników: tylko dodanie do `group_members`
- Dla nowych użytkowników: bez zmian

```typescript
// src/pages/api/invitations/[id]/accept.ts

const invitation = await getInvitationById(id);

if (invitation.invitee_profile_id) {
  // Istniejący użytkownik - tylko dodaj do grupy
  await addUserToGroup(invitation.invitee_profile_id, invitation.group_id);
} else {
  // Nowy użytkownik - pełna rejestracja + dodanie do grupy
  // ... existing logic
}
```

## 5. Nowe funkcje pomocnicze

### sendInvitationEmail()

```typescript
// src/lib/services/emailService.ts

async function sendInvitationEmail(
  email: string,
  groupId: string,
  type: 'new_user' | 'existing_user'
) {
  const template = type === 'existing_user'
    ? 'existing-user-invitation.html'
    : 'new-user-invitation.html';

  // Wysyłanie e-maila przez Supabase Auth
}
```

### findUserByEmail()

```typescript
// src/lib/services/userService.ts

async function findUserByEmail(email: string) {
  return await db
    .selectFrom('profiles')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
}
```

## 6. Zmiany w schematach Zod

### Invitation schema

```typescript
// src/lib/schemas/invitation.ts

export const invitationSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  group_id: z.string().uuid(),
  invitee_profile_id: z.string().uuid().nullable(), // NOWE POLE
  status: z.enum(['pending', 'accepted', 'declined']),
  created_at: z.date(),
  updated_at: z.date()
});
```

## 7. Testowanie zmian

### Test cases do dodania

1. **Zaproszenie istniejącego użytkownika**
   - POST /api/groups/:id/members/invite z istniejącym emailem
   - Sprawdzenie utworzenia zaproszenia z `invitee_profile_id`
   - Sprawdzenie wysłania e-maila

2. **Akceptacja zaproszenia przez istniejącego użytkownika**
   - POST /api/invitations/:id/accept
   - Sprawdzenie dodania do `group_members`
   - Sprawdzenie zmiany statusu na 'accepted'

3. **Lista zaproszeń dla zalogowanego użytkownika**
   - GET /api/invitations
   - Sprawdzenie zwrócenia wszystkich zaproszeń (istniejący + nowy użytkownik)</contents>

