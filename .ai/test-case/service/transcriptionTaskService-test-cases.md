# TranscriptionTaskService - Unit Test Cases

## Task Management Methods

### UT-TASK-CREATE-001
**Nazwa testu:** `should_create_task_successfully_when_valid_params_provided`  
**Moduł / funkcja:** `TranscriptionTaskService.createTask`  
**Cel testu:** Weryfikacja tworzenia nowego zadania transkrypcji z poprawnymi parametrami  
**Wejście / dane testowe:** `groupId: "group-123"`, `userId: "user-456"`, `audioUrl: "https://example.com/audio.wav"`  
**Setup / izolacja:** Mock Supabase client, stub insert method  
**Kroki testowe:** Arrange - setup mock, Act - wywołaj createTask, Assert - sprawdź wywołanie insert z poprawnymi danymi  
**Oczekiwany rezultat:** Metoda zwraca utworzony task object z statusem "processing"  
**Priorytet:** wysoki  
**Edge cases:** audioUrl opcjonalny, null audioUrl  
**Notatki / uwagi:** Testuje podstawowy happy path tworzenia zadania

### UT-TASK-CREATE-002
**Nazwa testu:** `should_throw_error_when_database_insert_fails`  
**Moduł / funkcja:** `TranscriptionTaskService.createTask`  
**Cel testu:** Weryfikacja obsługi błędu podczas tworzenia zadania  
**Wejście / dane testowe:** `groupId: "group-123"`, `userId: "user-456"`  
**Setup / izolacja:** Mock Supabase client, stub insert method z błędem  
**Kroki testowe:** Arrange - setup mock z błędem, Act - wywołaj createTask, Assert - sprawdź rzucony błąd  
**Oczekiwany rezultat:** Rzuca Error z wiadomością "Failed to create transcription task"  
**Priorytet:** wysoki  
**Edge cases:** Database connection error, constraint violation  
**Notatki / uwagi:** Testuje error handling dla operacji bazy danych

### UT-TASK-GET-001
**Nazwa testu:** `should_return_task_when_exists_and_user_has_access`  
**Moduł / funkcja:** `TranscriptionTaskService.getTask`  
**Cel testu:** Weryfikacja pobierania zadania przez właściciela  
**Wejście / dane testowe:** `taskId: "task-123"`, `userId: "user-456"`, task istnieje w bazie  
**Setup / izolacja:** Mock Supabase client, stub select z wynikiem  
**Kroki testowe:** Arrange - setup mock z task data, Act - wywołaj getTask, Assert - sprawdź zwrócony task  
**Oczekiwany rezultat:** Zwraca task object z poprawnymi danymi  
**Priorytet:** wysoki  
**Edge cases:** Task z różnymi statusami (processing, completed, failed)  
**Notatki / uwagi:** Testuje podstawowe pobieranie zadania z RLS

### UT-TASK-GET-002
**Nazwa testu:** `should_throw_task_not_found_error_when_task_does_not_exist`  
**Moduł / funkcja:** `TranscriptionTaskService.getTask`  
**Cel testu:** Weryfikacja obsługi nieistniejącego zadania  
**Wejście / dane testowe:** `taskId: "nonexistent-task"`, `userId: "user-456"`  
**Setup / izolacja:** Mock Supabase client, stub select z pustym wynikiem  
**Kroki testowe:** Arrange - setup mock z null data, Act - wywołaj getTask, Assert - sprawdź rzucony błąd  
**Oczekiwany rezultat:** Rzuca TaskNotFoundError z taskId w wiadomości  
**Priorytet:** wysoki  
**Edge cases:** Database error vs no results  
**Notatki / uwagi:** Testuje custom error class dla nieistniejących zadań

### UT-TASK-GET-003
**Nazwa testu:** `should_throw_error_when_database_query_fails`  
**Moduł / funkcja:** `TranscriptionTaskService.getTask`  
**Cel testu:** Weryfikacja obsługi błędów bazy danych podczas pobierania  
**Wejście / dane testowe:** `taskId: "task-123"`, `userId: "user-456"`  
**Setup / izolacja:** Mock Supabase client, stub select z błędem (nie PGRST116)  
**Kroki testowe:** Arrange - setup mock z błędem, Act - wywołaj getTask, Assert - sprawdź rzucony błąd  
**Oczekiwany rezultat:** Rzuca Error z wiadomością "Failed to fetch transcription task"  
**Priorytet:** średni  
**Edge cases:** Network timeout, permission denied  
**Notatki / uwagi:** Testuje ogólne błędy bazy danych (nie 404)

