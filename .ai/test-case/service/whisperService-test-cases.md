# WhisperService Unit Test Cases

## Error Classes Module

### UT-ERROR-001
**Nazwa testu:** should_create_WhisperConfigurationError_with_custom_message_when_constructed  
**Moduł / funkcja:** WhisperConfigurationError.constructor  
**Cel testu:** Verify error creation with custom message and name  
**Wejście / dane testowe:** message = "API key missing"  
**Setup / izolacja:** None required  
**Kroki testowe:** Arrange: Create error instance; Act: Check properties; Assert: message and name match  
**Oczekiwany rezultat:** error.message === "API key missing", error.name === "WhisperConfigurationError"  
**Priorytet:** Średni  
**Edge cases:** Empty string message, null message  
**Notatki / uwagi:** Simple constructor test, no external dependencies  

### UT-ERROR-002
**Nazwa testu:** should_create_WhisperApiError_with_status_and_message_when_constructed  
**Moduł / funkcja:** WhisperApiError.constructor  
**Cel testu:** Verify error creation with status code and API message  
**Wejście / dane testowe:** status = 401, apiMessage = "Invalid API key"  
**Setup / izolacja:** None required  
**Kroki testowe:** Arrange: Create error instance; Act: Check properties; Assert: status, message and name match  
**Oczekiwany rezultat:** error.status === 401, error.apiMessage === "Invalid API key", error.message contains both  
**Priorytet:** Średni  
**Edge cases:** Status 500, empty apiMessage  
**Notatki / uwagi:** Tests error formatting with status codes  

### UT-ERROR-003
**Nazwa testu:** should_create_WhisperNetworkError_with_custom_message_when_constructed  
**Moduł / funkcja:** WhisperNetworkError.constructor  
**Cel testu:** Verify network error creation  
**Wejście / dane testowe:** message = "Connection timeout"  
**Setup / izolacja:** None required  
**Kroki testowe:** Arrange: Create error instance; Act: Check properties; Assert: message and name match  
**Oczekiwany rezultat:** error.message === "Connection timeout", error.name === "WhisperNetworkError"  
**Priorytet:** Średni  
**Edge cases:** Empty message, very long message  
**Notatki / uwagi:** Basic error constructor test  

### UT-ERROR-004
**Nazwa testu:** should_create_InvalidAudioFileError_with_custom_message_when_constructed  
**Moduł / funkcja:** InvalidAudioFileError.constructor  
**Cel testu:** Verify audio file error creation  
**Wejście / dane testowe:** message = "Unsupported format: audio/unknown"  
**Setup / izolacja:** None required  
**Kroki testowe:** Arrange: Create error instance; Act: Check properties; Assert: message and name match  
**Oczekiwany rezultat:** error.message === "Unsupported format: audio/unknown", error.name === "InvalidAudioFileError"  
**Priorytet:** Średni  
**Edge cases:** Empty message  
**Notatki / uwagi:** Audio-specific error test  

### UT-ERROR-005
**Nazwa testu:** should_create_InvalidTranscriptionError_with_custom_message_when_constructed  
**Moduł / funkcja:** InvalidTranscriptionError.constructor  
**Cel testu:** Verify transcription error creation  
**Wejście / dane testowe:** message = "Empty transcription result"  
**Setup / izolacja:** None required  
**Kroki testowe:** Arrange: Create error instance; Act: Check properties; Assert: message and name match  
**Oczekiwany rezultat:** error.message === "Empty transcription result", error.name === "InvalidTranscriptionError"  
**Priorytet:** Średni  
**Edge cases:** Empty message  
**Notatki / uwagi:** Transcription-specific error test  

## Constructor Module

### UT-CONSTRUCTOR-001
**Nazwa testu:** should_initialize_service_successfully_when_api_key_provided_in_config  
**Moduł / funkcja:** WhisperService.constructor  
**Cel testu:** Verify service initialization with API key from config  
**Wejście / dane testowe:** config = { apiKey: "sk-test123" }  
**Setup / izolacja:** None required  
**Kroki testowe:** Arrange: Create config object; Act: Instantiate service; Assert: No exception thrown  
**Oczekiwany rezultat:** Service instance created without errors  
**Priorytet:** Wysoki  
**Edge cases:** Very long API key, API key with special characters  
**Notatki / uwagi:** Critical for service initialization  

