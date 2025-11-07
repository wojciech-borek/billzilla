# Expense Transcription Service - Unit Test Cases

## Moduł: uploadAudioForTranscription

### UT-UPLOAD-001

**Nazwa testu**: `should_return_transcription_result_when_valid_audio_processed_successfully`  
**Moduł / funkcja**: `uploadAudioForTranscription`  
**Cel testu**: Weryfikuje poprawne przetworzenie audio i zwrot danych wydatku przy prawidłowych danych wejściowych  
**Wejście / dane testowe**: `audioBlob: Blob` (rozmiar: 1MB, typ: "audio/webm"), `groupId: "group-123"`  
**Setup / izolacja**: Mock `fetch` aby zwracał status 200 z `TranscriptionResultDTO` zawierającym dane wydatku  
**Kroki testowe**: 1. Utwórz prawidłowy Blob audio 2. Wywołaj funkcję z prawidłowym groupId 3. Sprawdź zwrócony obiekt z wynikiem transkrypcji  
**Oczekiwany rezultat**: Funkcja zwraca obiekt `TranscriptionResultDTO` z danymi wydatku bez wyrzucania wyjątków  
**Priorytet**: wysoki  
**Edge cases**: Poprawny upload z maksymalnym dozwolonym rozmiarem (25MB), różne obsługiwane typy MIME  
**Notatki / uwagi**: Test integruje walidację wejścia i synchroniczne przetwarzanie AI

### UT-UPLOAD-002

**Nazwa testu**: `should_throw_error_when_audio_blob_missing`  
**Moduł / funkcja**: `uploadAudioForTranscription`  
**Cel testu**: Weryfikuje obsługę brakującego blob audio  
**Wejście / dane testowe**: `audioBlob: null`, `groupId: "group-123"`  
**Setup / izolacja**: Brak mockowania - test walidacji wejścia  
**Kroki testowe**: 1. Wywołaj funkcję z null jako audioBlob 2. Przechwyć wyjątek  
**Oczekiwany rezultat**: Rzucony `Error` z wiadomością "Audio blob is required"  
**Priorytet**: wysoki  
**Edge cases**: `audioBlob: undefined`, pusty string jako groupId  
**Notatki / uwagi**: Test czystej walidacji wejścia bez zależności zewnętrznych

### UT-UPLOAD-003

**Nazwa testu**: `should_throw_error_when_group_id_missing`  
**Moduł / funkcja**: `uploadAudioForTranscription`  
**Cel testu**: Weryfikuje obsługę brakującego identyfikatora grupy  
**Wejście / dane testowe**: `audioBlob: Blob` (prawidłowy), `groupId: ""` (pusty string)  
**Setup / izolacja**: Brak mockowania - test walidacji wejścia  
**Kroki testowe**: 1. Wywołaj funkcję z pustym groupId 2. Przechwyć wyjątek  
**Oczekiwany rezultat**: Rzucony `Error` z wiadomością "Group ID is required"  
**Priorytet**: wysoki  
**Edge cases**: `groupId: null`, `groupId: undefined`  
**Notatki / uwagi**: Test walidacji obowiązkowych parametrów

### UT-UPLOAD-004

**Nazwa testu**: `should_throw_error_when_audio_file_too_large`  
**Moduł / funkcja**: `uploadAudioForTranscription`  
**Cel testu**: Weryfikuje walidację maksymalnego rozmiaru pliku (25MB)  
**Wejście / dane testowe**: `audioBlob: Blob` (rozmiar: 26MB, typ: "audio/webm"), `groupId: "group-123"`  
**Setup / izolacja**: Brak mockowania - test walidacji rozmiaru  
**Kroki testowe**: 1. Utwórz Blob przekraczający limit 2. Wywołaj funkcję 3. Przechwyć wyjątek  
**Oczekiwany rezultat**: Rzucony `Error` z wiadomością "Audio file too large. Maximum size: 25MB"  
**Priorytet**: wysoki  
**Edge cases**: Dokładnie 25MB (powinno przejść), 25MB + 1 bajt (powinno zawieść)  
**Notatki / uwagi**: Krytyczna walidacja biznesowa dla limitów API