### UT-TASK-COMPLETE-001
**Nazwa testu:** `should_update_task_to_completed_with_results`  
**Moduł / funkcja:** `TranscriptionTaskService.completeTask`  
**Cel testu:** Weryfikacja aktualizacji zadania na completed ze wszystkimi danymi  
**Wejście / dane testowe:** `taskId: "task-123"`, `transcriptionText: "Test transcription"`, `resultData: {description: "Test expense", amount: 100}`  
**Setup / izolacja:** Mock Supabase client, stub update method  
**Kroki testowe:** Arrange - setup mock, Act - wywołaj completeTask, Assert - sprawdź wywołanie update z poprawnymi danymi  
**Oczekiwany rezultat:** Update wywołany z status: "completed", transcription_text, result_data i completed_at  
**Priorytet:** wysoki  
**Edge cases:** resultData z różnymi strukturami JSON  
**Notatki / uwagi:** Testuje zakończenie zadania sukcesem

### UT-TASK-COMPLETE-002
**Nazwa testu:** `should_throw_error_when_task_update_fails`  
**Moduł / funkcja:** `TranscriptionTaskService.completeTask`  
**Cel testu:** Weryfikacja obsługi błędu podczas aktualizacji zadania  
**Wejście / dane testowe:** `taskId: "task-123"`, transcription i result data  
**Setup / izolacja:** Mock Supabase client, stub update z błędem  
**Kroki testowe:** Arrange - setup mock z błędem, Act - wywołaj completeTask, Assert - sprawdź rzucony błąd  
**Oczekiwany rezultat:** Rzuca Error z wiadomością "Failed to update task status"  
**Priorytet:** wysoki  
**Edge cases:** Database constraint violations  
**Notatki / uwagi:** Testuje error handling dla update operacji

### UT-TASK-FAIL-001
**Nazwa testu:** `should_update_task_to_failed_with_error_details`  
**Moduł / funkcja:** `TranscriptionTaskService.failTask`  
**Cel testu:** Weryfikacja aktualizacji zadania na failed z detalami błędu  
**Wejście / dane testowe:** `taskId: "task-123"`, `errorCode: "WHISPER_ERROR"`, `errorMessage: "Transcription failed"`  
**Setup / izolacja:** Mock Supabase client, stub update method  
**Kroki testowe:** Arrange - setup mock, Act - wywołaj failTask, Assert - sprawdź wywołanie update z poprawnymi danymi  
**Oczekiwany rezultat:** Update wywołany z status: "failed", error_code, error_message i completed_at  
**Priorytet:** wysoki  
**Edge cases:** Różne kody błędów i wiadomości  
**Notatki / uwagi:** Testuje zakończenie zadania błędem

## Processing Pipeline Methods

### UT-PROCESS-001
**Nazwa testu:** `should_process_task_successfully_through_complete_pipeline`  
**Moduł / funkcja:** `TranscriptionTaskService.processTask`  
**Cel testu:** Weryfikacja pełnego przetwarzania zadania od audio do wyniku  
**Wejście / dane testowe:** `taskId: "task-123"`, audioBlob (mock), groupContext z członkami i walutami  
**Setup / izolacja:** Mock WhisperService, OpenRouterService, Supabase client  
**Kroki testowe:** Arrange - setup mocks dla wszystkich usług, Act - wywołaj processTask, Assert - sprawdź wywołania i zakończenie zadania  
**Oczekiwany rezultat:** Wywołane wszystkie etapy pipeline, zadanie zakończone z extraction_confidence  
**Priorytet:** wysoki  
**Edge cases:** LLM confidence null vs provided, heuristic calculation fallback  
**Notatki / uwagi:** Testuje główny happy path procesu przetwarzania

### UT-PROCESS-002
**Nazwa testu:** `should_calculate_combined_confidence_when_llm_provides_score`  
**Moduł / funkcja:** `TranscriptionTaskService.processTask`  
**Cel testu:** Weryfikacja kalkulacji combined confidence score (70% LLM + 30% heuristic)  
**Wejście / dane testowe:** Expense data z extraction_confidence: 0.8, heuristic confidence: 0.6  
**Setup / izolacja:** Mock wszystkich zależności  
**Kroki testowe:** Arrange - setup mocks z konkretnymi wartościami, Act - processTask, Assert - sprawdź obliczony confidence  
**Oczekiwany rezultat:** Final confidence = 0.7 * 0.8 + 0.3 * 0.6 = 0.68  
**Priorytet:** średni  
**Edge cases:** LLM confidence = 1.0, heuristic = 0.0; różne kombinacje wartości  
**Notatki / uwagi:** Testuje logikę weighted average confidence

