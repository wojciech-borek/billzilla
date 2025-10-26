# Test Cases dla WhisperService

**Plik źródłowy:** `src/lib/services/whisperService.ts`  
**Data generowania:** 26 października 2025  
**Liczba test cases:** 24

## UT-WHISPER-CONSTRUCTOR - Testy konstruktora

### UT-WHISPER-CONSTRUCTOR-01
**Nazwa testu:** `should_initialize_successfully_when_api_key_provided_in_config`  
**Moduł / funkcja:** `WhisperService.constructor`  
**Cel testu:** Weryfikacja poprawnego inicjalizacji serwisu gdy klucz API jest przekazany w konfiguracji  
**Wejście / dane testowe:** `config = { apiKey: "test-api-key" }`  
**Setup / izolacja:** Mockowanie `import.meta.env.OPENAI_API_KEY` na undefined  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj konfigurację z prawidłowym kluczem API  
2. Utwórz nową instancję WhisperService  
3. Sprawdź czy instancja została utworzona bez błędów  
**Oczekiwany rezultat:** Instancja WhisperService zostaje utworzona pomyślnie  
**Priorytet:** Wysoki  
**Edge cases:** -  
**Notatki / uwagi:** Test podstawowej funkcjonalności konstruktora

### UT-WHISPER-CONSTRUCTOR-02
**Nazwa testu:** `should_initialize_successfully_when_api_key_provided_in_environment`  
**Moduł / funkcja:** `WhisperService.constructor`  
**Cel testu:** Weryfikacja poprawnego inicjalizacji serwisu gdy klucz API jest dostępny w zmiennych środowiskowych  
**Wejście / dane testowe:** `config = {}`, `import.meta.env.OPENAI_API_KEY = "env-api-key"`  
**Setup / izolacja:** Mockowanie zmiennych środowiskowych  
**Kroki testowe (Arrange → Act → Assert):**  
1. Skonfiguruj zmienne środowiskowe z kluczem API  
2. Utwórz nową instancję WhisperService bez konfiguracji  
3. Sprawdź czy instancja została utworzona bez błędów  
**Oczekiwany rezultat:** Instancja WhisperService zostaje utworzona pomyślnie  
**Priorytet:** Wysoki  
**Edge cases:** -  
**Notatki / uwagi:** Test alternatywnego źródła klucza API

### UT-WHISPER-CONSTRUCTOR-03
**Nazwa testu:** `should_throw_WhisperConfigurationError_when_no_api_key_available`  
**Moduł / funkcja:** `WhisperService.constructor`  
**Cel testu:** Weryfikacja rzucania błędu konfiguracji gdy klucz API nie jest dostępny  
**Wejście / dane testowe:** `config = {}`, brak `OPENAI_API_KEY`  
**Setup / izolacja:** Mockowanie pustych zmiennych środowiskowych  
**Kroki testowe (Arrange → Act → Assert):**  
1. Upewnij się że zmienne środowiskowe nie zawierają klucza API  
2. Spróbuj utworzyć nową instancję WhisperService  
3. Sprawdź czy został rzucony WhisperConfigurationError  
**Oczekiwany rezultat:** Rzucenie `WhisperConfigurationError` z odpowiednią wiadomością  
**Priorytet:** Wysoki  
**Edge cases:** -  
**Notatki / uwagi:** Krytyczny test walidacji konfiguracji

## UT-WHISPER-VALIDATE-AUDIO - Testy walidacji pliku audio

### UT-WHISPER-VALIDATE-AUDIO-01
**Nazwa testu:** `should_pass_validation_when_audio_file_valid`  
**Moduł / funkcja:** `WhisperService.validateAudioFile`  
**Cel testu:** Weryfikacja pozytywnej walidacji prawidłowego pliku audio  
**Wejście / dane testowe:** `audioBlob` o rozmiarze 1MB z typem "audio/wav"  
**Setup / izolacja:** Utworzenie poprawnego Blob audio  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj prawidłowy plik audio  
2. Wywołaj metodę validateAudioFile  
3. Sprawdź czy nie zostały rzucone błędy  
**Oczekiwany rezultat:** Metoda kończy się bez błędów  
**Priorytet:** Wysoki  
**Edge cases:** -  
**Notatki / uwagi:** Test podstawowej walidacji

