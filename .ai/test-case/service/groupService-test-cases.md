# Group Service Unit Test Cases

## Module: createGroup

### UT-groupService-01
**Nazwa testu:** should_create_group_successfully_when_valid_currency_and_data  
**Moduł / funkcja:** createGroup  
**Cel testu:** Weryfikuje pomyślne utworzenie grupy z prawidłową walutą bazową i danymi zaproszeń  
**Wejście / dane testowe:** command: {name: "Test Group", base_currency_code: "USD", invite_emails: ["user1@test.com", "user2@test.com"]}, userId: "user-123"  
**Setup / izolacja:** Mock supabase.from("currencies").select().eq().single() → returns {code: "USD"}, mock supabase.rpc("create_group_transaction") → returns array with group data and invitation results  
**Kroki testowe:** Arrange: Setup mocks, Act: Call createGroup, Assert: Verify returned object matches expected structure with correct role and invitations  
**Oczekiwany rezultat:** Returns CreateGroupResponseDTO with role: "creator" and parsed invitation results  
**Priorytet:** wysoki  
**Edge cases:** invite_emails: null, invite_emails: undefined, invite_emails: empty array  
**Notatki / uwagi:** Requires mocking Supabase RPC call which is complex database transaction

### UT-groupService-02
**Nazwa testu:** should_throw_currency_not_found_when_invalid_base_currency  
**Moduł / funkcja:** createGroup  
**Cel testu:** Weryfikuje rzucenie błędu gdy podana waluta bazowa nie istnieje  
**Wejście / dane testowe:** command: {name: "Test Group", base_currency_code: "INVALID", invite_emails: []}, userId: "user-123"  
**Setup / izolacja:** Mock supabase.from("currencies").select().eq().single() → returns null/error  
**Kroki testowe:** Arrange: Setup mock to return no currency, Act: Call createGroup, Assert: Verify CurrencyNotFoundError is thrown with correct message  
**Oczekiwany rezultat:** Throws CurrencyNotFoundError with message containing "INVALID"  
**Priorytet:** wysoki  
**Edge cases:** currency exists but query fails, case-sensitive currency codes  
**Notatki / uwagi:** Tests early validation before expensive RPC call

### UT-groupService-03
**Nazwa testu:** should_throw_transaction_error_when_rpc_fails  
**Moduł / funkcja:** createGroup  
**Cel testu:** Weryfikuje rzucenie błędu gdy transakcja RPC się nie powiedzie  
**Wejście / dane testowe:** command: {name: "Test Group", base_currency_code: "USD", invite_emails: []}, userId: "user-123"  
**Setup / izolacja:** Mock currencies validation success, mock supabase.rpc() → returns error or empty array  
**Kroki testowe:** Arrange: Setup successful currency validation, failing RPC, Act: Call createGroup, Assert: Verify TransactionError is thrown  
**Oczekiwany rezultat:** Throws TransactionError with message about transaction failure  
**Priorytet:** wysoki  
**Edge cases:** RPC returns empty array, RPC returns malformed data  
**Notatki / uwagi:** Critical error path for database transaction failures

## Module: listGroups

### UT-groupService-04 [POMINIĘTY - zbyt złożony do unit testingu]
**Nazwa testu:** should_return_paginated_groups_with_balances_when_user_has_groups
**Moduł / funkcja:** listGroups
**Cel testu:** Weryfikuje poprawne zwrócenie paginowanych grup z obliczeniami balansów
**Wejście / dane testowe:** userId: "user-123", options: {status: "active", limit: 10, offset: 0}
**Setup / izolacja:** Mock multiple supabase queries for groups, members, expenses, splits, settlements, currencies
**Kroki testowe:** Arrange: Setup comprehensive mocks with sample data, Act: Call listGroups, Assert: Verify returned structure with calculated balances
**Oczekiwany rezultat:** Returns PaginatedResponse with correct total count and GroupListItemDTO array with my_balance field
**Priorytet:** wysoki
**Edge cases:** limit: 0, offset > total groups, status: "inactive"
**Notatki / uwagi:** Complex test requiring coordination of 6+ database queries
**STATUS:** POMINIĘTY - funkcjonalność zbyt złożona do efektywnego unit testingu. Wymaga refaktoryzacji funkcji na mniejsze jednostki lub podejścia integracyjnego.

### UT-groupService-05
**Nazwa testu:** should_return_empty_result_when_user_has_no_groups  
**Moduł / funkcja:** listGroups  
**Cel testu:** Weryfikuje zwrócenie pustej listy gdy użytkownik nie ma grup  
**Wejście / dane testowe:** userId: "user-no-groups", options: {status: "active", limit: 50, offset: 0}  
**Setup / izolacja:** Mock groups query to return empty array  
**Kroki testowe:** Arrange: Setup empty groups result, Act: Call listGroups, Assert: Verify empty data array with total: 0  
**Oczekiwany rezultat:** Returns {data: [], total: 0, limit: 50, offset: 0}  
**Priorytet:** średni  
**Edge cases:** User exists but has only inactive groups, count query fails  
**Notatki / uwagi:** Simple case but important for UI handling