### UT-PROCESS-003
**Nazwa testu:** `should_use_heuristic_confidence_when_llm_does_not_provide_score`  
**Moduł / funkcja:** `TranscriptionTaskService.processTask`  
**Cel testu:** Weryfikacja fallback do heuristic confidence gdy LLM nie podaje wartości  
**Wejście / dane testowe:** Expense data z extraction_confidence: null  
**Setup / izolacja:** Mock wszystkich zależności  
**Kroki testowe:** Arrange - setup mocks bez LLM confidence, Act - processTask, Assert - sprawdź użycie heuristic score  
**Oczekiwany rezultat:** Final confidence równy obliczonemu heuristic confidence  
**Priorytet:** średni  
**Edge cases:** extraction_confidence = undefined, extraction_confidence = 0  
**Notatki / uwagi:** Testuje fallback logic dla confidence calculation

### UT-PROCESS-004
**Nazwa testu:** `should_fail_task_and_rethrow_error_when_whisper_transcription_fails`  
**Moduł / funkcja:** `TranscriptionTaskService.processTask`  
**Cel testu:** Weryfikacja obsługi błędu w etapie transkrypcji  
**Wejście / dane testowe:** AudioBlob, groupContext  
**Setup / izolacja:** Mock WhisperService rzuca błąd, mock failTask  
**Kroki testowe:** Arrange - setup WhisperService error, Act - processTask, Assert - sprawdź failTask wywołanie i re-thrown error  
**Oczekiwany rezultat:** failTask wywołany z odpowiednim kodem błędu, TaskProcessingError rzucony  
**Priorytet:** wysoki  
**Edge cases:** Network errors, invalid audio format  
**Notatki / uwagi:** Testuje error handling w pipeline

### UT-PROCESS-005
**Nazwa testu:** `should_fail_task_and_rethrow_error_when_llm_extraction_fails`  
**Moduł / funkcja:** `TranscriptionTaskService.processTask`  
**Cel testu:** Weryfikacja obsługi błędu w etapie ekstrakcji danych  
**Wejście / dane testowe:** Transcription text, groupContext  
**Setup / izolacja:** Mock OpenRouterService rzuca błąd, mock failTask  
**Kroki testowe:** Arrange - setup LLM error, Act - processTask, Assert - sprawdź failTask wywołanie i re-thrown error  
**Oczekiwany rezultat:** failTask wywołany z odpowiednim kodem błędu, TaskProcessingError rzucony  
**Priorytet:** wysoki  
**Edge cases:** API rate limits, invalid response format  
**Notatki / uwagi:** Testuje error handling w pipeline

## Group Context Methods

### UT-GROUP-CTX-001
**Nazwa testu:** `should_return_complete_group_context_for_active_member`  
**Moduł / funkcja:** `TranscriptionTaskService.getGroupContext`  
**Cel testu:** Weryfikacja pobierania pełnego kontekstu grupy dla aktywnego członka  
**Wejście / dane testowe:** `groupId: "group-123"`, `userId: "user-456"` (aktywny członek)  
**Setup / izolacja:** Mock Supabase z grupą, członkami i walutami  
**Kroki testowe:** Arrange - setup mock data, Act - getGroupContext, Assert - sprawdź zwrócony GroupContext  
**Oczekiwany rezultat:** GroupContext z groupId, groupName, baseCurrency, members array, currencies array  
**Priorytet:** wysoki  
**Edge cases:** Grupa z jednym członkiem, grupa z wieloma walutami  
**Notatki / uwagi:** Testuje podstawowe pobieranie kontekstu grupy

### UT-GROUP-CTX-002
**Nazwa testu:** `should_throw_group_context_error_when_user_not_active_member`  
**Moduł / funkcja:** `TranscriptionTaskService.getGroupContext`  
**Cel testu:** Weryfikacja odmowy dostępu dla nieaktywnego członka  
**Wejście / dane testowe:** `groupId: "group-123"`, `userId: "inactive-user"`  
**Setup / izolacja:** Mock Supabase bez aktywnego członkostwa  
**Kroki testowe:** Arrange - setup mock bez członkostwa, Act - getGroupContext, Assert - sprawdź rzucony błąd  
**Oczekiwany rezultat:** Rzuca GroupContextError z wiadomością o braku członkostwa  
**Priorytet:** wysoki  
**Edge cases:** User pending, user inactive, user not invited  
**Notatki / uwagi:** Testuje RLS i access control