### UT-UPLOAD-005

**Nazwa testu**: `should_throw_error_when_invalid_mime_type`  
**Moduł / funkcja**: `uploadAudioForTranscription`  
**Cel testu**: Weryfikuje walidację typu MIME audio  
**Wejście / dane testowe**: `audioBlob: Blob` (rozmiar: 1MB, typ: "video/mp4"), `groupId: "group-123"`  
**Setup / izolacja**: Brak mockowania - test walidacji typu MIME  
**Kroki testowe**: 1. Utwórz Blob z nieprawidłowym typem MIME 2. Wywołaj funkcję 3. Przechwyć wyjątek  
**Oczekiwany rezultat**: Rzucony `Error` z wiadomością "Invalid audio format. Supported formats: webm, mp4, mpeg, wav, ogg"  
**Priorytet**: wysoki  
**Edge cases**: Typ "audio/unknown", typ "text/plain", pusty typ MIME  
**Notatki / uwagi**: Walidacja formatów obsługiwanych przez API transkrypcji

### UT-UPLOAD-006

**Nazwa testu**: `should_throw_error_when_server_returns_400_bad_request`  
**Moduł / funkcja**: `uploadAudioForTranscription`  
**Cel testu**: Weryfikuje obsługę błędu 400 z serwera  
**Wejście / dane testowe**: `audioBlob: Blob` (prawidłowy), `groupId: "group-123"`  
**Setup / izolacja**: Mock `fetch` aby zwracał status 400 z błędem JSON  
**Kroki testowe**: 1. Przygotuj prawidłowe dane 2. Wywołaj funkcję 3. Przechwyć wyjątek  
**Oczekiwany rezultat**: Rzucony `Error` z wiadomością "Invalid request data"  
**Priorytet**: średni  
**Edge cases**: Status 400 z błędem zawierającym szczegóły, status 400 bez ciała odpowiedzi  
**Notatki / uwagi**: Test parsowania błędów HTTP

### UT-UPLOAD-007

**Nazwa testu**: `should_throw_error_when_server_returns_401_unauthorized`  
**Moduł / funkcja**: `uploadAudioForTranscription`  
**Cel testu**: Weryfikuje obsługę błędu 401 z serwera  
**Wejście / dane testowe**: `audioBlob: Blob` (prawidłowy), `groupId: "group-123"`  
**Setup / izolacja**: Mock `fetch` aby zwracał status 401  
**Kroki testowe**: 1. Przygotuj prawidłowe dane 2. Wywołaj funkcję 3. Przechwyć wyjątek  
**Oczekiwany rezultat**: Rzucony `Error` z wiadomością "Authentication required"  
**Priorytet**: średni  
**Edge cases**: Status 401 z dodatkowymi informacjami w odpowiedzi  
**Notatki / uwagi**: Test błędów autoryzacji

### UT-UPLOAD-008

**Nazwa testu**: `should_throw_error_when_server_returns_403_forbidden`  
**Moduł / funkcja**: `uploadAudioForTranscription`  
**Cel testu**: Weryfikuje obsługę błędu 403 z serwera  
**Wejście / dane testowe**: `audioBlob: Blob` (prawidłowy), `groupId: "group-123"`  
**Setup / izolacja**: Mock `fetch` aby zwracał status 403  
**Kroki testowe**: 1. Przygotuj prawidłowe dane 2. Wywołaj funkcję 3. Przechwyć wyjątek  
**Oczekiwany rezultat**: Rzucony `Error` z wiadomością "Access forbidden"  
**Priorytet**: średni  
**Edge cases**: Status 403 z informacjami o uprawnieniach  
**Notatki / uwagi**: Test błędów dostępu

### UT-UPLOAD-009

