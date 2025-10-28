# Plan testów jednostkowych: Repositories

## Plik: src/lib/services/repositories/ExpenseRepository.ts

### UT-ExpenseRepository-001
**Nazwa testu:** should return group membership and currencies when user is active member
**Moduł / funkcja:** ExpenseRepository.fetchGroupMembershipAndCurrencies
**Cel testu:** Weryfikacja poprawnego pobierania danych członkostwa grupy i walut dla aktywnego członka
**Wejście / dane testowe:** groupId: "group-123", userId: "user-456"
**Setup / izolacja:** Mock Supabase client, skonfiguruj dane testowe z aktywnym członkostwem i walutami
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock z danymi grupy, walut i członkiem
- Wywołaj fetchGroupMembershipAndCurrencies
- Sprawdź czy zwrócone dane zawierają prawidłowe informacje
**Oczekiwany rezultat:** Obiekt z id grupy, base_currency_code, group_currencies i group_members
**Priorytet:** Wysoki
**Edge cases:** Użytkownik nie jest członkiem grupy, użytkownik jest nieaktywny, brak danych walut
**Notatki / uwagi:** Testować zarówno pomyślne przypadki jak i błędy

### UT-ExpenseRepository-002
**Nazwa testu:** should throw error when user not active member
**Moduł / funkcja:** ExpenseRepository.fetchGroupMembershipAndCurrencies
**Cel testu:** Weryfikacja błędu gdy użytkownik nie jest aktywnym członkiem grupy
**Wejście / dane testowe:** groupId: "group-123", userId: "inactive-user"
**Setup / izolacja:** Mock Supabase client z nieaktywnym członkostwem
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock z nieaktywnym członkostwem użytkownika
- Wywołaj fetchGroupMembershipAndCurrencies
- Sprawdź czy rzucony zostanie błąd z odpowiednią wiadomością
**Oczekiwany rezultat:** Error: "Group not found or user is not an active member"
**Priorytet:** Wysoki
**Edge cases:** Użytkownik nie istnieje w grupie, status inny niż "active"
**Notatki / uwagi:** Sprawdzić różne stany członkostwa

### UT-ExpenseRepository-003
**Nazwa testu:** should return active group members successfully
**Moduł / funkcja:** ExpenseRepository.fetchActiveGroupMembers
**Cel testu:** Weryfikacja poprawnego pobierania aktywnych członków grupy
**Wejście / dane testowe:** groupId: "group-123"
**Setup / izolacja:** Mock Supabase client z listą aktywnych członków
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock z 3 aktywnymi członkami
- Wywołaj fetchActiveGroupMembers
- Sprawdź czy zwrócona lista zawiera wszystkich aktywnych członków
**Oczekiwany rezultat:** Array z profile_id wszystkich aktywnych członków
**Priorytet:** Wysoki
**Edge cases:** Brak aktywnych członków, błąd bazy danych
**Notatki / uwagi:** Testować kompatybilność z różnymi formatami odpowiedzi Supabase

### UT-ExpenseRepository-004
**Nazwa testu:** should create expense and return id
**Moduł / funkcja:** ExpenseRepository.createExpense
**Cel testu:** Weryfikacja poprawnego tworzenia wydatku i zwracania jego ID
**Wejście / dane testowe:** expenseData z prawidłowymi polami
**Setup / izolacja:** Mock Supabase client
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj expenseData z wymaganymi polami
- Wywołaj createExpense
- Sprawdź czy zwrócone zostanie poprawne ID wydatku
**Oczekiwany rezultat:** Obiekt { id: "expense-uuid" }
**Priorytet:** Wysoki
**Edge cases:** Błąd podczas tworzenia wydatku, nieprawidłowe dane wejściowe
**Notatki / uwagi:** Sprawdzić wywołanie insert z właściwymi parametrami

### UT-ExpenseRepository-005
**Nazwa testu:** should create expense splits successfully
**Moduł / funkcja:** ExpenseRepository.createExpenseSplits
**Cel testu:** Weryfikacja poprawnego tworzenia podziałów wydatku
**Wejście / dane testowe:** Array splits z expense_id, profile_id i amount
**Setup / izolacja:** Mock Supabase client
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj array splits z danymi podziałów
- Wywołaj createExpenseSplits
- Sprawdź czy nie rzucony zostanie błąd
**Oczekiwany rezultat:** void (bez błędu)
**Priorytet:** Wysoki
**Edge cases:** Pusty array splits, błąd podczas tworzenia
**Notatki / uwagi:** Sprawdzić wywołanie insert z właściwymi danymi