### UT-CONSTRUCTOR-002
**Nazwa testu:** should_initialize_service_successfully_when_api_key_from_environment  
**Moduł / funkcja:** WhisperService.constructor  
**Cel testu:** Verify service initialization with API key from environment  
**Wejście / dane testowe:** config = {}, import.meta.env.OPENAI_API_KEY = "sk-env456"  
**Setup / izolacja:** Mock import.meta.env.OPENAI_API_KEY  
**Kroki testowe:** Arrange: Mock env variable; Act: Instantiate service; Assert: No exception thrown  
**Oczekiwany rezultat:** Service instance created without errors  
**Priorytet:** Wysoki  
**Edge cases:** Environment variable undefined initially  
**Notatki / uwagi:** Depends on environment mocking in tests  

### UT-CONSTRUCTOR-003
**Nazwa testu:** should_throw_WhisperConfigurationError_when_no_api_key_available  
**Moduł / funkcja:** WhisperService.constructor  
**Cel testu:** Verify error when no API key is provided  
**Wejście / dane testowe:** config = {}, import.meta.env.OPENAI_API_KEY = undefined  
**Setup / izolacja:** Mock import.meta.env.OPENAI_API_KEY as undefined  
**Kroki testowe:** Arrange: Clear API key sources; Act: Try to instantiate service; Assert: WhisperConfigurationError thrown  
**Oczekiwany rezultat:** WhisperConfigurationError with message "OPENAI_API_KEY is not set in environment variables."  
**Priorytet:** Wysoki  
**Edge cases:** Config has empty string API key  
**Notatki / uwagi:** Critical error path for service initialization  

## validateAudioFile Method

### UT-VALIDATE-001
**Nazwa testu:** should_pass_validation_when_audio_file_meets_requirements  
**Moduł / funkcja:** WhisperService.validateAudioFile  
**Cel testu:** Verify valid audio file passes validation  
**Wejście / dane testowe:** audioBlob = new Blob(['test'], { type: 'audio/wav' }), size = 1MB  
**Setup / izolacja:** Create service instance, mock audio blob  
**Kroki testowe:** Arrange: Create valid audio blob; Act: Call validateAudioFile; Assert: No exception thrown  
**Oczekiwany rezultat:** Method completes without throwing  
**Priorytet:** Wysoki  
**Edge cases:** Minimum size file (1 byte), maximum allowed size (25MB - 1 byte)  
**Notatki / uwagi:** Core validation logic  

### UT-VALIDATE-002
**Nazwa testu:** should_throw_InvalidAudioFileError_when_file_too_large  
**Moduł / funkcja:** WhisperService.validateAudioFile  
**Cel testu:** Verify error for oversized audio files  
**Wejście / dane testowe:** audioBlob.size = 26 * 1024 * 1024 (26MB), type = 'audio/wav'  
**Setup / izolacja:** Create service instance, mock oversized blob  
**Kroki testowe:** Arrange: Create oversized blob; Act: Call validateAudioFile; Assert: InvalidAudioFileError thrown  
**Oczekiwany rezultat:** InvalidAudioFileError with message containing size limits  
**Priorytet:** Wysoki  
**Edge cases:** Exactly 25MB + 1 byte, very large files  
**Notatki / uwagi:** Size limit enforcement  

### UT-VALIDATE-003
**Nazwa testu:** should_throw_InvalidAudioFileError_when_unsupported_format  
**Moduł / funkcja:** WhisperService.validateAudioFile  
**Cel testu:** Verify error for unsupported audio formats  
**Wejście / dane testowe:** audioBlob.type = 'audio/unknown', size = 1MB  
**Setup / izolacja:** Create service instance, mock blob with unsupported type  
**Kroki testowe:** Arrange: Create blob with unsupported MIME type; Act: Call validateAudioFile; Assert: InvalidAudioFileError thrown  
**Oczekiwany rezultat:** InvalidAudioFileError with message listing supported formats  
**Priorytet:** Wysoki  
**Edge cases:** Empty type string, partially matching type (e.g., 'audio/wav-extra')  
**Notatki / uwagi:** Format validation logic  

