# OpenRouter Service - Unit Test Cases

## Constructor Tests

### UT-CONSTRUCTOR-001

**Nazwa testu:** should_initialize_service_when_valid_api_key_provided_in_config  
**Moduł / funkcja:** OpenRouterService.constructor  
**Cel testu:** Weryfikuje prawidłową inicjalizację serwisu przy podaniu poprawnego API key w konfiguracji  
**Wejście / dane testowe:** config = { apiKey: "valid-api-key-123" }  
**Setup / izolacja:** Brak mocków potrzebnych  
**Kroki testowe:**

1. Arrange: Utwórz instancję config z prawidłowym apiKey
2. Act: Wywołaj new OpenRouterService(config)
3. Assert: Sprawdź czy instancja została utworzona bez błędów  
   **Oczekiwany rezultat:** Nowa instancja OpenRouterService zostaje utworzona bez rzucania wyjątków  
   **Priorytet:** Wysoki  
   **Edge cases:**

- API key z białymi znakami na początku/końcu
- API key jako pusty string  
  **Notatki / uwagi:** Test sprawdza happy path dla konstruktora

### UT-CONSTRUCTOR-002

**Nazwa testu:** should_initialize_service_when_api_key_provided_via_environment_variable  
**Moduł / funkcja:** OpenRouterService.constructor  
**Cel testu:** Weryfikuje inicjalizację gdy API key pochodzi ze zmiennej środowiskowej  
**Wejście / dane testowe:** config = {}, import.meta.env.OPENROUTER_API_KEY = "env-api-key-456"  
**Setup / izolacja:** Mock import.meta.env.OPENROUTER_API_KEY  
**Kroki testowe:**

1. Arrange: Ustaw zmienną środowiskową i pustą konfigurację
2. Act: Wywołaj new OpenRouterService(config)
3. Assert: Sprawdź czy instancja została utworzona  
   **Oczekiwany rezultat:** Nowa instancja OpenRouterService zostaje utworzona bez błędów  
   **Priorytet:** Wysoki  
   **Edge cases:**

- Konfiguracja z apiKey w config ma priorytet nad zmienną środowiskową
- Zmienna środowiskowa undefined/null  
  **Notatki / uwagi:** Test sprawdza fallback na zmienną środowiskową

### UT-CONSTRUCTOR-003

**Nazwa testu:** should_throw_configuration_error_when_no_api_key_provided  
**Moduł / funkcja:** OpenRouterService.constructor  
**Cel testu:** Weryfikuje błąd konfiguracji gdy brak API key  
**Wejście / dane testowe:** config = {}, import.meta.env.OPENROUTER_API_KEY = undefined  
**Setup / izolacja:** Mock import.meta.env.OPENROUTER_API_KEY jako undefined  
**Kroki testowe:**

1. Arrange: Ustaw pustą konfigurację i brak zmiennej środowiskowej
2. Act: Wywołaj new OpenRouterService(config)
3. Assert: Sprawdź czy rzucony zostaje ConfigurationError  
   **Oczekiwany rezultat:** Rzucony zostaje ConfigurationError z komunikatem "OPENROUTER_API_KEY is not set in environment variables."  
   **Priorytet:** Wysoki  
   **Edge cases:**

- API key jako null w config
- API key jako undefined w config  
  **Notatki / uwagi:** Krytyczny test dla bezpieczeństwa API

## extractExpenseData Method Tests

### UT-EXTRACT-001

**Nazwa testu:** should_return_validated_data_when_api_call_succeeds_and_response_valid  
**Moduł / funkcja:** OpenRouterService.extractExpenseData  
**Cel testu:** Weryfikuje happy path metody extractExpenseData z prawidłową odpowiedzią API  
**Wejście / dane testowe:**

- transcription: "I spent 50 dollars on lunch with John"
- context: "Group members: Alice, Bob, John. Default currency: USD"
- schema: expenseExtractionSchema
- model: "anthropic/claude-3-haiku"  
  **Setup / izolacja:**
- Mock fetch aby zwracał prawidłową odpowiedź API
- Mock zodToJsonSchema  
  **Kroki testowe:**

1. Arrange: Przygotuj parametry i zmockowane odpowiedzi
2. Act: Wywołaj extractExpenseData(params)
3. Assert: Sprawdź czy zwrócone dane pasują do schematu i zawierają poprawne wartości  
   **Oczekiwany rezultat:** Zwrócony zostaje obiekt z amount: 50, currency: "USD", participants: ["John"], description: "lunch"  
   **Priorytet:** Wysoki  
   **Edge cases:**