### UT-ExpenseRepository-006
**Nazwa testu:** should fetch complete expense with all data
**Moduł / funkcja:** ExpenseRepository.fetchCompleteExpense
**Cel testu:** Weryfikacja pobierania kompletnych danych wydatku wraz z powiązaniami
**Wejście / dane testowe:** expenseId: "expense-123"
**Setup / izolacja:** Mock Supabase client z kompletnymi danymi wydatku
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock z danymi wydatku, płatnika i podziałów
- Wywołaj fetchCompleteExpense
- Sprawdź czy zwrócone dane zawierają wszystkie powiązane informacje
**Oczekiwany rezultat:** Kompletny obiekt expense z profiles i expense_splits
**Priorytet:** Wysoki
**Edge cases:** Wydatek nie istnieje, błąd podczas pobierania
**Notatki / uwagi:** Sprawdzić złożony select z joinami

### UT-ExpenseRepository-007
**Nazwa testu:** should delete expense successfully
**Moduł / funkcja:** ExpenseRepository.deleteExpense
**Cel testu:** Weryfikacja poprawnego usuwania wydatku
**Wejście / dane testowe:** expenseId: "expense-123"
**Setup / izolacja:** Mock Supabase client
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock dla delete operacji
- Wywołaj deleteExpense
- Sprawdź czy wywołana zostanie metoda delete z właściwymi parametrami
**Oczekiwany rezultat:** void
**Priorytet:** Średni
**Edge cases:** Wydatek nie istnieje
**Notatki / uwagi:** Testować głównie wywołanie API

### UT-ExpenseRepository-008
**Nazwa testu:** should fetch group expenses with pagination
**Moduł / funkcja:** ExpenseRepository.fetchGroupExpenses
**Cel testu:** Weryfikacja pobierania wydatków grupy z paginacją
**Wejście / dane testowe:** groupId, userId, options z limit i offset
**Setup / izolacja:** Mock Supabase client, użytkownik jest członkiem grupy
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock z wydatkami grupy
- Wywołaj fetchGroupExpenses z opcjami
- Sprawdź czy zwrócona zostanie prawidłowa lista wydatków
**Oczekiwany rezultat:** Array wydatków posortowanych i paginowanych
**Priorytet:** Wysoki
**Edge cases:** Użytkownik nie jest członkiem, brak wydatków, różne opcje sortowania
**Notatki / uwagi:** Sprawdzić weryfikację członkostwa przed pobraniem


## Plik: src/lib/services/repositories/GroupRepository.ts

### UT-GroupRepository-001
**Nazwa testu:** should fetch user groups with roles successfully
**Moduł / funkcja:** GroupRepository.fetchUserGroupsWithRoles
**Cel testu:** Weryfikacja pobierania grup użytkownika wraz z rolami
**Wejście / dane testowe:** userId, status, limit, offset
**Setup / izolacja:** Mock Supabase client z danymi grup i członkostwa
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock z grupami gdzie użytkownik jest członkiem
- Wywołaj fetchUserGroupsWithRoles
- Sprawdź czy zwrócona zostanie lista grup z rolami
**Oczekiwany rezultat:** Array grup z danymi członkostwa
**Priorytet:** Wysoki
**Edge cases:** Brak grup, błąd podczas pobierania
**Notatki / uwagi:** Sprawdzić filtrowanie po statusie i paginację

### UT-GroupRepository-002
**Nazwa testu:** should count user groups by status
**Moduł / funkcja:** GroupRepository.countUserGroups
**Cel testu:** Weryfikacja liczenia grup użytkownika wg statusu
**Wejście / dane testowe:** userId, status
**Setup / izolacja:** Mock Supabase client
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock z określoną liczbą grup
- Wywołaj countUserGroups
- Sprawdź czy zwrócona zostanie prawidłowa liczba
**Oczekiwany rezultat:** Liczba całkowita grup
**Priorytet:** Średni
**Edge cases:** Brak grup, błąd podczas liczenia
**Notatki / uwagi:** Sprawdzić filtrowanie po statusie

### UT-GroupRepository-003
**Nazwa testu:** should fetch group with membership details
**Moduł / funkcja:** GroupRepository.fetchGroupWithMembership
**Cel testu:** Weryfikacja pobierania szczegółów grupy wraz z członkostwem
**Wejście / dane testowe:** groupId, userId
**Setup / izolacja:** Mock Supabase client, użytkownik jest aktywnym członkiem
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock z danymi grupy i członkostwa
- Wywołaj fetchGroupWithMembership
- Sprawdź czy zwrócone zostaną pełne dane grupy
**Oczekiwany rezultat:** Obiekt grupy z danymi członkostwa
**Priorytet:** Wysoki
**Edge cases:** Użytkownik nie jest członkiem, grupa nie istnieje
**Notatki / uwagi:** Sprawdzić weryfikację członkostwa

### UT-GroupRepository-004
**Nazwa testu:** should fetch basic group information
**Moduł / funkcja:** GroupRepository.fetchGroupBasic
**Cel testu:** Weryfikacja pobierania podstawowych informacji grupy
**Wejście / dane testowe:** groupId
**Setup / izolacja:** Mock Supabase client
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock z basic informacjami grupy
- Wywołaj fetchGroupBasic
- Sprawdź czy zwrócony zostanie base_currency_code
**Oczekiwany rezultat:** Obiekt z base_currency_code
**Priorytet:** Średni
**Edge cases:** Grupa nie istnieje
**Notatki / uwagi:** Testować tylko podstawowe dane