### UT-GROUP-CTX-003
**Nazwa testu:** `should_throw_group_context_error_when_members_fetch_fails`  
**Moduł / funkcja:** `TranscriptionTaskService.getGroupContext`  
**Cel testu:** Weryfikacja obsługi błędu podczas pobierania członków grupy  
**Wejście / dane testowe:** `groupId: "group-123"`, `userId: "user-456"`  
**Setup / izolacja:** Mock Supabase z błędem w zapytaniu members  
**Kroki testowe:** Arrange - setup members error, Act - getGroupContext, Assert - sprawdź rzucony błąd  
**Oczekiwany rezultat:** Rzuca GroupContextError z wiadomością "Failed to fetch group members"  
**Priorytet:** średni  
**Edge cases:** Network error, permission denied  
**Notatki / uwagi:** Testuje error handling w kontekście grupy

### UT-GROUP-CTX-004
**Nazwa testu:** `should_filter_out_members_without_email_in_context`  
**Moduł / funkcja:** `TranscriptionTaskService.getGroupContext`  
**Cel testu:** Weryfikacja filtrowania członków bez email  
**Wejście / dane testowe:** Members data z jednym członkiem bez email  
**Setup / izolacja:** Mock Supabase z mixed member data  
**Kroki testowe:** Arrange - setup members z/bez email, Act - getGroupContext, Assert - sprawdź filtrowanych członków  
**Oczekiwany rezultat:** Members array zawiera tylko członków z email, inni odfiltrowani  
**Priorytet:** niski  
**Edge cases:** All members without email, single member with email  
**Notatki / uwagi:** Testuje data validation w kontekście grupy

## Helper Methods (Private)

### UT-HELPER-WHISPER-001
**Nazwa testu:** `should_build_whisper_prompt_with_group_and_members_info`  
**Moduł / funkcja:** `TranscriptionTaskService.buildWhisperPrompt` (pośrednio przez processTask)  
**Cel testu:** Weryfikacja budowy prompt dla Whisper z kontekstem grupy  
**Wejście / dane testowe:** GroupContext z nazwą grupy i listą członków  
**Setup / izolacja:** Wywołaj przez processTask lub testuj prywatną metodę bezpośrednio  
**Kroki testowe:** Arrange - setup context, Act - buildWhisperPrompt, Assert - sprawdź format prompt  
**Oczekiwany rezultat:** Prompt zawiera nazwę grupy i listę członków w formacie "Grupa: X. Członkowie: Y."  
**Priorytet:** średni  
**Edge cases:** Grupa bez członków, członkowie z specjalnymi znakami  
**Notatki / uwagi:** Testuje prompt engineering dla Whisper

### UT-HELPER-LLM-001
**Nazwa testu:** `should_build_comprehensive_llm_context_with_instructions`  
**Moduł / funkcja:** `TranscriptionTaskService.buildLLMContext` (pośrednio przez processTask)  
**Cel testu:** Weryfikacja budowy kontekstu dla LLM z instrukcjami ekstrakcji  
**Wejście / dane testowe:** GroupContext i currentUserId  
**Setup / izolacja:** Wywołaj przez processTask lub testuj prywatną metodę bezpośrednio  
**Kroki testowe:** Arrange - setup context, Act - buildLLMContext, Assert - sprawdź zawartość kontekstu  
**Oczekiwany rezultat:** Context zawiera grupę, członków, waluty, instrukcje ekstrakcji i przykłady  
**Priorytet:** średni  
**Edge cases:** Current user not in members list, empty currencies  
**Notatki / uwagi:** Testuje prompt engineering dla LLM

### UT-HELPER-CONFIDENCE-001
**Nazwa testu:** `should_calculate_high_confidence_for_complete_expense_data`  
**Moduł / funkcja:** `TranscriptionTaskService.calculateHeuristicConfidence` (pośrednio przez processTask)  
**Cel testu:** Weryfikacja wysokiej pewności dla kompletnych danych wydatku  
**Wejście / dane testowe:** Expense data z description, amount, currency, date, payer, splits (sum correct)  
**Setup / izolacja:** Wywołaj przez processTask lub testuj prywatną metodę bezpośrednio  
**Kroki testowe:** Arrange - setup complete data, Act - calculateHeuristicConfidence, Assert - sprawdź score >= 0.8  
**Oczekiwany rezultat:** Confidence score bliski 1.0 dla kompletnych danych z poprawnymi splits  
**Priorytet:** średni  
**Edge cases:** Perfect splits sum, splits with rounding differences  
**Notatki / uwagi:** Testuje confidence calculation logic

