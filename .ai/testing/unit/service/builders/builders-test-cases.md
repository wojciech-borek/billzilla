# Plan testów jednostkowych: Builders

## Plik: src/lib/services/builders/GroupBuilder.ts

### UT-GroupBuilder-001

**Nazwa testu:** should_build_group_list_item_dto_successfully
**Moduł / funkcja:** GroupBuilder.buildGroupListItem
**Cel testu:** Weryfikacja budowania GroupListItemDTO z ustawionymi danymi
**Wejście / dane testowe:** groupData, userRole, userBalance, members
**Setup / izolacja:** Nowa instancja GroupBuilder z Supabase client
**Kroki testowe (Arrange → Act → Assert):**

- Ustaw groupData, userRole, userBalance, members
- Wywołaj buildGroupListItem
- Sprawdź czy zwrócony zostanie prawidłowy DTO
  **Oczekiwany rezultat:** GroupListItemDTO z wszystkimi ustawionymi właściwościami
  **Priorytet:** Wysoki
  **Edge cases:** Brak groupData (powinien rzucić błąd)
  **Notatki / uwagi:** Testować wszystkie właściwości DTO

### UT-GroupBuilder-002

**Nazwa testu:** should_build_group_detail_dto_with_separated_currencies
**Moduł / funkcja:** GroupBuilder.buildGroupDetail
**Cel testu:** Weryfikacja budowania GroupDetailDTO z separacją walut bazowej i dodatkowych
**Wejście / dane testowe:** groupData, currencies zawierające walutę bazową
**Setup / izolacja:** GroupBuilder z ustawionymi danymi
**Kroki testowe (Arrange → Act → Assert):**

- Ustaw groupData i currencies z walutą bazową
- Wywołaj buildGroupDetail
- Sprawdź separację base currency od additional currencies
  **Oczekiwany rezultat:** GroupDetailDTO z prawidłową separacją walut
  **Priorytet:** Wysoki
  **Edge cases:** Brak waluty bazowej w currencies
  **Notatki / uwagi:** Sprawdzić logikę filtrowania walut

### UT-GroupBuilder-003

**Nazwa testu:** should_build_create_group_response_dto
**Moduł / funkcja:** GroupBuilder.buildCreateGroupResponse
**Cel testu:** Weryfikacja budowania CreateGroupResponseDTO
**Wejście / dane testowe:** groupData, invitationsResult
**Setup / izolacja:** GroupBuilder z ustawionymi danymi
**Kroki testowe (Arrange → Act → Assert):**

- Ustaw groupData i wywołaj buildCreateGroupResponse
- Sprawdź czy DTO zawiera dane grupy i zaproszeń
  **Oczekiwany rezultat:** CreateGroupResponseDTO z groupData i invitations
  **Priorytet:** Wysoki
  **Edge cases:** Brak groupData (powinien rzucić błąd)
  **Notatki / uwagi:** Testować integrację z invitationsResult

### UT-GroupBuilder-004

**Nazwa testu:** should_chain_builder_methods_fluently
**Moduł / funkcja:** GroupBuilder (method chaining)
**Cel testu:** Weryfikacja płynnego łączenia metod builder'a
**Wejście / dane testowe:** Kolejne wywołania metod with\*
**Setup / izolacja:** Nowa instancja GroupBuilder
**Kroki testowe (Arrange → Act → Assert):**

- Wywołaj kolejno withGroupData, withUserRole, withUserBalance
- Sprawdź czy każda metoda zwraca this (GroupBuilder)
- Wywołaj build i sprawdź czy zawiera wszystkie dane
  **Oczekiwany rezultat:** GroupBuilder pozwala na płynne łączenie metod
  **Priorytet:** Średni
  **Edge cases:** Próba build bez wymaganych danych
  **Notatki / uwagi:** Testować fluent interface

### UT-GroupBuilder-005

**Nazwa testu:** should_reset_builder_to_initial_state
**Moduł / funkcja:** GroupBuilder.reset
**Cel testu:** Weryfikacja resetowania builder'a do stanu początkowego
**Wejście / dane testowe:** GroupBuilder z ustawionymi danymi
**Setup / izolacja:** GroupBuilder z danymi
**Kroki testowe (Arrange → Act → Assert):**

- Ustaw różne dane w builder
- Wywołaj reset
- Sprawdź czy wszystkie właściwości zostały zresetowane
  **Oczekiwany rezultat:** Builder w stanie początkowym
  **Priorytet:** Średni
  **Edge cases:** Reset po częściowym ustawieniu danych
  **Notatki / uwagi:** Sprawdzić wszystkie właściwości reset

### UT-GroupBuilder-006

**Nazwa testu:** should_create_group_list_factory_builder
**Moduł / funkcja:** GroupBuilderFactory.forGroupList
**Cel testu:** Weryfikacja tworzenia builder'a przez factory method
**Wejście / dane testowe:** supabase client
**Setup / izolacja:** Wywołaj factory method
**Kroki testowe (Arrange → Act → Assert):**

- Wywołaj GroupBuilderFactory.forGroupList
- Sprawdź czy zwrócona zostanie nowa instancja GroupBuilder
  **Oczekiwany rezultat:** Nowa instancja GroupBuilder
  **Priorytet:** Niski
  **Edge cases:** Nieprawidłowy supabase client
  **Notatki / uwagi:** Testować wszystkie factory methods

### UT-GroupBuilder-007

**Nazwa testu:** should_create_group_detail_factory_builder
**Moduł / funkcja:** GroupBuilderFactory.forGroupDetail
**Cel testu:** Weryfikacja factory method dla group detail
**Wejście / dane testowe:** supabase client
**Setup / izolacja:** Wywołaj factory method
**Kroki testowe (Arrange → Act → Assert):**

- Wywołaj GroupBuilderFactory.forGroupDetail
- Sprawdź czy zwrócona zostanie nowa instancja
  **Oczekiwany rezultat:** Nowa instancja GroupBuilder
  **Priorytet:** Niski
  **Edge cases:** Podobnie jak w teście 006
  **Notatki / uwagi:** Test factory methods

### UT-GroupBuilder-008

**Nazwa testu:** should_create_group_creation_factory_builder
**Moduł / funkcja:** GroupBuilderFactory.forGroupCreation
**Cel testu:** Weryfikacja factory method dla group creation
**Wejście / dane testowe:** supabase client
**Setup / izolacja:** Wywołaj factory method
**Kroki testowe (Arrange → Act → Assert):**

- Wywołaj GroupBuilderFactory.forGroupCreation
- Sprawdź czy zwrócona zostanie nowa instancja
  **Oczekiwany rezultat:** Nowa instancja GroupBuilder
  **Priorytet:** Niski
  **Edge cases:** Podobnie jak w teście 006
  **Notatki / uwagi:** Test factory methods
