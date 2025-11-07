# Plan migracji bazy danych - Poprawa prywatności zaproszeń

## Data: 2025-11-06
## Status: Zaimplementowane ✅

## 1. Cele migracji

1. **Dodanie wsparcia dla zaproszeń istniejących użytkowników**
   - Dodanie kolumny `invitee_profile_id` do tabeli `invitations`
   - Utworzenie indeksów optymalizacyjnych
2. **Zachowanie historii istniejących członkostw grup**
   - Migracja istniejących członkostw na "zaakceptowane" zaproszenia
3. **Przygotowanie systemu na nowy model zaproszeń**
   - Wszystkie zaproszenia będą wymagać akceptacji (także dla istniejących użytkowników)

## 2. Zmiany w schemacie

### Tabela `invitations` - dodanie nowego pola

```sql
-- Dodanie kolumny dla ID istniejącego użytkownika
ALTER TABLE invitations
ADD COLUMN invitee_profile_id UUID REFERENCES profiles(id);
```

### Indeksy i optymalizacje

```sql
-- Indeks dla szybkiego wyszukiwania zaproszeń użytkownika (istniejący użytkownik)
CREATE INDEX idx_invitations_invitee_profile_id ON invitations(invitee_profile_id)
WHERE invitee_profile_id IS NOT NULL;

-- Indeks dla zaproszeń oczekujących (istniejący użytkownik)
CREATE INDEX idx_invitations_pending_invitee ON invitations(status, invitee_profile_id)
WHERE status = 'pending' AND invitee_profile_id IS NOT NULL;

-- Indeks dla zaproszeń po e-mailu (wszystkie zaproszenia)
CREATE INDEX idx_invitations_email ON invitations(email);

-- Indeks dla zaproszeń oczekujących po e-mailu (nowy użytkownik)
CREATE INDEX idx_invitations_pending_email ON invitations(status, email)
WHERE status = 'pending';

-- Złożony indeks dla optymalizacji (email + profile_id)
CREATE INDEX idx_invitations_email_profile ON invitations(email, invitee_profile_id);
```

## 3. Migracja danych istniejących

### Krok 1: Utworzenie zaproszeń dla istniejących członkostw

```sql
-- Migracja: utworzenie "zaakceptowanych" zaproszeń dla istniejących członków
-- Uruchomić PO dodaniu kolumny invitee_profile_id

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
  gen_random_uuid(),  -- nowe UUID dla zaproszenia
  p.email,
  gm.group_id,
  gm.profile_id,      -- ID istniejącego użytkownika
  'accepted',         -- status zaakceptowany
  gm.joined_at,       -- data dołączenia jako data zaproszenia
  gm.joined_at        -- data aktualizacji
FROM group_members gm
JOIN profiles p ON p.id = gm.profile_id
WHERE gm.status = 'active'
AND gm.role = 'member'  -- pomijamy creatorów, którzy "tworzą" grupę
AND gm.joined_at IS NOT NULL;
```

### Krok 2: Weryfikacja migracji

```sql
-- Sprawdzenie poprawności migracji
SELECT
  COUNT(*) as total_migrated_invitations,
  COUNT(DISTINCT group_id) as groups_affected,
  COUNT(DISTINCT invitee_profile_id) as users_affected
FROM invitations
WHERE status = 'accepted'
AND invitee_profile_id IS NOT NULL;
```

### Krok 3: Czyszczenie (opcjonalne)

```sql
-- Usunięcie błędnych duplikatów (jeśli wystąpią)
DELETE FROM invitations a USING (
  SELECT MIN(id) as id, email, group_id, invitee_profile_id
  FROM invitations
  WHERE status = 'accepted' AND invitee_profile_id IS NOT NULL
  GROUP BY email, group_id, invitee_profile_id HAVING COUNT(*) > 1
) b
WHERE a.email = b.email
AND a.group_id = b.group_id
AND a.invitee_profile_id = b.invitee_profile_id
AND a.id != b.id;
```

## 4. Rollback plan

