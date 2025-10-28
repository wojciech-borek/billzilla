# Plan testów jednostkowych: Specifications

## Plik: src/lib/services/specifications/groupSpecifications.ts

### UT-Specifications-001
**Nazwa testu:** should return true when user is active member
**Moduł / funkcja:** UserIsActiveGroupMemberSpecification.isSatisfiedBy
**Cel testu:** Weryfikacja specyfikacji dla aktywnego członka grupy
**Wejście / dane testowe:** { groupId, userId } dla aktywnego członka
**Setup / izolacja:** Mock Supabase client z aktywnym członkostwem (używa membershipSpecFixtures.activeMember)
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj fixture z aktywnym członkostwem
- Wywołaj isSatisfiedBy
- Sprawdź czy zwrócone zostanie true
**Oczekiwany rezultat:** true dla aktywnego członka
**Priorytet:** Wysoki
**Edge cases:** Nieaktywny członek, brak członkostwa
**Notatki / uwagi:** Używa createBasicSpecTestFixture dla konsystencji

### UT-Specifications-002
**Nazwa testu:** should return true when currency exists
**Moduł / funkcja:** CurrencyExistsSpecification.isSatisfiedBy
**Cel testu:** Weryfikacja specyfikacji istnienia waluty
**Wejście / dane testowe:** currencyCode istniejącej waluty
**Setup / izolacja:** Mock Supabase client (używa currencySpecFixtures.exists)
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj fixture z istniejącą walutą
- Wywołaj isSatisfiedBy
- Sprawdź czy zwrócone zostanie true
**Oczekiwany rezultat:** true dla istniejącej waluty
**Priorytet:** Wysoki
**Edge cases:** Nieistniejąca waluta (rzuca CurrencyNotFoundError)
**Notatki / uwagi:** Używa createBasicSpecTestFixture dla konsystencji

### UT-Specifications-003
**Nazwa testu:** should return true when currency is configured for group
**Moduł / funkcja:** CurrencyConfiguredForGroupSpecification.isSatisfiedBy
**Cel testu:** Weryfikacja specyfikacji skonfigurowania waluty dla grupy
**Wejście / dane testowe:** { groupId, currencyCode } skonfigurowanej waluty
**Setup / izolacja:** Mock Supabase client (używa groupCurrencySpecFixtures.configured)
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj fixture z skonfigurowaną walutą
- Wywołaj isSatisfiedBy
- Sprawdź czy zwrócone zostanie true
**Oczekiwany rezultat:** true dla skonfigurowanej waluty
**Priorytet:** Wysoki
**Edge cases:** Waluta nieskonfigurowana dla grupy
**Notatki / uwagi:** Używa createBasicSpecTestFixture dla konsystencji

### UT-Specifications-004
**Nazwa testu:** should validate [description] -> [expected]
**Moduł / funkcja:** GroupNameValidSpecification.isSatisfiedBy
**Cel testu:** Weryfikacja specyfikacji poprawnej nazwy grupy (parametryzowane testy)
**Wejście / dane testowe:** Różne wartości nazw grup z groupNameValidationTestCases
**Setup / izolacja:** Brak (specyfikacja synchroniczna, używa createSyncSpecTestFixture)
**Kroki testowe (Arrange → Act → Assert):**
- Utwórz specyfikację używając fixture
- Wywołaj isSatisfiedBy dla każdej testowej wartości
- Sprawdź oczekiwany rezultat
**Oczekiwany rezultat:** true dla niepustej nazwy, false dla nieprawidłowych wartości
**Priorytet:** Średni
**Edge cases:** null, undefined, pusty string, string z samymi spacjami, bardzo długa nazwa
**Notatki / uwagi:** Używa it.each z groupNameValidationTestCases dla parametrizacji