**Nazwa testu**: `should_throw_error_when_server_returns_413_payload_too_large`  
**Moduł / funkcja**: `uploadAudioForTranscription`  
**Cel testu**: Weryfikuje obsługę błędu 413 z serwera  
**Wejście / dane testowe**: `audioBlob: Blob` (prawidłowy), `groupId: "group-123"`  
**Setup / izolacja**: Mock `fetch` aby zwracał status 413  
**Kroki testowe**: 1. Przygotuj prawidłowe dane 2. Wywołaj funkcję 3. Przechwyć wyjątek  
**Oczekiwany rezultat**: Rzucony `Error` z wiadomością "File too large"  
**Priorytet**: średni  
**Edge cases**: Status 413 z dodatkowymi szczegółami o limicie  
**Notatki / uwagi**: Test duplikacji walidacji po stronie serwera

### UT-UPLOAD-010

**Nazwa testu**: `should_throw_error_when_server_returns_503_service_unavailable`  
**Moduł / funkcja**: `uploadAudioForTranscription`  
**Cel testu**: Weryfikuje obsługę błędu 503 z serwera  
**Wejście / dane testowe**: `audioBlob: Blob` (prawidłowy), `groupId: "group-123"`  
**Setup / izolacja**: Mock `fetch` aby zwracał status 503  
**Kroki testowe**: 1. Przygotuj prawidłowe dane 2. Wywołaj funkcję 3. Przechwyć wyjątek  
**Oczekiwany rezultat**: Rzucony `Error` z wiadomością "Transcription service unavailable"  
**Priorytet**: średni  
**Edge cases**: Status 503 z informacjami o czasie oczekiwania  
**Notatki / uwagi**: Test dostępności usługi zewnętrznej

### UT-UPLOAD-011

**Nazwa testu**: `should_throw_error_when_server_returns_500_internal_error`  
**Moduł / funkcja**: `uploadAudioForTranscription`  
**Cel testu**: Weryfikuje obsługę błędów 5xx z serwera  
**Wejście / dane testowe**: `audioBlob: Blob` (prawidłowy), `groupId: "group-123"`  
**Setup / izolacja**: Mock `fetch` aby zwracał status 500  
**Kroki testowe**: 1. Przygotuj prawidłowe dane 2. Wywołaj funkcję 3. Przechwyć wyjątek  
**Oczekiwany rezultat**: Rzucony `Error` z wiadomością "Server error occurred"  
**Priorytet**: średni  
**Edge cases**: Statusy 502, 504, 507  
**Notatki / uwagi**: Test ogólnych błędów serwera

### UT-UPLOAD-012

**Nazwa testu**: `should_use_error_message_from_api_response_when_available`  
**Moduł / funkcja**: `uploadAudioForTranscription`  
**Cel testu**: Weryfikuje parsowanie szczegółowych błędów z odpowiedzi API  
**Wejście / dane testowe**: `audioBlob: Blob` (prawidłowy), `groupId: "group-123"`  
**Setup / izolacja**: Mock `fetch` aby zwracał status 400 z JSON `{"error": {"message": "Custom validation error"}}`  
**Kroki testowe**: 1. Przygotuj dane 2. Wywołaj funkcję 3. Przechwyć wyjątek  
**Oczekiwany rezultat**: Rzucony `Error` z wiadomością "Custom validation error"  
**Priorytet**: średni  
**Edge cases**: Odpowiedź z błędem bez struktury error.message, odpowiedź bez JSON  
**Notatki / uwagi**: Test parsowania błędów API

### UT-UPLOAD-013

**Nazwa testu**: `should_throw_generic_error_when_fetch_fails_unexpectedly`  
**Moduł / funkcja**: `uploadAudioForTranscription`  
**Cel testu**: Weryfikuje obsługę nieoczekiwanych błędów fetch  
**Wejście / dane testowe**: `audioBlob: Blob` (prawidłowy), `groupId: "group-123"`  
**Setup / izolacja**: Mock `fetch` aby rzucał nieoczekiwany błąd (np. NetworkError)  
**Kroki testowe**: 1. Przygotuj dane 2. Wywołaj funkcję 3. Przechwyć wyjątek  
**Oczekiwany rezultat**: Rzucony `Error` z wiadomością "Unknown upload error occurred"  
**Priorytet**: niski  
**Edge cases**: Błędy TypeError, błędy CORS  
**Notatki / uwagi**: Test odporności na nieoczekiwane błędy