### UT-groupService-06
**Nazwa testu:** should_calculate_positive_balance_when_user_paid_more_than_owed  
**Moduł / funkcja:** listGroups  
**Cel testu:** Weryfikuje obliczenie dodatniego balansu dla użytkownika  
**Wejście / dane testowe:** userId: "user-123", group with expenses paid by user: 100 USD, splits owed: 50 USD  
**Setup / izolacja:** Mock expenses, splits, settlements data with user as net payer  
**Kroki testowe:** Arrange: Setup expense > splits, Act: Call listGroups, Assert: Verify my_balance > 0  
**Oczekiwany rezultat:** GroupListItemDTO with my_balance: 50 (paid 100 - owed 50)  
**Priorytet:** średni  
**Edge cases:** Exchange rate conversions, multiple currencies, settlements adjustments  
**Notatki / uwagi:** Tests complex balance calculation logic

### UT-groupService-07
**Nazwa testu:** should_calculate_negative_balance_when_user_owes_more_than_paid  
**Moduł / funkcja:** listGroups  
**Cel testu:** Weryfikuje obliczenie ujemnego balansu dla użytkownika  
**Wejście / dane testowe:** userId: "user-123", group with expenses paid: 30 USD, splits owed: 80 USD  
**Setup / izolacja:** Mock expenses, splits with user as net debtor  
**Kroki testowe:** Arrange: Setup splits > expenses, Act: Call listGroups, Assert: Verify my_balance < 0  
**Oczekiwany rezultat:** GroupListItemDTO with my_balance: -50 (paid 30 - owed 80)  
**Priorytet:** średni  
**Edge cases:** Zero balance, settlements cancel out debts  
**Notatki / uwagi:** Tests negative balance calculation

### UT-groupService-08
**Nazwa testu:** should_throw_error_when_groups_query_fails  
**Moduł / funkcja:** listGroups  
**Cel testu:** Weryfikuje obsługę błędów bazy danych  
**Wejście / dane testowe:** userId: "user-123", options: default  
**Setup / izolacja:** Mock supabase query to return error for groups fetch  
**Kroki testowe:** Arrange: Setup failing groups query, Act: Call listGroups, Assert: Verify Error is thrown  
**Oczekiwany rezultat:** Throws Error with "Failed to fetch groups" message  
**Priorytet:** średni  
**Edge cases:** Members query fails, currencies query fails, count query fails  
**Notatki / uwagi:** Tests error handling in complex query chain

## Module: getGroupCurrencies

### UT-groupService-09
**Nazwa testu:** should_return_group_currencies_when_user_is_member  
**Moduł / funkcja:** getGroupCurrencies  
**Cel testu:** Weryfikuje zwrócenie walut grupy dla członka  
**Wejście / dane testowe:** groupId: "group-123", userId: "user-123"  
**Setup / izolacja:** Mock membership verification success, mock currencies data with base and additional currencies  
**Kroki testowe:** Arrange: Setup mocks, Act: Call getGroupCurrencies, Assert: Verify returned GroupCurrenciesDTO structure  
**Oczekiwany rezultat:** Returns object with base_currency and additional_currencies arrays  
**Priorytet:** średni  
**Edge cases:** Only base currency, multiple additional currencies  
**Notatki / uwagi:** Tests currency separation logic

### UT-groupService-10
**Nazwa testu:** should_throw_error_when_user_not_group_member  
**Moduł / funkcja:** getGroupCurrencies  
**Cel testu:** Weryfikuje błąd dostępu dla nie-członka grupy  
**Wejście / dane testowe:** groupId: "group-123", userId: "non-member-user"  
**Setup / izolacja:** Mock membership query to return no results  
**Kroki testowe:** Arrange: Setup no membership, Act: Call getGroupCurrencies, Assert: Verify Error is thrown  
**Oczekiwany rezultat:** Throws Error with "Group not found or you are not a member"  
**Priorytet:** wysoki  
**Edge cases:** User inactive in group, group doesn't exist  
**Notatki / uwagi:** Security test for access control