- Response z extraction_confidence = 1.0
- Response z extraction_confidence = 0.5  
  **Notatki / uwagi:** Główny happy path test

### UT-EXTRACT-002

**Nazwa testu:** should_throw_open_router_api_error_when_api_returns_error_status  
**Moduł / funkcja:** OpenRouterService.extractExpenseData  
**Cel testu:** Weryfikuje obsługę błędów API z kodem status  
**Wejście / dane testowe:** transcription: "test", context: "test", model: "test-model"  
**Setup / izolacja:** Mock fetch aby rzucał błąd z status 400  
**Kroki testowe:**

1. Arrange: Przygotuj parametry i zmockowany błąd API
2. Act: Wywołaj extractExpenseData(params)
3. Assert: Sprawdź czy rzucony zostaje OpenRouterApiError  
   **Oczekiwany rezultat:** Rzucony zostaje OpenRouterApiError ze status: 400 i odpowiednim komunikatem  
   **Priorytet:** Wysoki  
   **Edge cases:**

- Status 500 Internal Server Error
- Status 429 Rate Limited  
  **Notatki / uwagi:** Test obsługi błędów HTTP

### UT-EXTRACT-003

**Nazwa testu:** should_throw_network_error_when_fetch_fails  
**Moduł / funkcja:** OpenRouterService.extractExpenseData  
**Cel testu:** Weryfikuje obsługę błędów sieciowych  
**Wejście / dane testowe:** transcription: "test", context: "test", model: "test-model"  
**Setup / izolacja:** Mock fetch aby rzucał NetworkError (np. connection refused)  
**Kroki testowe:**

1. Arrange: Przygotuj parametry i zmockowany błąd sieciowy
2. Act: Wywołaj extractExpenseData(params)
3. Assert: Sprawdź czy rzucony zostaje NetworkError  
   **Oczekiwany rezultat:** Rzucony zostaje NetworkError z komunikatem zawierającym szczegóły błędu  
   **Priorytet:** Wysoki  
   **Edge cases:**

- Timeout błędu
- DNS resolution failure  
  **Notatki / uwagi:** Test odporności na problemy sieciowe

### UT-EXTRACT-004

**Nazwa testu:** should_throw_validation_error_when_response_does_not_match_schema  
**Moduł / funkcja:** OpenRouterService.extractExpenseData  
**Cel testu:** Weryfikuje walidację odpowiedzi względem schematu Zod  
**Wejście / dane testowe:** transcription: "test", context: "test", model: "test-model"  
**Setup / izolacja:**

- Mock fetch aby zwracał odpowiedź z nieprawidłowymi danymi (np. amount jako string zamiast number)
- Mock schema.safeParse aby zwracał błąd walidacji  
  **Kroki testowe:**

1. Arrange: Przygotuj parametry i nieprawidłową odpowiedź API
2. Act: Wywołaj extractExpenseData(params)
3. Assert: Sprawdź czy rzucony zostaje ValidationError  
   **Oczekiwany rezultat:** Rzucony zostaje ValidationError zawierający szczegóły błędu walidacji Zod  
   **Priorytet:** Wysoki  
   **Edge cases:**

- Brakujące wymagane pola
- Nieprawidłowe typy danych  
  **Notatki / uwagi:** Test integralności danych

### UT-EXTRACT-005

**Nazwa testu:** should_throw_invalid_json_response_error_when_api_response_malformed  
**Moduł / funkcja:** OpenRouterService.extractExpenseData  
**Cel testu:** Weryfikuje obsługę nieprawidłowej struktury odpowiedzi API  
**Wejście / dane testowe:** transcription: "test", context: "test", model: "test-model"  
**Setup / izolacja:** Mock fetch aby zwracał odpowiedź bez tool_calls  
**Kroki testowe:**

1. Arrange: Przygotuj parametry i zmockowaną nieprawidłową odpowiedź
2. Act: Wywołaj extractExpenseData(params)
3. Assert: Sprawdź czy rzucony zostaje InvalidJsonResponseError  
   **Oczekiwany rezultat:** Rzucony zostaje InvalidJsonResponseError z komunikatem "Invalid API response structure: missing tool_calls"  
   **Priorytet:** Wysoki  
   **Edge cases:**

- Brak message w choices[0]
- Brak function w tool_calls[0]  
  **Notatki / uwagi:** Test odporności na zmiany API

### UT-EXTRACT-006

**Nazwa testu:** should_handle_unexpected_errors_gracefully  
**Moduł / funkcja:** OpenRouterService.extractExpenseData  
**Cel testu:** Weryfikuje obsługę nieoczekiwanych błędów  
**Wejście / dane testowe:** transcription: "test", context: "test", model: "test-model"  
**Setup / izolacja:** Mock jednej z wewnętrznych metod aby rzucała nieoczekiwany błąd  
**Kroki testowe:**