### UT-WHISPER-VALIDATE-AUDIO-02
**Nazwa testu:** `should_throw_InvalidAudioFileError_when_file_too_large`  
**Moduł / funkcja:** `WhisperService.validateAudioFile`  
**Cel testu:** Weryfikacja rzucania błędu gdy plik audio przekracza maksymalny rozmiar  
**Wejście / dane testowe:** `audioBlob` o rozmiarze 30MB  
**Setup / izolacja:** Utworzenie zbyt dużego Blob audio  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj plik audio przekraczający limit 25MB  
2. Wywołaj metodę validateAudioFile  
3. Sprawdź czy został rzucony InvalidAudioFileError  
**Oczekiwany rezultat:** Rzucenie `InvalidAudioFileError` z informacją o przekroczonym rozmiarze  
**Priorytet:** Wysoki  
**Edge cases:** Dokładnie 25MB + 1 bajt  
**Notatki / uwagi:** Test granicznych warunków rozmiaru pliku

### UT-WHISPER-VALIDATE-AUDIO-03
**Nazwa testu:** `should_throw_InvalidAudioFileError_when_unsupported_format`  
**Moduł / funkcja:** `WhisperService.validateAudioFile`  
**Cel testu:** Weryfikacja rzucania błędu dla nieobsługiwanego formatu audio  
**Wejście / dane testowe:** `audioBlob` z typem "audio/aac"  
**Setup / izolacja:** Utworzenie Blob z nieobsługiwanym typem MIME  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj plik audio w nieobsługiwanym formacie  
2. Wywołaj metodę validateAudioFile  
3. Sprawdź czy został rzucony InvalidAudioFileError  
**Oczekiwany rezultat:** Rzucenie `InvalidAudioFileError` z listą obsługiwanych formatów  
**Priorytet:** Wysoki  
**Edge cases:** Typ MIME bez prefiksu "audio/", puste type  
**Notatki / uwagi:** Test walidacji formatów audio

### UT-WHISPER-VALIDATE-AUDIO-04
**Nazwa testu:** `should_pass_validation_when_supported_format_variations`  
**Moduł / funkcja:** `WhisperService.isSupportedFormat`  
**Cel testu:** Weryfikacja rozpoznawania różnych wariacji obsługiwanych formatów  
**Wejście / dane testowe:** Typy MIME: "audio/mpeg", "audio/mp3", "audio/wav;codecs=opus"  
**Setup / izolacja:** Test różnych wariacji typów MIME  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przetestuj różne obsługiwane typy MIME  
2. Wywołaj metodę isSupportedFormat dla każdego  
3. Sprawdź czy wszystkie zwracają true  
**Oczekiwany rezultat:** Wszystkie obsługiwane formaty są rozpoznawane  
**Priorytet:** Średni  
**Edge cases:** Typy z dodatkowymi parametrami kodeków  
**Notatki / uwagi:** Test elastyczności rozpoznawania formatów

## UT-WHISPER-PREPARE-DATA - Testy przygotowania danych

### UT-WHISPER-PREPARE-DATA-01
**Nazwa testu:** `should_create_correct_FormData_with_basic_params`  
**Moduł / funkcja:** `WhisperService.prepareFormData`  
**Cel testu:** Weryfikacja poprawnego tworzenia FormData z podstawowymi parametrami  
**Wejście / dane testowe:** `audioBlob` WAV, brak dodatkowych parametrów  
**Setup / izolacja:** Utworzenie podstawowego obiektu parametrów  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj parametry z podstawowym plikiem audio  
2. Wywołaj metodę prepareFormData  
3. Sprawdź zawartość FormData (file, model, response_format)  
**Oczekiwany rezultat:** FormData zawiera prawidłowe pola i wartości  
**Priorytet:** Wysoki  
**Edge cases:** -  
**Notatki / uwagi:** Test podstawowej funkcjonalności przygotowania danych