### UT-groupService-11
**Nazwa testu:** should_return_base_currency_fallback_when_currencies_missing  
**Moduł / funkcja:** getGroupCurrencies  
**Cel testu:** Weryfikuje fallback gdy brakuje danych walut  
**Wejście / dane testowe:** groupId: "group-123", userId: "user-123", group base_currency_code: "USD"  
**Setup / izolacja:** Mock membership success, mock currencies query returns empty but group exists  
**Kroki testowe:** Arrange: Setup empty currencies, Act: Call getGroupCurrencies, Assert: Verify base_currency with fallback values  
**Oczekiwany rezultat:** base_currency: {code: "USD", name: "Unknown Currency", exchange_rate: 1.0}  
**Priorytet:** niski  
**Edge cases:** Group currencies query fails, partial currency data  
**Notatki / uwagi:** Tests error resilience and fallback behavior

## Module: getGroupDetails

### UT-groupService-12
**Nazwa testu:** should_return_complete_group_details_when_user_is_member  
**Moduł / funkcja:** getGroupDetails  
**Cel testu:** Weryfikuje zwrócenie pełnych szczegółów grupy dla członka  
**Wejście / dane testowe:** groupId: "group-123", userId: "user-123"  
**Setup / izolacja:** Mock all queries: group with membership, members, currencies, invitations  
**Kroki testowe:** Arrange: Setup comprehensive mocks, Act: Call getGroupDetails, Assert: Verify GroupDetailDTO structure  
**Oczekiwany rezultat:** Returns complete GroupDetailDTO with members, currencies, and pending invitations  
**Priorytet:** wysoki  
**Edge cases:** No pending invitations, empty members list, single member group  
**Notatki / uwagi:** Most comprehensive function requiring multiple query mocks

### UT-groupService-13
**Nazwa testu:** should_throw_error_when_group_not_found_or_user_not_member  
**Moduł / funkcja:** getGroupDetails  
**Cel testu:** Weryfikuje błąd dostępu dla nieprawidłowej grupy/użytkownika  
**Wejście / dane testowe:** groupId: "invalid-group", userId: "user-123"  
**Setup / izolacja:** Mock group query to return no results  
**Kroki testowe:** Arrange: Setup no group/membership, Act: Call getGroupDetails, Assert: Verify Error is thrown  
**Oczekiwany rezultat:** Throws Error with "Group not found or you are not a member"  
**Priorytet:** wysoki  
**Edge cases:** Group exists but user inactive, group inactive  
**Notatki / uwagi:** Critical security test

### UT-groupService-14
**Nazwa testu:** should_handle_missing_invitations_gracefully  
**Moduł / funkcja:** getGroupDetails  
**Cel testu:** Weryfikuje łagodną obsługę błędów zaproszeń  
**Wejście / dane testowe:** groupId: "group-123", userId: "user-123"  
**Setup / izolacja:** Mock successful group/members/currencies, mock invitations query to fail  
**Kroki testowe:** Arrange: Setup failing invitations query, Act: Call getGroupDetails, Assert: Verify empty pending_invitations array  
**Oczekiwany rezultat:** Returns GroupDetailDTO with pending_invitations: [] (no error thrown)  
**Priorytet:** średni  
**Edge cases:** Invitations query returns partial data, invitations exist but query fails  
**Notatki / uwagi:** Tests non-critical error handling

## Module: Error Classes

### UT-groupService-15
**Nazwa testu:** should_create_currency_not_found_error_with_correct_message  
**Moduł / funkcja:** CurrencyNotFoundError  
**Cel testu:** Weryfikuje konstrukcję błędu waluty  
**Wejście / dane testowe:** currencyCode: "XYZ"  
**Setup / izolacja:** None required  
**Kroki testowe:** Arrange: Create error instance, Act: Check properties, Assert: Verify message and name  
**Oczekiwany rezultat:** Error with name: "CurrencyNotFoundError", message: "Currency with code 'XYZ' does not exist"  
**Priorytet:** niski  
**Edge cases:** Empty string, null currency code  
**Notatki / uwagi:** Simple constructor test

### UT-groupService-16
**Nazwa testu:** should_create_transaction_error_with_custom_message  
**Moduł / funkcja:** TransactionError  
**Cel testu:** Weryfikuje konstrukcję błędu transakcji  
**Wejście / dane testowe:** message: "Database connection failed"  
**Setup / izolacja:** None required  
**Kroki testowe:** Arrange: Create error instance, Act: Check properties, Assert: Verify message and name  
**Oczekiwany rezultat:** Error with name: "TransactionError", message: "Database connection failed"  
**Priorytet:** niski  
**Edge cases:** Empty message, very long message  
**Notatki / uwagi:** Simple constructor test

## Summary

Najważniejsze moduły do pokrycia unit testami to `createGroup` (krytyczna funkcja biznesowa z transakcjami RPC), `listGroups` (główna funkcjonalność z złożonymi obliczeniami balansów) oraz `getGroupDetails` (szczegółowy widok z bezpieczeństwem dostępu). Te funkcje zawierają większość logiki biznesowej i są najbardziej narażone na błędy.