### UT-GroupRepository-005
**Nazwa testu:** should fetch group currencies ordered
**Moduł / funkcja:** GroupRepository.fetchGroupCurrencies
**Cel testu:** Weryfikacja pobierania walut grupy w odpowiedniej kolejności
**Wejście / dane testowe:** groupId
**Setup / izolacja:** Mock Supabase client z listą walut
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock z walutami grupy
- Wywołaj fetchGroupCurrencies
- Sprawdź czy zwrócone waluty są posortowane
**Oczekiwany rezultat:** Array walut posortowany po currency_code
**Priorytet:** Średni
**Edge cases:** Brak walut, błąd podczas pobierania
**Notatki / uwagi:** Sprawdzić sortowanie po currency_code

### UT-GroupRepository-006
**Nazwa testu:** should fetch pending invitations ordered by date
**Moduł / funkcja:** GroupRepository.fetchPendingInvitations
**Cel testu:** Weryfikacja pobierania oczekujących zaproszeń posortowanych
**Wejście / dane testowe:** groupId
**Setup / izolacja:** Mock Supabase client z zaproszeniami
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock z pending zaproszeniami
- Wywołaj fetchPendingInvitations
- Sprawdź czy zaproszenia są posortowane malejąco po created_at
**Oczekiwany rezultat:** Array zaproszeń posortowanych po dacie
**Priorytet:** Średni
**Edge cases:** Brak zaproszeń, błędy nie są propagowane
**Notatki / uwagi:** Sprawdzić że błędy nie są rzucone

### UT-GroupRepository-007
**Nazwa testu:** should verify active group membership
**Moduł / funkcja:** GroupRepository.verifyGroupMembership
**Cel testu:** Weryfikacja sprawdzania aktywnego członkostwa w grupie
**Wejście / dane testowe:** groupId, userId
**Setup / izolacja:** Mock Supabase client
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock z aktywnym członkostwem
- Wywołaj verifyGroupMembership
- Sprawdź czy zwrócone zostanie true
**Oczekiwany rezultat:** true/false w zależności od statusu członkostwa
**Priorytet:** Wysoki
**Edge cases:** Brak członkostwa, błąd bazy danych
**Notatki / uwagi:** Testować różne stany członkostwa

### UT-GroupRepository-008
**Nazwa testu:** should create group atomically with members and currencies
**Moduł / funkcja:** GroupRepository.createGroupAtomically
**Cel testu:** Weryfikacja atomowego tworzenia grupy z członkami i walutami
**Wejście / dane testowe:** params z groupName, baseCurrencyCode, creatorId, inviteEmails
**Setup / izolacja:** Mock Supabase client z RPC funkcją
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj mock dla RPC funkcji create_group_transaction
- Wywołaj createGroupAtomically
- Sprawdź czy zwrócone zostaną dane nowej grupy
**Oczekiwany rezultat:** Dane utworzonej grupy
**Priorytet:** Wysoki
**Edge cases:** Błąd podczas tworzenia, nieprawidłowe parametry
**Notatki / uwagi:** Sprawdzić wywołanie RPC z właściwymi parametrami

### UT-GroupRepository-009
**Nazwa testu:** should extract user role from group data
**Moduł / funkcja:** GroupRepository.extractUserRole
**Cel testu:** Weryfikacja ekstrakcji roli użytkownika z danych grupy
**Wejście / dane testowe:** groupData z group_members
**Setup / izolacja:** Dane testowe z rolą użytkownika
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj groupData z rolą "admin"
- Wywołaj extractUserRole
- Sprawdź czy zwrócona zostanie prawidłowa rola
**Oczekiwany rezultat:** "admin" lub "member" jako fallback
**Priorytet:** Średni
**Edge cases:** Brak danych członków, puste role
**Notatki / uwagi:** Testować logikę fallback

### UT-GroupRepository-010
**Nazwa testu:** should extract user membership details
**Moduł / funkcja:** GroupRepository.extractUserMembership
**Cel testu:** Weryfikacja ekstrakcji szczegółów członkostwa użytkownika
**Wejście / dane testowe:** groupData z membership details
**Setup / izolacja:** Dane testowe z pełnymi szczegółami członkostwa
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj groupData z role, status, joined_at
- Wywołaj extractUserMembership
- Sprawdź czy zwrócone zostaną pełne szczegóły
**Oczekiwany rezultat:** Obiekt z role, status i joined_at
**Priorytet:** Średni
**Edge cases:** Brak danych, nieprawidłowe dane
**Notatki / uwagi:** Testować logikę fallback dla pustych danych
