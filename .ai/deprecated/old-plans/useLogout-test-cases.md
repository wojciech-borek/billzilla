# Test Cases dla Hook useLogout

**Plik źródłowy:** `src/lib/hooks/useLogout.ts`

## Test Case'y

### UT-USELOGOUT-001

**Nazwa testu:** should_return_success_and_redirect_when_signOut_succeeds
**Moduł / funkcja:** useLogout.logout
**Cel testu:** Sprawdzenie poprawnego działania w przypadku pomyślnego wylogowania
**Wejście / dane testowe:** Mock supabase.auth.signOut zwracający { error: null }
**Setup / izolacja:** Użycie helpera createLogoutTestFixture i renderHookAndLogout z testHelpers.ts
**Kroki testowe (Arrange → Act → Assert):**

1. Wywołaj helper renderHookAndLogout z { error: null }
2. Sprawdź czy zwrócony obiekt zawiera { success: true, error: null }
3. Sprawdź czy window.location.assign("/login") został wywołany
   **Oczekiwany rezultat:** Funkcja zwraca { success: true, error: null } i przekierowuje na /login
   **Priorytet:** Wysoki
   **Edge cases:** -
   **Notatki / uwagi:** Test podstawowej ścieżki sukcesu używający wspólnych helperów

### UT-USELOGOUT-002 & UT-USELOGOUT-003 (Parameterized)

**Nazwa testu:** Error handling scenarios (parameterized)
**Moduł / funkcja:** useLogout.logout
**Cel testu:** Sprawdzenie obsługi błędów i wyjątków podczas wylogowania
**Wejście / dane testowe:** Parametryzowane scenariusze błędów używające createLogoutTestFixture
**Setup / izolacja:** Użycie helperów createLogoutTestFixture i renderHookAndLogout z testHelpers.ts
**Kroki testowe (Arrange → Act → Assert):**

1. Inicjalizacja z parametrami scenariusza błędu używając renderHookAndLogout
2. Sprawdź czy supabase.auth.signOut() został wywołany
3. Sprawdź czy stan isLoggingOut został zresetowany na false
4. Sprawdź czy zwrócony obiekt zawiera oczekiwany wynik błędu
   **Oczekiwany rezultat:** Funkcja zwraca błąd/wyjątek i resetuje stan isLoggingOut na false

**Scenariusze parametrowe:**

- **UT-USELOGOUT-002**: signOut zwraca błąd `{ error: { message: "Sign out failed" } }`
  _Oczekiwany rezultat:_ `{ success: false, error: { message: "Sign out failed" } }`
- **UT-USELOGOUT-003**: signOut rzuca wyjątek `Promise.reject(new Error("Network error"))`
  _Oczekiwany rezultat:_ `{ success: false, error: new Error("Network error") }`

**Priorytet:** Wysoki
**Edge cases:** Różne typy błędów Supabase, network errors, timeout exceptions
**Notatki / uwagi:** Parametryzowany test łączący scenariusze błędów z użyciem wspólnych helperów dla lepszej konserwacji

### UT-USELOGOUT-004

**Nazwa testu:** should_initialize_with_isLoggingOut_false  
**Moduł / funkcja:** useLogout (stan początkowy)  
**Cel testu:** Sprawdzenie stanu początkowego hook  
**Wejście / dane testowe:** Brak  
**Setup / izolacja:** Standardowe renderHook bez specjalnych mocków  
**Kroki testowe (Arrange → Act → Assert):**

1. Zainicjalizuj hook
2. Sprawdź wartość isLoggingOut  
   **Oczekiwany rezultat:** isLoggingOut równa się false  
   **Priorytet:** Średni  
   **Edge cases:** -  
   **Notatki / uwagi:** Test stanu początkowego

### UT-USELOGOUT-005

**Nazwa testu:** should_use_supabase_from_useSupabaseAuth
**Moduł / funkcja:** useLogout (zależność)
**Cel testu:** Sprawdzenie użycia poprawnego supabase client
**Wejście / dane testowe:** Mock useSupabaseAuth zwracający specyficzny supabase client
**Setup / izolacja:** Użycie helperów createMockAuthSupabaseClient i createMockUseSupabaseAuth z testHelpers.ts
**Kroki testowe (Arrange → Act → Assert):**

1. Zainicjalizuj hook z mockowanym useSupabaseAuth używając helperów
2. Wywołaj funkcję logout
3. Sprawdź czy użyty supabase to ten z useSupabaseAuth
   **Oczekiwany rezultat:** Hook używa supabase z useSupabaseAuth
   **Priorytet:** Średni
   **Edge cases:** -
   **Notatki / uwagi:** Test integracji z useSupabaseAuth używający wspólnych helperów

### UT-USELOGOUT-006

**Nazwa testu:** should_memoize_logout_function  
**Moduł / funkcja:** useLogout.logout (useCallback)  
**Cel testu:** Sprawdzenie memoizacji funkcji logout  
**Wejście / dane testowe:** Wielokrotne renderowanie hook  
**Setup / izolacja:** Standardowe renderHook bez specjalnych mocków  
**Kroki testowe (Arrange → Act → Assert):**

1. Zainicjalizuj hook
2. Pobierz referencję do funkcji logout
3. Re-render hook z tymi samymi zależnościami
4. Sprawdź czy ta sama referencja funkcji została zwrócona  
   **Oczekiwany rezultat:** Funkcja logout jest memoizowana przez useCallback  
   **Priorytet:** Średni  
   **Edge cases:** Zmiana supabase client  
   **Notatki / uwagi:** Test optymalizacji React

### UT-USELOGOUT-007

**Nazwa testu:** should_set_isLoggingOut_true_at_start_of_logout
**Moduł / funkcja:** useLogout.logout
**Cel testu:** Sprawdzenie ustawiania stanu loading na początku operacji
**Wejście / dane testowe:** Mock supabase.auth.signOut (wolne wykonanie)
**Setup / izolacja:** Użycie helperów createMockAuthSupabaseClient i createMockUseSupabaseAuth z testHelpers.ts
**Kroki testowe (Arrange → Act → Assert):**

1. Zainicjalizuj hook z mockowanym useSupabaseAuth
2. Wywołaj funkcję logout
3. Sprawdź czy isLoggingOut został ustawiony synchronicznie na true
   **Oczekiwany rezultat:** isLoggingOut ustawiony na true przed wywołaniem async operacji
   **Priorytet:** Średni
   **Edge cases:** -
   **Notatki / uwagi:** Test UX - natychmiastowe wskazanie ładowania używający wspólnych helperów

## Podsumowanie

Najważniejsze moduły do pokrycia unit testami to funkcja logout z obsługą sukcesu i błędów, oraz stan isLoggingOut dla prawidłowej indykacji ładowania. Szczególną uwagę należy zwrócić na asynchroniczne operacje i obsługę błędów.

**Ulepszenia po refaktoryzacji:**

- Wprowadzono wspólne helpery w testHelpers.ts (createMockAuthSupabaseClient, createMockUseSupabaseAuth, createLogoutTestFixture)
- Parametryzowane testy dla scenariuszy błędów zmniejszające duplikację kodu
- Ujednolicona struktura testów z użyciem wspólnych helperów dla lepszej konserwacji