## Moduł: createTranscriptionError

### UT-ERROR-001

**Nazwa testu**: `should_return_error_with_code_and_message_when_valid_api_error_provided`  
**Moduł / funkcja**: `createTranscriptionError`  
**Cel testu**: Weryfikuje tworzenie błędu z prawidłowym ApiError  
**Wejście / dane testowe**: `apiError: {code: "VALIDATION_ERROR", message: "Invalid input data"}`  
**Setup / izolacja**: Brak mockowania - czysta funkcja transformacji  
**Kroki testowe**: 1. Wywołaj funkcję z prawidłowym ApiError 2. Sprawdź zwrócony obiekt  
**Oczekiwany rezultat**: Zwrócony `TranscriptionErrorDTO` z `code: "VALIDATION_ERROR"` i `message: "Invalid input data"`  
**Priorytet**: wysoki  
**Edge cases**: Różne kody błędów, różne długości wiadomości  
**Notatki / uwagi**: Podstawowa funkcjonalność transformacji błędów

### UT-ERROR-002

**Nazwa testu**: `should_return_error_with_default_code_when_object_has_only_message`  
**Moduł / funkcja**: `createTranscriptionError`  
**Cel testu**: Weryfikuje obsługę obiektów z samym polem message  
**Wejście / dane testowe**: `apiError: {message: "Something went wrong"}`  
**Setup / izolacja**: Brak mockowania - test logiki warunkowej  
**Kroki testowe**: 1. Wywołaj funkcję z obiektem zawierającym tylko message 2. Sprawdź wynik  
**Oczekiwany rezultat**: Zwrócony `TranscriptionErrorDTO` z `code: "UNKNOWN_ERROR"` i `message: "Something went wrong"`  
**Priorytet**: wysoki  
**Edge cases**: Obiekt z dodatkowymi polami oprócz message  
**Notatki / uwagi**: Obsługa częściowych obiektów błędów

### UT-ERROR-003

**Nazwa testu**: `should_return_default_error_when_unknown_error_type_provided`  
**Moduł / funkcja**: `createTranscriptionError`  
**Cel testu**: Weryfikuje obsługę nieznanych typów błędów  
**Wejście / dane testowe**: `apiError: "String error message"`  
**Setup / izolacja**: Brak mockowania - test domyślnego zachowania  
**Kroki testowe**: 1. Wywołaj funkcję z string zamiast obiektu 2. Sprawdź wynik  
**Oczekiwany rezultat**: Zwrócony `TranscriptionErrorDTO` z `code: "UNKNOWN_ERROR"` i `message: "Unknown transcription error occurred"`  
**Priorytet**: średni  
**Edge cases**: `apiError: null`, `apiError: undefined`, `apiError: 123`  
**Notatki / uwagi**: Odporność na nieprawidłowe dane wejściowe

### UT-ERROR-004

**Nazwa testu**: `should_use_message_from_object_without_proper_structure`  
**Moduł / funkcja**: `createTranscriptionError`  
**Cel testu**: Weryfikuje ekstrakcję wiadomości z nieprawidłowych obiektów  
**Wejście / dane testowe**: `apiError: {message: "Custom error", otherField: "value"}`  
**Setup / izolacja**: Brak mockowania - test parsowania  
**Kroki testowe**: 1. Wywołaj funkcję z obiektem bez code 2. Sprawdź wynik  
**Oczekiwany rezultat**: Zwrócony `TranscriptionErrorDTO` z `code: "UNKNOWN_ERROR"` i `message: "Custom error"`  
**Priorytet**: średni  
**Edge cases**: Obiekty z message jako null/undefined  
**Notatki / uwagi**: Elastyczne parsowanie błędów