### UT-Specifications-005
**Nazwa testu:** should validate [description] -> [expected]
**Moduł / funkcja:** GroupBaseCurrencyValidSpecification.isSatisfiedBy
**Cel testu:** Weryfikacja specyfikacji poprawnego kodu waluty bazowej (parametryzowane testy)
**Wejście / dane testowe:** Różne wartości kodów walut z currencyCodeValidationTestCases
**Setup / izolacja:** Brak (używa createSyncSpecTestFixture)
**Kroki testowe (Arrange → Act → Assert):**
- Utwórz specyfikację używając fixture
- Wywołaj isSatisfiedBy dla każdej testowej wartości
- Sprawdź oczekiwany rezultat
**Oczekiwany rezultat:** true dla niepustego kodu waluty, false dla nieprawidłowych wartości
**Priorytet:** Średni
**Edge cases:** null, undefined, pusty string, różne formaty kodów walut
**Notatki / uwagi:** Używa it.each z currencyCodeValidationTestCases dla parametrizacji

### UT-Specifications-006
**Nazwa testu:** should return true when group exists and is active
**Moduł / funkcja:** GroupExistsAndActiveSpecification.isSatisfiedBy
**Cel testu:** Weryfikacja specyfikacji istnienia aktywnej grupy
**Wejście / dane testowe:** groupId aktywnej grupy
**Setup / izolacja:** Mock Supabase client (używa groupSpecFixtures.existsAndActive)
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj fixture z aktywną grupą
- Wywołaj isSatisfiedBy
- Sprawdź czy zwrócone zostanie true
**Oczekiwany rezultat:** true dla aktywnej grupy
**Priorytet:** Wysoki
**Edge cases:** Nieistniejąca grupa, nieaktywna grupa
**Notatki / uwagi:** Używa createBasicSpecTestFixture dla konsystencji

### UT-Specifications-007
**Nazwa testu:** should return true when both specifications are satisfied
**Moduł / funkcja:** AndSpecification.isSatisfiedBy
**Cel testu:** Weryfikacja łączenia specyfikacji operatorem AND
**Wejście / dane testowe:** Dwie specyfikacje zwracające true
**Setup / izolacja:** Sync spec fixtures dla GroupNameValidSpecification i GroupBaseCurrencyValidSpecification
**Kroki testowe (Arrange → Act → Assert):**
- Utwórz AndSpecification z dwoma specyfikacjami
- Wywołaj isSatisfiedBy z prawidłową wartością
- Sprawdź czy zwrócone zostanie true
**Oczekiwany rezultat:** true gdy obie specyfikacje są spełnione
**Priorytet:** Wysoki
**Edge cases:** Jedna specyfikacja false, obie false
**Notatki / uwagi:** Testuje każdy przypadek AND osobno dla czytelności

### UT-Specifications-008
**Nazwa testu:** should return true when both specifications are satisfied
**Moduł / funkcja:** OrSpecification.isSatisfiedBy
**Cel testu:** Weryfikacja łączenia specyfikacji operatorem OR
**Wejście / dane testowe:** Dwie specyfikacje
**Setup / izolacja:** Sync spec fixtures dla GroupNameValidSpecification i GroupBaseCurrencyValidSpecification
**Kroki testowe (Arrange → Act → Assert):**
- Utwórz OrSpecification z dwoma specyfikacjami
- Wywołaj isSatisfiedBy z różnymi wartościami
- Sprawdź czy zwrócone zostanie true gdy przynajmniej jedna specyfikacja jest spełniona
**Oczekiwany rezultat:** true gdy przynajmniej jedna specyfikacja jest spełniona
**Priorytet:** Wysoki
**Edge cases:** Jedna specyfikacja false, obie false
**Notatki / uwagi:** Testuje każdy przypadek OR osobno dla czytelności