### UT-WHISPER-PREPARE-DATA-02
**Nazwa testu:** `should_include_optional_language_parameter_when_provided`  
**Moduł / funkcja:** `WhisperService.prepareFormData`  
**Cel testu:** Weryfikacja uwzględniania opcjonalnego parametru języka  
**Wejście / dane testowe:** `language: "pl"`  
**Setup / izolacja:** Parametry zawierające język polski  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj parametry z ustawionym językiem  
2. Wywołaj metodę prepareFormData  
3. Sprawdź czy FormData zawiera pole "language" z wartością "pl"  
**Oczekiwany rezultat:** Parametr języka jest włączony do FormData  
**Priorytet:** Średni  
**Edge cases:** -  
**Notatki / uwagi:** Test parametrów opcjonalnych

### UT-WHISPER-PREPARE-DATA-03
**Nazwa testu:** `should_include_optional_prompt_parameter_when_provided`  
**Moduł / funkcja:** `WhisperService.prepareFormData`  
**Cel testu:** Weryfikacja uwzględniania opcjonalnego parametru kontekstu  
**Wejście / dane testowe:** `prompt: "Transkrypcja paragonu fiskalnego"`  
**Setup / izolacja:** Parametry zawierające prompt kontekstowy  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj parametry z ustawionym promptem  
2. Wywołaj metodę prepareFormData  
3. Sprawdź czy FormData zawiera pole "prompt" z prawidłową wartością  
**Oczekiwany rezultat:** Parametr prompt jest włączony do FormData  
**Priorytet:** Średni  
**Edge cases:** -  
**Notatki / uwagi:** Test kontekstu dla lepszej transkrypcji

### UT-WHISPER-PREPARE-DATA-04
**Nazwa testu:** `should_use_correct_file_extension_for_different_formats`  
**Moduł / funkcja:** `WhisperService.getFileExtension`  
**Cel testu:** Weryfikacja mapowania typów MIME na prawidłowe rozszerzenia plików  
**Wejście / dane testowe:** Różne typy MIME: "audio/mp3", "audio/wav", "audio/ogg"  
**Setup / izolacja:** Test mapowania rozszerzeń  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przetestuj metodę getFileExtension dla różnych typów MIME  
2. Sprawdź zwracane rozszerzenia  
3. Porównaj z oczekiwanymi wartościami  
**Oczekiwany rezultat:** Każde rozszerzenie odpowiada typowi MIME  
**Priorytet:** Średni  
**Edge cases:** Nieznany typ MIME zwraca domyślne "webm"  
**Notatki / uwagi:** Test mapowania formatów plików

## UT-WHISPER-API-REQUEST - Testy żądań API

### UT-WHISPER-API-REQUEST-01
**Nazwa testu:** `should_return_successful_response_when_api_call_succeeds`  
**Moduł / funkcja:** `WhisperService.makeApiRequest`  
**Cel testu:** Weryfikacja obsługi prawidłowej odpowiedzi API  
**Wejście / dane testowe:** Mock odpowiedzi HTTP 200 z prawidłową strukturą JSON  
**Setup / izolacja:** Mockowanie fetch API  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj mock odpowiedzi API z sukcesem  
2. Wywołaj metodę makeApiRequest  
3. Sprawdź zwrócony obiekt odpowiedzi  
**Oczekiwany rezultat:** Zwrócenie sparsowanego obiektu odpowiedzi  
**Priorytet:** Wysoki  
**Edge cases:** -  
**Notatki / uwagi:** Test ścieżki sukcesu API

### UT-WHISPER-API-REQUEST-02
**Nazwa testu:** `should_throw_WhisperApiError_when_api_returns_error_status`  
**Moduł / funkcja:** `WhisperService.makeApiRequest`  
**Cel testu:** Weryfikacja rzucania błędu API przy błędnych statusach HTTP i parsowania wiadomości błędu  
**Wejście / dane testowe:** Mock odpowiedzi HTTP 400 z błędem zawierającym pole "error.message"  
**Setup / izolacja:** Mockowanie błędnej odpowiedzi API z JSON error.message  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj mock błędnej odpowiedzi API (400 Bad Request) z polem error.message  
2. Wywołaj metodę makeApiRequest i sprawdź rzucenie WhisperApiError  
3. Wywołaj metodę ponownie i sprawdź szczegóły wiadomości błędu  
4. Sprawdź właściwości błędu (status, apiMessage)  
**Oczekiwany rezultat:** Rzucenie `WhisperApiError` z prawidłowym statusem i sparsowaną wiadomością z API  
**Priorytet:** Wysoki  
**Edge cases:** Statusy 401, 403, 429, 500, niepoprawny JSON w odpowiedzi błędu  
**Notatki / uwagi:** Test obsługi błędów API i parsowania szczegółowych wiadomości