### UT-VALIDATE-004
**Nazwa testu:** should_pass_validation_when_audio_type_empty_but_size_valid  
**Moduł / funkcja:** WhisperService.validateAudioFile  
**Cel testu:** Verify validation passes when MIME type is empty but size is valid  
**Wejście / dane testowe:** audioBlob.type = '', size = 1MB  
**Setup / izolacja:** Create service instance, mock blob with empty type  
**Kroki testowe:** Arrange: Create blob with empty type; Act: Call validateAudioFile; Assert: No exception thrown  
**Oczekiwany rezultat:** Method completes without throwing  
**Priorytet:** Średni  
**Edge cases:** Null type, undefined type  
**Notatki / uwagi:** Edge case for missing MIME type  

## isSupportedFormat Method

### UT-FORMAT-001
**Nazwa testu:** should_return_true_when_format_supported  
**Moduł / funkcja:** WhisperService.isSupportedFormat  
**Cel testu:** Verify supported format detection  
**Wejście / dane testowe:** mimeType = 'audio/wav'  
**Setup / izolacja:** Create service instance  
**Kroki testowe:** Arrange: Use supported MIME type; Act: Call isSupportedFormat; Assert: Returns true  
**Oczekiwany rezultat:** true  
**Priorytet:** Średni  
**Edge cases:** All supported formats from supportedFormats array  
**Notatki / uwagi:** Format checking logic  

### UT-FORMAT-002
**Nazwa testu:** should_return_false_when_format_not_supported  
**Moduł / funkcja:** WhisperService.isSupportedFormat  
**Cel testu:** Verify unsupported format detection  
**Wejście / dane testowe:** mimeType = 'audio/unknown'  
**Setup / izolacja:** Create service instance  
**Kroki testowe:** Arrange: Use unsupported MIME type; Act: Call isSupportedFormat; Assert: Returns false  
**Oczekiwany rezultat:** false  
**Priorytet:** Średni  
**Edge cases:** Video formats, text formats, empty string  
**Notatki / uwagi:** Negative case for format checking  

### UT-FORMAT-003
**Nazwa testu:** should_return_true_when_format_partially_matches_supported  
**Moduł / funkcja:** WhisperService.isSupportedFormat  
**Cel testu:** Verify partial format matching (contains/includes logic)  
**Wejście / dane testowe:** mimeType = 'audio/wav;codecs=opus'  
**Setup / izolacja:** Create service instance  
**Kroki testowe:** Arrange: Use MIME type with parameters; Act: Call isSupportedFormat; Assert: Returns true  
**Oczekiwany rezultat:** true (due to includes check)  
**Priorytet:** Średni  
**Edge cases:** Various parameter combinations  
**Notatki / uwagi:** Tests the includes logic in format checking  

## prepareFormData Method

### UT-PREPARE-001
**Nazwa testu:** should_create_FormData_with_required_fields_when_minimal_params  
**Moduł / funkcja:** WhisperService.prepareFormData  
**Cel testu:** Verify FormData creation with required fields  
**Wejście / dane testowe:** params = { audioBlob: new Blob(['test'], { type: 'audio/wav' }) }  
**Setup / izolacja:** Create service instance, mock audio blob  
**Kroki testowe:** Arrange: Create minimal params; Act: Call prepareFormData; Assert: FormData contains required fields  
**Oczekiwany rezultat:** FormData has 'file', 'model', 'response_format' fields  
**Priorytet:** Wysoki  
**Edge cases:** Empty blob  
**Notatki / uwagi:** Core FormData preparation  

### UT-PREPARE-002
**Nazwa testu:** should_include_language_when_provided  
**Moduł / funkcja:** WhisperService.prepareFormData  
**Cel testu:** Verify language parameter inclusion  
**Wejście / dane testowe:** params = { audioBlob: blob, language: 'pl' }  
**Setup / izolacja:** Create service instance, mock blob  
**Kroki testowe:** Arrange: Include language param; Act: Call prepareFormData; Assert: FormData contains language  
**Oczekiwany rezultat:** FormData has 'language' field with value 'pl'  
**Priorytet:** Średni  
**Edge cases:** Empty language string, invalid language code  
**Notatki / uwagi:** Optional parameter handling  