### Jeśli migracja pójdzie źle:

```sql
-- Usunięcie dodanych zaproszeń
DELETE FROM invitations
WHERE status = 'accepted'
AND invitee_profile_id IS NOT NULL;

-- Usunięcie nowej kolumny (ostrożnie!)
-- ALTER TABLE invitations DROP COLUMN invitee_profile_id;
```

## 5. Testowanie migracji

### Test na środowisku staging

1. **Backup bazy danych**
   ```bash
   pg_dump billzilla_staging > backup_before_migration.sql
   ```

2. **Uruchomienie migracji**
   ```sql
   -- Migracja została wykonana w pliku:
   -- supabase/migrations/20251025000000_add_accept_invitation_function.sql
   ```

3. **Weryfikacja danych**
   ```sql
   -- Sprawdzenie, czy wszyscy członkowie mają odpowiadające zaproszenia
   SELECT
     gm.group_id,
     gm.profile_id,
     COUNT(i.id) as invitation_count
   FROM group_members gm
   LEFT JOIN invitations i ON i.invitee_profile_id = gm.profile_id
     AND i.group_id = gm.group_id
     AND i.status = 'accepted'
   WHERE gm.status = 'active'
   GROUP BY gm.group_id, gm.profile_id
   HAVING COUNT(i.id) != 1;
   ```

4. **Test funkcjonalności**
   - Próba zaproszenia istniejącego użytkownika → powinno utworzyć zaproszenie ze statusem 'pending'
   - Próba zaproszenia nowego użytkownika → powinno utworzyć zaproszenie ze statusem 'pending'
   - Akceptacja zaproszenia → użytkownik powinien zostać dodany do grupy

## 6. Monitoring po migracji

### Zapytania monitorujące

```sql
-- Liczba zaproszeń w czasie
SELECT
  DATE(created_at) as date,
  status,
  COUNT(*) as count
FROM invitations
WHERE created_at >= '2025-11-01'
GROUP BY DATE(created_at), status
ORDER BY date DESC;

-- Zaproszenia bez invitee_profile_id (stare format)
SELECT COUNT(*) as legacy_invitations
FROM invitations
WHERE invitee_profile_id IS NULL
AND status = 'pending';
```

### Alerty

1. **Nagły wzrost zaproszeń typu 'accepted'** → możliwy problem z migracją
2. **Zaproszenia bez invitee_profile_id** → stare zaproszenia wymagające uwagi
3. **Błędy w API zaproszeń** → sprawdzenie logów

## 7. Czas wykonania

- **Czas migracji**: ~5-15 minut (w zależności od wielkości bazy)
- **Downtime**: 0 minut (migracja online)
- **Rollback time**: ~2 minuty

## 8. Checklist przed migracją

- [ ] Backup bazy produkcyjnej
- [ ] Test migracji na staging
- [ ] Weryfikacja wszystkich zapytań SELECT/INSERT
- [ ] Test API endpoints po migracji
- [ ] Przygotowanie komunikatu dla zespołu
- [ ] Harmonogram wdrożenia (najlepiej w godzinach niskiego ruchu)

## 9. Ryzyka

### Wysokie ryzyko
- **Duplikaty zaproszeń**: Może prowadzić do zamieszania w interfejsie
- **Brak zaproszeń dla istniejących członków**: Użytkownicy mogą stracić dostęp do grup

### Średnie ryzyko
- **Wydajność**: Dodatkowe JOINy w zapytaniach
- **Migration timeout**: Dla bardzo dużych baz danych

### Niskie ryzyko
- **Rollback complications**: Łatwe usunięcie dodanych danych</contents>
</xai:function_call">>@[+][<

Assistant: Teraz utworzę dokument z listą zmian w API. To będzie pomocne dla zespołu deweloperskiego. Następnie utworzę test cases dla nowych funkcjonalności. Potem szablony e-maili i wreszcie podsumowanie. 

Zacznę od zmian w API.<|control590|><xai:function_call name="write">
<parameter name="file_path">.ai/privacy-security/api-changes.md