### UT-WHISPER-API-REQUEST-03
**Nazwa testu:** `should_throw_WhisperNetworkError_when_fetch_fails`  
**Moduł / funkcja:** `WhisperService.makeApiRequest`  
**Cel testu:** Weryfikacja rzucania błędu sieci przy problemach z połączeniem  
**Wejście / dane testowe:** Symulacja błędu fetch (network error)  
**Setup / izolacja:** Mockowanie fetch aby rzucał błąd sieci  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj mock fetch rzucający NetworkError  
2. Wywołaj metodę makeApiRequest i sprawdź rzucenie WhisperNetworkError  
3. Wywołaj metodę ponownie i sprawdź szczegóły wiadomości błędu  
**Oczekiwany rezultat:** Rzucenie `WhisperNetworkError` z opisem problemu sieci  
**Priorytet:** Wysoki  
**Edge cases:** Timeout, DNS resolution failure  
**Notatki / uwagi:** Test odporności na problemy sieci

## UT-WHISPER-PARSE-RESPONSE - Testy parsowania odpowiedzi

### UT-WHISPER-PARSE-RESPONSE-01
**Nazwa testu:** `should_return_valid_TranscriptionResult_when_response_complete`  
**Moduł / funkcja:** `WhisperService.parseTranscriptionResponse`  
**Cel testu:** Weryfikacja parsowania prawidłowej odpowiedzi transkrypcji  
**Wejście / dane testowe:** Obiekt odpowiedzi z text, language i duration  
**Setup / izolacja:** Przygotowanie kompletnego obiektu odpowiedzi  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj prawidłową odpowiedź API  
2. Wywołaj metodę parseTranscriptionResponse  
3. Sprawdź zwrócony obiekt TranscriptionResult  
**Oczekiwany rezultat:** Obiekt z text, language i duration  
**Priorytet:** Wysoki  
**Edge cases:** -  
**Notatki / uwagi:** Test parsowania prawidłowej odpowiedzi

### UT-WHISPER-PARSE-RESPONSE-02
**Nazwa testu:** `should_throw_InvalidTranscriptionError_when_text_missing`  
**Moduł / funkcja:** `WhisperService.parseTranscriptionResponse`  
**Cel testu:** Weryfikacja rzucania błędu gdy brakuje pola text  
**Wejście / dane testowe:** Obiekt odpowiedzi bez pola text  
**Setup / izolacja:** Odpowiedź API bez wymaganego pola  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj odpowiedź bez pola text  
2. Wywołaj metodę parseTranscriptionResponse  
3. Sprawdź czy został rzucony InvalidTranscriptionError  
**Oczekiwany rezultat:** Rzucenie `InvalidTranscriptionError` z informacją o brakującym polu  
**Priorytet:** Wysoki  
**Edge cases:** null, undefined, pusty string  
**Notatki / uwagi:** Test walidacji obowiązkowych pól

### UT-WHISPER-PARSE-RESPONSE-03
**Nazwa testu:** `should_throw_InvalidTranscriptionError_when_text_empty_after_trim`  
**Moduł / funkcja:** `WhisperService.parseTranscriptionResponse`  
**Cel testu:** Weryfikacja rzucania błędu gdy tekst po przycięciu jest pusty  
**Wejście / dane testowe:** Obiekt z text zawierającym tylko białe znaki  
**Setup / izolacja:** Odpowiedź z pustym tekstem po trim()  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj odpowiedź z pustym tekstem (tylko spacje/taby)  
2. Wywołaj metodę parseTranscriptionResponse  
3. Sprawdź czy został rzucony InvalidTranscriptionError  
**Oczekiwany rezultat:** Rzucenie `InvalidTranscriptionError` z informacją o pustym tekście  
**Priorytet:** Wysoki  
**Edge cases:** Tekst składający się tylko z białych znaków  
**Notatki / uwagi:** Test walidacji niepustego tekstu

## UT-WHISPER-TRANSCRIBE-AUDIO - Testy głównej metody