### UT-PREPARE-003
**Nazwa testu:** should_include_prompt_when_provided  
**Moduł / funkcja:** WhisperService.prepareFormData  
**Cel testu:** Verify prompt parameter inclusion  
**Wejście / dane testowe:** params = { audioBlob: blob, prompt: 'medical transcription' }  
**Setup / izolacja:** Create service instance, mock blob  
**Kroki testowe:** Arrange: Include prompt param; Act: Call prepareFormData; Assert: FormData contains prompt  
**Oczekiwany rezultat:** FormData has 'prompt' field with value 'medical transcription'  
**Priorytet:** Średni  
**Edge cases:** Empty prompt, very long prompt  
**Notatki / uwagi:** Optional parameter handling  

### UT-PREPARE-004
**Nazwa testu:** should_use_correct_file_extension_based_on_mime_type  
**Moduł / funkcja:** WhisperService.prepareFormData  
**Cel testu:** Verify file extension mapping from MIME type  
**Wejście / dane testowe:** params = { audioBlob: blob with type 'audio/mp3' }  
**Setup / izolacja:** Create service instance, mock blob with specific type  
**Kroki testowe:** Arrange: Use different MIME types; Act: Call prepareFormData; Assert: File appended with correct extension  
**Oczekiwany rezultat:** File appended as 'audio.mp3' for mp3 type  
**Priorytet:** Średni  
**Edge cases:** All MIME types from extensionMap, unknown MIME type (defaults to webm)  
**Notatki / uwagi:** Depends on getFileExtension method  

## getFileExtension Method

### UT-EXTENSION-001
**Nazwa testu:** should_return_correct_extension_for_known_mime_types  
**Moduł / funkcja:** WhisperService.getFileExtension  
**Cel testu:** Verify MIME type to extension mapping  
**Wejście / dane testowe:** mimeType = 'audio/wav'  
**Setup / izolacja:** Create service instance  
**Kroki testowe:** Arrange: Use known MIME type; Act: Call getFileExtension; Assert: Returns correct extension  
**Oczekiwany rezultat:** 'wav'  
**Priorytet:** Średni  
**Edge cases:** All entries from extensionMap  
**Notatki / uwagi:** Static mapping test  

### UT-EXTENSION-002
**Nazwa testu:** should_return_webm_as_default_for_unknown_mime_types  
**Moduł / funkcja:** WhisperService.getFileExtension  
**Cel testu:** Verify default extension for unknown types  
**Wejście / dane testowe:** mimeType = 'audio/unknown'  
**Setup / izolacja:** Create service instance  
**Kroki testowe:** Arrange: Use unknown MIME type; Act: Call getFileExtension; Assert: Returns default extension  
**Oczekiwany rezultat:** 'webm'  
**Priorytet:** Średni  
**Edge cases:** Empty string, null, undefined  
**Notatki / uwagi:** Default fallback behavior  

## makeApiRequest Method

### UT-API-001
**Nazwa testu:** should_return_parsed_response_when_api_call_successful  
**Moduł / funkcja:** WhisperService.makeApiRequest  
**Cel testu:** Verify successful API call handling  
**Wejście / dane testowe:** Mock response with status 200, body { text: "Hello world" }  
**Setup / izolacja:** Mock fetch to return successful response  
**Kroki testowe:** Arrange: Mock fetch with success response; Act: Call makeApiRequest; Assert: Returns parsed response  
**Oczekiwany rezultat:** Returns the parsed JSON response object  
**Priorytet:** Wysoki  
**Edge cases:** Different response structures  
**Notatki / uwagi:** Requires fetch mocking  

### UT-API-002
**Nazwa testu:** should_throw_WhisperApiError_when_api_returns_error_status  
**Moduł / funkcja:** WhisperService.makeApiRequest  
**Cel testu:** Verify API error status handling  
**Wejście / dane testowe:** Mock response with status 401, error message "Invalid API key"  
**Setup / izolacja:** Mock fetch to return error response  
**Kroki testowe:** Arrange: Mock fetch with error response; Act: Call makeApiRequest; Assert: WhisperApiError thrown  
**Oczekiwany rezultat:** WhisperApiError with correct status and message  
**Priorytet:** Wysoki  
**Edge cases:** Status codes 400, 403, 429, 500, malformed error response  
**Notatki / uwagi:** Error response parsing  