1. Arrange: Przygotuj parametry i zmockowany nieoczekiwany błąd
2. Act: Wywołaj extractExpenseData(params)
3. Assert: Sprawdź czy rzucony zostaje Error z odpowiednim komunikatem  
   **Oczekiwany rezultat:** Rzucony zostaje Error z komunikatem zawierającym "Unexpected error in OpenRouterService"  
   **Priorytet:** Średni  
   **Edge cases:**

- Runtime exceptions
- Out of memory errors  
  **Notatki / uwagi:** Test bezpieczeństwa aplikacji

## Private Helper Methods Tests

### UT-HELPERS-001

**Nazwa testu:** should_build_correct_system_prompt_with_guidelines  
**Moduł / funkcja:** OpenRouterService.buildSystemPrompt (prywatna)  
**Cel testu:** Weryfikuje budowę poprawnego system prompt dla LLM  
**Wejście / dane testowe:** Brak parametrów wejściowych  
**Setup / izolacja:** Test poprzez reflection lub publiczny interfejs  
**Kroki testowe:**

1. Arrange: Utwórz instancję serwisu
2. Act: Uzyskaj dostęp do prywatnej metody i wywołaj ją
3. Assert: Sprawdź czy prompt zawiera wszystkie wymagane sekcje (guidelines, confidence assessment)  
   **Oczekiwany rezultat:** Zwrócony string zawiera "expert financial assistant", "CONFIDENCE ASSESSMENT" i instrukcje tool usage  
   **Priorytet:** Średni  
   **Edge cases:**

- Prompt nie zawiera dodatkowych tekstu poza instrukcjami
- Wszystkie wymagane sekcje są obecne  
  **Notatki / uwagi:** Test wymaga dostępu do prywatnej metody

### UT-HELPERS-002

**Nazwa testu:** should_build_user_prompt_with_transcription_and_context  
**Moduł / funkcja:** OpenRouterService.buildUserPrompt (prywatna)  
**Cel testu:** Weryfikuje połączenie transcription i context w user prompt  
**Wejście / dane testowe:** transcription: "Spent 25 on coffee", context: "Group: Alice, Bob"  
**Setup / izolacja:** Test poprzez reflection  
**Kroki testowe:**

1. Arrange: Przygotuj parametry wejściowe
2. Act: Wywołaj prywatną metodę buildUserPrompt
3. Assert: Sprawdź formatowanie prompt  
   **Oczekiwany rezultat:** Prompt zawiera "Transcribed text: \"Spent 25 on coffee\"" i "Context: Group: Alice, Bob"  
   **Priorytet:** Średni  
   **Edge cases:**

- Transcription z cudzysłowami
- Context pusty  
  **Notatki / uwagi:** Test formatowania prompt

### UT-HELPERS-003

**Nazwa testu:** should_create_api_payload_with_all_required_fields  
**Moduł / funkcja:** OpenRouterService.createApiPayload (prywatna)  
**Cel testu:** Weryfikuje budowę kompletnego payload dla API  
**Wejście / dane testowe:** params z transcription, context, schema, model, temperature: 0.5, maxTokens: 2048  
**Setup / izolacja:** Mock zodToJsonSchema  
**Kroki testowe:**

1. Arrange: Przygotuj parametry i zmockowane odpowiedzi
2. Act: Wywołaj prywatną metodę createApiPayload
3. Assert: Sprawdź strukturę payload (messages, tools, tool_choice, temperature, max_tokens)  
   **Oczekiwany rezultat:** Payload zawiera messages array z system i user role, tools array z function definition, temperature: 0.5, max_tokens: 2048  
   **Priorytet:** Wysoki  
   **Edge cases:**

- Schema z definitions vs bez
- Domyślne wartości temperature i maxTokens  
  **Notatki / uwagi:** Test integracji z zod-to-json-schema

### UT-HELPERS-004

**Nazwa testu:** should_parse_and_validate_successful_response  
**Moduł / funkcja:** OpenRouterService.parseAndValidateResponse (prywatna)  
**Cel testu:** Weryfikuje parsowanie i walidację prawidłowej odpowiedzi API  
**Wejście / dane testowe:** apiResponse z prawidłową strukturą tool_calls i arguments JSON  
**Setup / izolacja:** Mock schema.safeParse aby zwracał success  
**Kroki testowe:**