### UT-WHISPER-TRANSCRIBE-AUDIO-01
**Nazwa testu:** `should_return_transcription_successfully_when_all_steps_succeed`  
**Moduł / funkcja:** `WhisperService.transcribeAudio`  
**Cel testu:** Weryfikacja pełnego przepływu transkrypcji audio  
**Wejście / dane testowe:** Prawidłowy plik audio WAV  
**Setup / izolacja:** Mockowanie wszystkich zależności (walidacja, API, parsowanie)  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj prawidłowy plik audio  
2. Zamockuj wszystkie wewnętrzne metody  
3. Wywołaj metodę transcribeAudio  
4. Sprawdź zwrócony wynik transkrypcji  
**Oczekiwany rezultat:** Zwrócenie poprawnego obiektu TranscriptionResult  
**Priorytet:** Wysoki  
**Edge cases:** -  
**Notatki / uwagi:** Test end-to-end transkrypcji

### UT-WHISPER-TRANSCRIBE-AUDIO-02
**Nazwa testu:** `should_rethrow_InvalidAudioFileError_from_validation`  
**Moduł / funkcja:** `WhisperService.transcribeAudio`  
**Cel testu:** Weryfikacja propagacji błędów walidacji pliku audio z testowaniem typu i wiadomości  
**Wejście / dane testowe:** Nieprawidłowy plik audio (zbyt duży)  
**Setup / izolacja:** Ustawienie validateAudioFile aby rzucał błąd  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj nieprawidłowy plik audio  
2. Wywołaj metodę transcribeAudio i sprawdź rzucenie InvalidAudioFileError  
3. Utwórz nową instancję i sprawdź szczegóły wiadomości błędu  
**Oczekiwany rezultat:** Rzucenie `InvalidAudioFileError` z prawidłowym typem i wiadomością  
**Priorytet:** Wysoki  
**Edge cases:** Wszystkie typy błędów walidacji  
**Notatki / uwagi:** Test propagacji błędów walidacji z pełną weryfikacją

### UT-WHISPER-TRANSCRIBE-AUDIO-03
**Nazwa testu:** `should_rethrow_WhisperApiError_from_api_request`  
**Moduł / funkcja:** `WhisperService.transcribeAudio`  
**Cel testu:** Weryfikacja propagacji błędów API z testowaniem typu i wiadomości  
**Wejście / dane testowe:** Prawidłowy plik, błąd API  
**Setup / izolacja:** Mock makeApiRequest aby rzucał WhisperApiError  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj prawidłowy plik audio  
2. Zamockuj błąd API i sprawdź rzucenie WhisperApiError  
3. Utwórz nową instancję i sprawdź szczegóły wiadomości błędu  
**Oczekiwany rezultat:** Rzucenie `WhisperApiError` z prawidłowym typem i wiadomością  
**Priorytet:** Wysoki  
**Edge cases:** -  
**Notatki / uwagi:** Test propagacji błędów API z pełną weryfikacją

### UT-WHISPER-TRANSCRIBE-AUDIO-04
**Nazwa testu:** `should_wrap_unexpected_errors_in_generic_Error`  
**Moduł / funkcja:** `WhisperService.transcribeAudio`  
**Cel testu:** Weryfikacja obsługi nieoczekiwanych błędów z testowaniem typu i wiadomości  
**Wejście / dane testowe:** Dowolny plik audio  
**Setup / izolacja:** Mock jednej z metod aby rzucała nieoczekiwany błąd  
**Kroki testowe (Arrange → Act → Assert):**  
1. Przygotuj plik audio  
2. Zamockuj metodę aby rzucała nieznany błąd i sprawdź rzucenie generycznego Error  
3. Utwórz nową instancję i sprawdź szczegóły wiadomości błędu  
**Oczekiwany rezultat:** Rzucenie generycznego `Error` z prawidłowym typem i opisem nieoczekiwanego błędu  
**Priorytet:** Średni  
**Edge cases:** Błędy typu string, object, null  
**Notatki / uwagi:** Test odporności na nieoczekiwane błędy z pełną weryfikacją

## UT-WHISPER-ERROR-CLASSES - Testy klas błędów