### UT-API-003
**Nazwa testu:** should_throw_WhisperNetworkError_when_fetch_fails  
**Moduł / funkcja:** WhisperService.makeApiRequest  
**Cel testu:** Verify network failure handling  
**Wejście / dane testowe:** Mock fetch to throw network error  
**Setup / izolacja:** Mock fetch to reject with network error  
**Kroki testowe:** Arrange: Mock fetch rejection; Act: Call makeApiRequest; Assert: WhisperNetworkError thrown  
**Oczekiwany rezultat:** WhisperNetworkError with network error message  
**Priorytet:** Wysoki  
**Edge cases:** Timeout errors, DNS resolution failures  
**Notatki / uwagi:** Network failure simulation  

## parseTranscriptionResponse Method

### UT-PARSE-001
**Nazwa testu:** should_return_TranscriptionResult_when_response_valid  
**Moduł / funkcja:** WhisperService.parseTranscriptionResponse  
**Cel testu:** Verify valid response parsing  
**Wejście / dane testowe:** apiResponse = { text: "Hello world", language: "en", duration: 2.5 }  
**Setup / izolacja:** Create service instance  
**Kroki testowe:** Arrange: Create valid response object; Act: Call parseTranscriptionResponse; Assert: Returns TranscriptionResult  
**Oczekiwany rezultat:** { text: "Hello world", language: "en", duration: 2.5 }  
**Priorytet:** Wysoki  
**Edge cases:** Response with missing optional fields  
**Notatki / uwagi:** Core response parsing  

### UT-PARSE-002
**Nazwa testu:** should_throw_InvalidTranscriptionError_when_text_missing  
**Moduł / funkcja:** WhisperService.parseTranscriptionResponse  
**Cel testu:** Verify error for missing text field  
**Wejście / dane testowe:** apiResponse = { language: "en" } (no text field)  
**Setup / izolacja:** Create service instance  
**Kroki testowe:** Arrange: Create response without text; Act: Call parseTranscriptionResponse; Assert: InvalidTranscriptionError thrown  
**Oczekiwany rezultat:** InvalidTranscriptionError with message about missing text field  
**Priorytet:** Wysoki  
**Edge cases:** Null text, undefined text, non-string text  
**Notatki / uwagi:** Text field validation  

### UT-PARSE-003
**Nazwa testu:** should_throw_InvalidTranscriptionError_when_text_empty_after_trim  
**Moduł / funkcja:** WhisperService.parseTranscriptionResponse  
**Cel testu:** Verify error for empty/whitespace text  
**Wejście / dane testowe:** apiResponse = { text: "   " }  
**Setup / izolacja:** Create service instance  
**Kroki testowe:** Arrange: Create response with whitespace-only text; Act: Call parseTranscriptionResponse; Assert: InvalidTranscriptionError thrown  
**Oczekiwany rezultat:** InvalidTranscriptionError with message about empty text  
**Priorytet:** Wysoki  
**Edge cases:** Text with only tabs/newlines, mixed whitespace  
**Notatki / uwagi:** Text content validation  

### UT-PARSE-004
**Nazwa testu:** should_trim_whitespace_from_transcription_text  
**Moduł / funkcja:** WhisperService.parseTranscriptionResponse  
**Cel testu:** Verify text trimming behavior  
**Wejście / dane testowe:** apiResponse = { text: "  Hello world  " }  
**Setup / izolacja:** Create service instance  
**Kroki testowe:** Arrange: Create response with padded text; Act: Call parseTranscriptionResponse; Assert: Text is trimmed  
**Oczekiwany rezultat:** { text: "Hello world", ... }  
**Priorytet:** Średni  
**Edge cases:** Leading whitespace, trailing whitespace, mixed  
**Notatki / uwagi:** Text normalization  

## transcribeAudio Method (Integration)

### UT-INTEGRATION-001
**Nazwa testu:** should_return_transcription_result_when_all_steps_succeed  
**Moduł / funkcja:** WhisperService.transcribeAudio  
**Cel testu:** Verify complete successful transcription flow  
**Wejście / dane testowe:** Valid audio blob, mock successful API response  
**Setup / izolacja:** Mock all dependencies (fetch, blob validation)  
**Kroki testowe:** Arrange: Setup mocks for success path; Act: Call transcribeAudio; Assert: Returns expected result  
**Oczekiwany rezultat:** TranscriptionResult with transcribed text  
**Priorytet:** Wysoki  
**Edge cases:** Different audio formats, with/without language/prompt  
**Notatki / uwagi:** Full integration test, requires comprehensive mocking  