1. Arrange: Przygotuj prawidłową odpowiedź API i schemat
2. Act: Wywołaj prywatną metodę parseAndValidateResponse
3. Assert: Sprawdź czy zwrócone dane są poprawne  
   **Oczekiwany rezultat:** Zwrócone zostają sparsowane i zwalidowane dane zgodnie ze schematem  
   **Priorytet:** Wysoki  
   **Edge cases:**

- Arguments jako prawidłowy JSON
- Validation success z danymi  
  **Notatki / uwagi:** Test parsowania JSON

### UT-HELPERS-005

**Nazwa testu:** should_fail_when_response_missing_tool_calls  
**Moduł / funkcja:** OpenRouterService.parseAndValidateResponse (prywatna)  
**Cel testu:** Weryfikuje błąd gdy odpowiedź API nie zawiera tool_calls  
**Wejście / dane testowe:** apiResponse bez choices[0].message.tool_calls  
**Setup / izolacja:** Brak specjalnych mocków  
**Kroki testowe:**

1. Arrange: Przygotuj nieprawidłową odpowiedź API
2. Act: Wywołaj prywatną metodę parseAndValidateResponse
3. Assert: Sprawdź czy rzucony zostaje InvalidJsonResponseError  
   **Oczekiwany rezultat:** Rzucony zostaje InvalidJsonResponseError z odpowiednim komunikatem  
   **Priorytet:** Wysoki  
   **Edge cases:**

- Puste choices array
- Message bez tool_calls  
  **Notatki / uwagi:** Test guard clauses

## Error Classes Tests

### UT-ERRORS-001

**Nazwa testu:** should_create_configuration_error_with_correct_properties  
**Moduł / funkcja:** ConfigurationError  
**Cel testu:** Weryfikuje tworzenie ConfigurationError z prawidłowymi właściwościami  
**Wejście / dane testowe:** message: "API key missing"  
**Setup / izolacja:** Brak mocków  
**Kroki testowe:**

1. Arrange: Przygotuj komunikat błędu
2. Act: Utwórz new ConfigurationError(message)
3. Assert: Sprawdź name i message  
   **Oczekiwany rezultat:** Error z name: "ConfigurationError" i podanym message  
   **Priorytet:** Niski  
   **Edge cases:**

- Pusty message
- Message z specjalnymi znakami  
  **Notatki / uwagi:** Test konstruktora error class

### UT-ERRORS-002

**Nazwa testu:** should_create_open_router_api_error_with_status_and_message  
**Moduł / funkcja:** OpenRouterApiError  
**Cel testu:** Weryfikuje tworzenie OpenRouterApiError z status i message  
**Wejście / dane testowe:** status: 429, apiMessage: "Rate limit exceeded"  
**Setup / izolacja:** Brak mocków  
**Kroki testowe:**

1. Arrange: Przygotuj status i komunikat
2. Act: Utwórz new OpenRouterApiError(status, apiMessage)
3. Assert: Sprawdź name, message, status, apiMessage  
   **Oczekiwany rezultat:** Error z name: "OpenRouterApiError", message zawierający status i apiMessage, właściwości status i apiMessage  
   **Priorytet:** Niski  
   **Edge cases:**

- Status 200 (choć nie powinien być używany dla błędów)
- Pusty apiMessage  
  **Notatki / uwagi:** Test konstruktora error class z dodatkowymi właściwościami

### UT-ERRORS-003

**Nazwa testu:** should_create_validation_error_with_zod_error_details  
**Moduł / funkcja:** ValidationError  
**Cel testu:** Weryfikuje tworzenie ValidationError z detalami błędu Zod  
**Wejście / dane testowe:** validationErrors: mock ZodError z błędami walidacji  
**Setup / izolacja:** Mock z.ZodError  
**Kroki testowe:**

1. Arrange: Przygotuj mock ZodError
2. Act: Utwórz new ValidationError(validationErrors)
3. Assert: Sprawdź name, message, validationErrors  
   **Oczekiwany rezultat:** Error z name: "ValidationError", message zawierający szczegóły błędu, właściwość validationErrors  
   **Priorytet:** Niski  
   **Edge cases:**

- ZodError z wieloma błędami
- ZodError z pojedynczym błędem  
  **Notatki / uwagi:** Test integracji z Zod

## Podsumowanie

Najważniejsze moduły do pokrycia unit testami to:

- **extractExpenseData method** - główna metoda publiczna, zawiera większość logiki biznesowej i obsługę błędów
- **Constructor** - krytyczny dla konfiguracji i bezpieczeństwa API
- **Private helper methods** - zwłaszcza createApiPayload i parseAndValidateResponse, które zawierają złożoną logikę

Te moduły mają najwyższy priorytet ponieważ obejmują happy path, error handling oraz integrację z zewnętrznym API.