### UT-WHISPER-ERROR-CLASSES-01
**Nazwa testu:** `should_create_WhisperConfigurationError_with_message`  
**Moduł / funkcja:** `WhisperConfigurationError`  
**Cel testu:** Weryfikacja tworzenia instancji błędu konfiguracji  
**Wejście / dane testowe:** `message = "Test configuration error"`  
**Setup / izolacja:** Utworzenie instancji błędu  
**Kroki testowe (Arrange → Act → Assert):**  
1. Utwórz nową instancję WhisperConfigurationError  
2. Sprawdź właściwości instancji  
3. Porównaj z oczekiwanymi wartościami  
**Oczekiwany rezultat:** Instancja z prawidłową wiadomością i nazwą klasy  
**Priorytet:** Niski  
**Edge cases:** -  
**Notatki / uwagi:** Test podstawowej funkcjonalności klasy błędu

### UT-WHISPER-ERROR-CLASSES-02
**Nazwa testu:** `should_create_WhisperApiError_with_status_and_message`  
**Moduł / funkcja:** `WhisperApiError`  
**Cel testu:** Weryfikacja tworzenia instancji błędu API z statusem HTTP  
**Wejście / dane testowe:** `status = 400, apiMessage = "Bad Request"`  
**Setup / izolacja:** Utworzenie instancji błędu z parametrami  
**Kroki testowe (Arrange → Act → Assert):**  
1. Utwórz nową instancję WhisperApiError  
2. Sprawdź status i wiadomość  
3. Sprawdź nazwę klasy  
**Oczekiwany rezultat:** Instancja z statusem, wiadomością i nazwą klasy  
**Priorytet:** Niski  
**Edge cases:** -  
**Notatki / uwagi:** Test klasy błędu API

### UT-WHISPER-ERROR-CLASSES-03
**Nazwa testu:** `should_create_WhisperNetworkError_with_message`  
**Moduł / funkcja:** `WhisperNetworkError`  
**Cel testu:** Weryfikacja tworzenia instancji błędu sieci  
**Wejście / dane testowe:** `message = "Network timeout"`  
**Setup / izolacja:** Utworzenie instancji błędu  
**Kroki testowe (Arrange → Act → Assert):**  
1. Utwórz nową instancję WhisperNetworkError  
2. Sprawdź wiadomość i nazwę klasy  
3. Sprawdź czy rozszerza Error  
**Oczekiwany rezultat:** Prawidłowa instancja błędu sieci  
**Priorytet:** Niski  
**Edge cases:** -  
**Notatki / uwagi:** Test klasy błędu sieci

### UT-WHISPER-ERROR-CLASSES-04
**Nazwa testu:** `should_create_InvalidAudioFileError_with_message`  
**Moduł / funkcja:** `InvalidAudioFileError`  
**Cel testu:** Weryfikacja tworzenia instancji błędu nieprawidłowego pliku audio  
**Wejście / dane testowe:** `message = "Unsupported format"`  
**Setup / izolacja:** Utworzenie instancji błędu  
**Kroki testowe (Arrange → Act → Assert):**  
1. Utwórz nową instancję InvalidAudioFileError  
2. Sprawdź wiadomość i nazwę klasy  
3. Sprawdź czy rozszerza Error  
**Oczekiwany rezultat:** Prawidłowa instancja błędu pliku audio  
**Priorytet:** Niski  
**Edge cases:** -  
**Notatki / uwagi:** Test klasy błędu pliku audio

### UT-WHISPER-ERROR-CLASSES-05
**Nazwa testu:** `should_create_InvalidTranscriptionError_with_message`  
**Moduł / funkcja:** `InvalidTranscriptionError`  
**Cel testu:** Weryfikacja tworzenia instancji błędu nieprawidłowej transkrypcji  
**Wejście / dane testowe:** `message = "Empty transcription"`  
**Setup / izolacja:** Utworzenie instancji błędu  
**Kroki testowe (Arrange → Act → Assert):**  
1. Utwórz nową instancję InvalidTranscriptionError  
2. Sprawdź wiadomość i nazwę klasy  
3. Sprawdź czy rozszerza Error  
**Oczekiwany rezultat:** Prawidłowa instancja błędu transkrypcji  
**Priorytet:** Niski  
**Edge cases:** -  
**Notatki / uwagi:** Test klasy błędu transkrypcji