### UT-HELPER-CONFIDENCE-002
**Nazwa testu:** `should_calculate_medium_confidence_for_basic_expense_data`  
**Moduł / funkcja:** `TranscriptionTaskService.calculateHeuristicConfidence`  
**Cel testu:** Weryfikacja średniej pewności dla podstawowych danych  
**Wejście / dane testowe:** Expense data tylko z description i amount  
**Setup / izolacja:** Testuj prywatną metodę bezpośrednio  
**Kroki testowe:** Arrange - setup minimal data, Act - calculateHeuristicConfidence, Assert - sprawdź score ~0.7  
**Oczekiwany rezultat:** Base score 0.5 + 0.2 = 0.7 dla wymaganych pól  
**Priorytet:** niski  
**Edge cases:** Amount = 0, empty description  
**Notatki / uwagi:** Testuje confidence dla minimalnych danych

### UT-HELPER-CONFIDENCE-003
**Nazwa testu:** `should_apply_penalty_for_incorrect_splits_sum`  
**Moduł / funkcja:** `TranscriptionTaskService.calculateHeuristicConfidence`  
**Cel testu:** Weryfikacja kary za niepoprawną sumę splits  
**Wejście / dane testowe:** Expense amount: 100, splits sum: 80 (20% różnica)  
**Setup / izolacja:** Testuj prywatną metodę bezpośrednio  
**Kroki testowe:** Arrange - setup incorrect splits, Act - calculateHeuristicConfidence, Assert - sprawdź obniżony score  
**Oczekiwany rezultat:** Score zmniejszony o 0.15 za znaczną różnicę w sumie  
**Priorytet:** niski  
**Edge cases:** Splits sum > amount, splits sum slightly off  
**Notatki / uwagi:** Testuje validation logic dla splits

## Custom Error Classes

### UT-ERROR-001
**Nazwa testu:** `should_create_task_not_found_error_with_task_id`  
**Moduł / funkcja:** TaskNotFoundError constructor  
**Cel testu:** Weryfikacja tworzenia custom error dla nieistniejącego zadania  
**Wejście / dane testowe:** `taskId: "missing-task-123"`  
**Setup / izolacja:** Brak (czysta klasa)  
**Kroki testowe:** Arrange - nic, Act - new TaskNotFoundError(taskId), Assert - sprawdź message i name  
**Oczekiwany rezultat:** Error z name="TaskNotFoundError" i message zawierającą taskId  
**Priorytet:** niski  
**Edge cases:** Empty taskId, special characters in taskId  
**Notatki / uwagi:** Testuje custom error class instantiation

### UT-ERROR-002
**Nazwa testu:** `should_create_task_processing_error_with_code_and_message`  
**Moduł / funkcja:** TaskProcessingError constructor  
**Cel testu:** Weryfikacja tworzenia error z kodem i wiadomością  
**Wejście / dane testowe:** `message: "Processing failed"`, `code: "WHISPER_ERROR"`  
**Setup / izolacja:** Brak (czysta klasa)  
**Kroki testowe:** Arrange - nic, Act - new TaskProcessingError(message, code), Assert - sprawdź properties  
**Oczekiwany rezultat:** Error z name="TaskProcessingError", message i code property  
**Priorytet:** niski  
**Edge cases:** Empty code, long message  
**Notatki / uwagi:** Testuje custom error class z dodatkowymi properties

## Summary

Najważniejsze moduły do pokrycia unit testami to:
1. **Processing Pipeline** (`processTask`) - główna logika biznesowa wymagająca kompleksowego testowania integracji z zewnętrznymi serwisami
2. **Task Management** (`createTask`, `getTask`, `completeTask`, `failTask`) - krytyczne operacje CRUD na zadaniach z obsługą błędów
3. **Group Context** (`getGroupContext`) - dostęp do danych grupy z kontrolą uprawnień i walidacją

Te moduły mają najwyższy priorytet ze względu na złożoność logiki, interakcje z bazą danych i zewnętrzne zależności.