### UT-INTEGRATION-002
**Nazwa testu:** should_rethrow_InvalidAudioFileError_from_validation  
**Moduł / funkcja:** WhisperService.transcribeAudio  
**Cel testu:** Verify validation errors bubble up correctly  
**Wejście / dane testowe:** Invalid audio blob (too large)  
**Setup / izolacja:** Create service instance  
**Kroki testowe:** Arrange: Use invalid blob; Act: Call transcribeAudio; Assert: InvalidAudioFileError thrown  
**Oczekiwany rezultat:** Same InvalidAudioFileError from validateAudioFile  
**Priorytet:** Wysoki  
**Edge cases:** Different validation failures  
**Notatki / uwagi:** Error propagation testing  

### UT-INTEGRATION-003
**Nazwa testu:** should_rethrow_WhisperApiError_from_api_request  
**Moduł / funkcja:** WhisperService.transcribeAudio  
**Cel testu:** Verify API errors bubble up correctly  
**Wejście / dane testowe:** Valid blob, mock API error response  
**Setup / izolacja:** Mock fetch to return API error  
**Kroki testowe:** Arrange: Mock API failure; Act: Call transcribeAudio; Assert: WhisperApiError thrown  
**Oczekiwany rezultat:** Same WhisperApiError from makeApiRequest  
**Priorytet:** Wysoki  
**Edge cases:** Different HTTP status codes  
**Notatki / uwagi:** Error propagation testing  

### UT-INTEGRATION-004
**Nazwa testu:** should_rethrow_WhisperNetworkError_from_api_request  
**Moduł / funkcja:** WhisperService.transcribeAudio  
**Cel testu:** Verify network errors bubble up correctly  
**Wejście / dane testowe:** Valid blob, mock network failure  
**Setup / izolacja:** Mock fetch to throw network error  
**Kroki testowe:** Arrange: Mock network failure; Act: Call transcribeAudio; Assert: WhisperNetworkError thrown  
**Oczekiwany rezultat:** Same WhisperNetworkError from makeApiRequest  
**Priorytet:** Wysoki  
**Edge cases:** Different network failure types  
**Notatki / uwagi:** Error propagation testing  

### UT-INTEGRATION-005
**Nazwa testu:** should_rethrow_InvalidTranscriptionError_from_parsing  
**Moduł / funkcja:** WhisperService.transcribeAudio  
**Cel testu:** Verify parsing errors bubble up correctly  
**Wejście / dane testowe:** Valid blob, mock API response with invalid data  
**Setup / izolacja:** Mock fetch to return response without text  
**Kroki testowe:** Arrange: Mock invalid API response; Act: Call transcribeAudio; Assert: InvalidTranscriptionError thrown  
**Oczekiwany rezultat:** Same InvalidTranscriptionError from parseTranscriptionResponse  
**Priorytet:** Wysoki  
**Edge cases:** Empty text, malformed response  
**Notatki / uwagi:** Error propagation testing  

### UT-INTEGRATION-006
**Nazwa testu:** should_wrap_unexpected_errors_in_generic_Error  
**Moduł / funkcja:** WhisperService.transcribeAudio  
**Cel testu:** Verify unexpected errors are wrapped properly  
**Wejście / dane testowe:** Valid blob, mock unexpected error in dependencies  
**Setup / izolacja:** Mock a method to throw unexpected error  
**Kroki testowe:** Arrange: Mock unexpected error; Act: Call transcribeAudio; Assert: Generic Error thrown  
**Oczekiwany rezultat:** Error with message containing "Unexpected error in WhisperService"  
**Priorytet:** Średni  
**Edge cases:** Different types of unexpected errors  
**Notatki / uwagi:** Error handling robustness  

## Summary

Najważniejsze moduły do pokrycia unit testami to:
- **transcribeAudio** (metoda publiczna) - główny punkt wejścia serwisu, wymaga kompleksowych testów integracyjnych i obsługi błędów
- **validateAudioFile** - krytyczna walidacja wejścia, powinna mieć pełne pokrycie przypadków brzegowych
- **makeApiRequest** - obsługa komunikacji z API zewnętrznym, kluczowe dla niezawodności serwisu