### UT-Specifications-009
**Nazwa testu:** should return false when specification is satisfied
**Moduł / funkcja:** NotSpecification.isSatisfiedBy
**Cel testu:** Weryfikacja negacji specyfikacji operatorem NOT
**Wejście / dane testowe:** Specyfikacja zwracająca true/false
**Setup / izolacja:** Sync spec fixture dla GroupNameValidSpecification
**Kroki testowe (Arrange → Act → Assert):**
- Utwórz NotSpecification z bazową specyfikacją
- Wywołaj isSatisfiedBy z różnymi wartościami
- Sprawdź czy zwrócona zostanie negacja wyniku bazowej specyfikacji
**Oczekiwany rezultat:** false dla specyfikacji zwracającej true, true dla zwracającej false
**Priorytet:** Wysoki
**Edge cases:** Różne wartości wejściowe
**Notatki / uwagi:** Testuje każdy przypadek NOT osobno dla czytelności

### UT-Specifications-010
**Nazwa testu:** should return true when group creation command is valid
**Moduł / funkcja:** GroupCreationValidSpecification.isSatisfiedBy
**Cel testu:** Weryfikacja złożonej specyfikacji walidacji tworzenia grupy
**Wejście / dane testowe:** command z prawidłową nazwą i istniejącą walutą
**Setup / izolacja:** Mock Supabase client (używa currencySpecFixtures.exists)
**Kroki testowe (Arrange → Act → Assert):**
- Przygotuj command z prawidłowymi danymi używając createValidGroupCreationCommand
- Wywołaj isSatisfiedBy
- Sprawdź czy wszystkie walidacje przejdą
**Oczekiwany rezultat:** true dla prawidłowych danych
**Priorytet:** Wysoki
**Edge cases:** Nieprawidłowa nazwa, nieistniejąca waluta, różne kombinacje nieprawidłowych danych
**Notatki / uwagi:** Używa it.each z groupCreationInvalidTestCases dla parametrizacji błędnych przypadków

### UT-Specifications-011
**Nazwa testu:** should chain 'and'/'or'/'not' method fluently
**Moduł / funkcja:** Specification.and/or/not
**Cel testu:** Weryfikacja płynnego łączenia metod specyfikacji
**Wejście / dane testowe:** Kolejne wywołania and(), or(), not()
**Setup / izolacja:** Sync spec fixtures dla różnych specyfikacji
**Kroki testowe (Arrange → Act → Assert):**
- Wywołaj and(), or(), not() w łańcuchu
- Sprawdź czy każda metoda zwraca Specification odpowiedniego typu
- Wywołaj isSatisfiedBy na złożonej specyfikacji
**Oczekiwany rezultat:** Prawidłowe łączenie specyfikacji i zwracanie odpowiednich typów
**Priorytet:** Średni
**Edge cases:** Zagnieżdżone operacje
**Notatki / uwagi:** Testuje każdy typ łączenia osobno dla czytelności

## Używane Fixtures i Helpery

### Test Fixtures
- `createBasicSpecTestFixture`: Dla specyfikacji wymagających Supabase client
- `createSyncSpecTestFixture`: Dla synchronicznych specyfikacji bez zależności
- `membershipSpecFixtures`: Fixtures dla testów członkostwa w grupie
- `currencySpecFixtures`: Fixtures dla testów walut
- `groupCurrencySpecFixtures`: Fixtures dla testów konfiguracji walut w grupach
- `groupSpecFixtures`: Fixtures dla testów grup

### Parametryzowane Tabele Testowe
- `groupNameValidationTestCases`: Test cases dla walidacji nazw grup
- `currencyCodeValidationTestCases`: Test cases dla walidacji kodów walut
- `groupCreationInvalidTestCases`: Test cases dla nieprawidłowych komend tworzenia grup

### Mock Helpery
Wszystkie testy używają istniejących helperów z `testHelpers.ts`:
- `createMockSupabaseClient`
- `mockUserActiveMembership`
- `mockCurrencyExists`
- `mockCurrencyConfiguredForGroup`
- `mockGroupExistsAndActive`
- `createValidGroupCreationCommand`
