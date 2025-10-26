# Password Reset Service - Unit Test Cases

## validateAndEstablishSession

### UT-PRS-VAES-001
**Nazwa testu:** should_return_success_when_valid_session_tokens_provided  
**Moduł / funkcja:** PasswordResetService.validateAndEstablishSession  
**Cel testu:** Weryfikacja poprawnego ustawiania sesji przy użyciu accessToken i refreshToken  
**Wejście / dane testowe:** tokens = { accessToken: "valid_access_token", refreshToken: "valid_refresh_token" }  
**Setup / izolacja:** Mock supabase.auth.setSession() aby zwracał { error: null }  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj validateAndEstablishSession z tokenami; Assert: Sprawdź czy zwrócono { success: true }  
**Oczekiwany rezultat:** { success: true }  
**Priorytet:** wysoki  
**Edge cases:** Brak accessToken (tylko refreshToken), pusty accessToken  
**Notatki / uwagi:** Testuje priorytetową ścieżkę dla hosted session flow  

### UT-PRS-VAES-002
**Nazwa testu:** should_return_error_when_setSession_fails  
**Moduł / funkcja:** PasswordResetService.validateAndEstablishSession  
**Cel testu:** Weryfikacja obsługi błędu podczas ustawiania sesji  
**Wejście / dane testowe:** tokens = { accessToken: "invalid_access_token", refreshToken: "invalid_refresh_token" }  
**Setup / izolacja:** Mock supabase.auth.setSession() aby rzucał AuthError  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj validateAndEstablishSession z tokenami; Assert: Sprawdź czy zwrócono { success: false, error: "wiadomość błędu" }  
**Oczekiwany rezultat:** { success: false, error: przetworzona wiadomość błędu przez getAuthErrorMessage }  
**Priorytet:** wysoki  
**Edge cases:** Network timeout, invalid token format  
**Notatki / uwagi:** Testuje obsługę błędów z Supabase  

### UT-PRS-VAES-003
**Nazwa testu:** should_return_error_when_no_valid_token_provided  
**Moduł / funkcja:** PasswordResetService.validateAndEstablishSession  
**Cel testu:** Weryfikacja walidacji obecności tokenu  
**Wejście / dane testowe:** tokens = {} (pusty obiekt)  
**Setup / izolacja:** Brak mockowania potrzebne  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService; Act: Wywołaj validateAndEstablishSession z pustymi tokenami; Assert: Sprawdź czy zwrócono błąd o braku tokenu  
**Oczekiwany rezultat:** { success: false, error: "Brak prawidłowego tokenu resetowania hasła" }  
**Priorytet:** wysoki  
**Edge cases:** token = null, tokenHash = undefined  
**Notatki / uwagi:** Testuje early return dla nieprawidłowych danych wejściowych  

### UT-PRS-VAES-004
**Nazwa testu:** should_verify_pkce_token_successfully  
**Moduł / funkcja:** PasswordResetService.validateAndEstablishSession  
**Cel testu:** Weryfikacja obsługi PKCE tokenów zaczynających się od "pkce_"  
**Wejście / dane testowe:** tokens = { token: "pkce_valid_token_hash" }  
**Setup / izolacja:** Mock supabase.auth.verifyOtp() aby zwracał { error: null } dla type: "recovery"  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj validateAndEstablishSession z PKCE tokenem; Assert: Sprawdź czy wywołano verifyOtp z prawidłowym token_hash  
**Oczekiwany rezultat:** { success: true }  
**Priorytet:** średni  
**Edge cases:** PKCE token bez prefixu "pkce_", tokenHash zamiast token  
**Notatki / uwagi:** Testuje specyficzną logikę rozpoznawania PKCE tokenów  

### UT-PRS-VAES-005
**Nazwa testu:** should_verify_regular_token_successfully  
**Moduł / funkcja:** PasswordResetService.validateAndEstablishSession  
**Cel testu:** Weryfikacja obsługi zwykłych tokenów hash  
**Wejście / dane testowe:** tokens = { tokenHash: "regular_token_hash" }  
**Setup / izolacja:** Mock supabase.auth.verifyOtp() aby zwracał { error: null } dla type: "recovery"  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj validateAndEstablishSession z regular tokenem; Assert: Sprawdź czy wywołano verifyOtp z prawidłowym token_hash  
**Oczekiwany rezultat:** { success: true }  
**Priorytet:** średni  
**Edge cases:** Zarówno token jak i tokenHash podane (priorytet token), nieprawidłowy format hash  
**Notatki / uwagi:** Testuje standardową ścieżkę weryfikacji tokenów  

### UT-PRS-VAES-006
**Nazwa testu:** should_return_error_when_verifyOtp_fails  
**Moduł / funkcja:** PasswordResetService.validateAndEstablishSession  
**Cel testu:** Weryfikacja obsługi błędu podczas weryfikacji OTP  
**Wejście / dane testowe:** tokens = { token: "invalid_token_hash" }  
**Setup / izolacja:** Mock supabase.auth.verifyOtp() aby rzucał AuthError  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj validateAndEstablishSession z nieprawidłowym tokenem; Assert: Sprawdź czy zwrócono przetworzony błąd  
**Oczekiwany rezultat:** { success: false, error: przetworzona wiadomość błędu przez getAuthErrorMessage }  
**Priorytet:** wysoki  
**Edge cases:** Expired token, malformed token  
**Notatki / uwagi:** Testuje obsługę błędów w ścieżce OTP  

### UT-PRS-VAES-007
**Nazwa testu:** should_handle_unexpected_exception  
**Moduł / funkcja:** PasswordResetService.validateAndEstablishSession  
**Cel testu:** Weryfikacja obsługi nieoczekiwanych wyjątków  
**Wejście / dane testowe:** tokens = { accessToken: "any_token", refreshToken: "any_token" }  
**Setup / izolacja:** Mock supabase.auth.setSession() aby rzucał nieoczekiwany błąd (nie AuthError)  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj validateAndEstablishSession; Assert: Sprawdź czy błąd został obsłużony przez getAuthErrorMessage  
**Oczekiwany rezultat:** { success: false, error: przetworzona wiadomość błędu przez getAuthErrorMessage }  
**Priorytet:** niski  
**Edge cases:** Network errors, Supabase service unavailable  
**Notatki / uwagi:** Testuje catch block dla nieoczekiwanych błędów  

## updatePassword

### UT-PRS-UP-001
**Nazwa testu:** should_update_password_and_sign_out_successfully  
**Moduł / funkcja:** PasswordResetService.updatePassword  
**Cel testu:** Weryfikacja kompletnego flow aktualizacji hasła z wylogowaniem  
**Wejście / dane testowe:** newPassword = "ValidPassword123!"  
**Setup / izolacja:** Mock supabase.auth.updateUser() i supabase.auth.signOut() aby zwracały { error: null }  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj updatePassword z nowym hasłem; Assert: Sprawdź czy zwrócono { success: true } i czy signOut został wywołany  
**Oczekiwany rezultat:** { success: true }, signOut wywołany dokładnie raz  
**Priorytet:** wysoki  
**Edge cases:** Hasło bez znaków specjalnych, bardzo długie hasło  
**Notatki / uwagi:** Testuje główną ścieżkę sukcesu z wymaganym signOut dla bezpieczeństwa  

### UT-PRS-UP-002
**Nazwa testu:** should_return_error_when_updateUser_fails  
**Moduł / funkcja:** PasswordResetService.updatePassword  
**Cel testu:** Weryfikacja obsługi błędu podczas aktualizacji hasła  
**Wejście / dane testowe:** newPassword = "weak_password"  
**Setup / izolacja:** Mock supabase.auth.updateUser() aby rzucał AuthError  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj updatePassword; Assert: Sprawdź czy zwrócono błąd i czy signOut nie został wywołany  
**Oczekiwany rezultat:** { success: false, error: przetworzona wiadomość błędu przez getAuthErrorMessage }, signOut nie wywołany  
**Priorytet:** wysoki  
**Edge cases:** Password policy violation, user not authenticated  
**Notatki / uwagi:** Testuje że signOut nie jest wykonywany przy błędzie aktualizacji  

### UT-PRS-UP-003
**Nazwa testu:** should_handle_exception_during_signOut  
**Moduł / funkcja:** PasswordResetService.updatePassword  
**Cel testu:** Weryfikacja zachowania gdy updateUser się powiedzie ale signOut zawiedzie  
**Wejście / dane testowe:** newPassword = "ValidPassword123!"  
**Setup / izolacja:** Mock updateUser() success, signOut() rzuca wyjątek  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj updatePassword; Assert: Sprawdź czy zwrócono success pomimo błędu signOut  
**Oczekiwany rezultat:** { success: true } (signOut failure nie wpływa na wynik)  
**Priorytet:** średni  
**Edge cases:** Network issues during signOut, session already expired  
**Notatki / uwagi:** Testuje że błąd signOut nie psuje pozytywnego wyniku aktualizacji hasła  

### UT-PRS-UP-004
**Nazwa testu:** should_handle_unexpected_exception  
**Moduł / funkcja:** PasswordResetService.updatePassword  
**Cel testu:** Weryfikacja obsługi nieoczekiwanych wyjątków w całym flow  
**Wejście / dane testowe:** newPassword = "ValidPassword123!"  
**Setup / izolacja:** Mock supabase.auth.updateUser() aby rzucał nieoczekiwany błąd (nie AuthError)  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj updatePassword; Assert: Sprawdź czy błąd został obsłużony przez getAuthErrorMessage  
**Oczekiwany rezultat:** { success: false, error: przetworzona wiadomość błędu przez getAuthErrorMessage }  
**Priorytet:** niski  
**Edge cases:** Supabase service unavailable, network timeout  
**Notatki / uwagi:** Testuje catch block dla nieoczekiwanych błędów  

## requestPasswordReset

### UT-PRS-RPR-001
**Nazwa testu:** should_request_reset_in_development_environment  
**Moduł / funkcja:** PasswordResetService.requestPasswordReset  
**Cel testu:** Weryfikacja generowania prawidłowego redirect URL w środowisku deweloperskim  
**Wejście / dane testowe:** email = "user@example.com", import.meta.env.DEV = true  
**Setup / izolacja:** Mock supabase.auth.resetPasswordForEmail(), window.location.origin nie używany  
**Kroki testowe:** Arrange: Ustaw środowisko DEV, utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj requestPasswordReset z emailem; Assert: Sprawdź czy resetPasswordForEmail wywołany z localhost URL  
**Oczekiwany rezultat:** { success: true }, redirectTo = "http://localhost:3000/auth/recovery"  
**Priorytet:** wysoki  
**Edge cases:** import.meta.env.DEV = false, niestandardowy port localhost  
**Notatki / uwagi:** Testuje logikę warunkową dla środowiska development  

### UT-PRS-RPR-002
**Nazwa testu:** should_request_reset_in_production_environment  
**Moduł / funkcja:** PasswordResetService.requestPasswordReset  
**Cel testu:** Weryfikacja generowania prawidłowego redirect URL w środowisku produkcyjnym  
**Wejście / dane testowe:** email = "user@example.com", import.meta.env.DEV = false, window.location.origin = "https://app.example.com"  
**Setup / izolacja:** Mock supabase.auth.resetPasswordForEmail(), window.location.origin  
**Kroki testowe:** Arrange: Ustaw środowisko PROD, mock window.location.origin, utwórz instancję PasswordResetService; Act: Wywołaj requestPasswordReset; Assert: Sprawdź czy resetPasswordForEmail wywołany z pełnym URL produkcyjnym  
**Oczekiwany rezultat:** { success: true }, redirectTo = "https://app.example.com/auth/recovery"  
**Priorytet:** wysoki  
**Edge cases:** HTTP vs HTTPS, subdomain handling  
**Notatki / uwagi:** Testuje produkcyjną ścieżkę generowania URL  

### UT-PRS-RPR-003
**Nazwa testu:** should_return_error_when_resetPasswordForEmail_fails  
**Moduł / funkcja:** PasswordResetService.requestPasswordReset  
**Cel testu:** Weryfikacja obsługi błędu podczas wysyłania żądania resetowania  
**Wejście / dane testowe:** email = "invalid@example.com"  
**Setup / izolacja:** Mock supabase.auth.resetPasswordForEmail() aby rzucał AuthError  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj requestPasswordReset z nieprawidłowym emailem; Assert: Sprawdź czy zwrócono przetworzony błąd  
**Oczekiwany rezultat:** { success: false, error: przetworzona wiadomość błędu przez getAuthErrorMessage }  
**Priorytet:** wysoki  
**Edge cases:** Invalid email format, user not found, rate limiting  
**Notatki / uwagi:** Testuje obsługę błędów z Supabase resetPasswordForEmail  

### UT-PRS-RPR-004
**Nazwa testu:** should_handle_unexpected_exception  
**Moduł / funkcja:** PasswordResetService.requestPasswordReset  
**Cel testu:** Weryfikacja obsługi nieoczekiwanych wyjątków  
**Wejście / dane testowe:** email = "user@example.com"  
**Setup / izolacja:** Mock supabase.auth.resetPasswordForEmail() aby rzucał nieoczekiwany błąd (nie AuthError)  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj requestPasswordReset; Assert: Sprawdź czy błąd został obsłużony przez getAuthErrorMessage  
**Oczekiwany rezultat:** { success: false, error: przetworzona wiadomość błędu przez getAuthErrorMessage }  
**Priorytet:** niski  
**Edge cases:** Network errors, Supabase service unavailable  
**Notatki / uwagi:** Testuje catch block dla nieoczekiwanych błędów  

### UT-PRS-RPR-005
**Nazwa testu:** should_validate_email_parameter  
**Moduł / funkcja:** PasswordResetService.requestPasswordReset  
**Cel testu:** Weryfikacja przekazywania email do Supabase  
**Wejście / dane testowe:** email = "test@domain.com"  
**Setup / izolacja:** Mock supabase.auth.resetPasswordForEmail() success  
**Kroki testowe:** Arrange: Utwórz instancję PasswordResetService z zamockowanym supabase; Act: Wywołaj requestPasswordReset z emailem; Assert: Sprawdź czy email został przekazany do resetPasswordForEmail  
**Oczekiwany rezultat:** resetPasswordForEmail wywołany z prawidłowym emailem i redirectTo  
**Priorytet:** średni  
**Edge cases:** Empty email, malformed email, very long email  
**Notatki / uwagi:** Testuje że parametr email jest prawidłowo przekazywany do Supabase  

## Podsumowanie

Najważniejsze moduły do pokrycia unit testami to:
- `validateAndEstablishSession` - najbardziej złożona metoda z wieloma ścieżkami wykonania i priorytetami tokenów
- `updatePassword` - krytyczna dla bezpieczeństwa operacja wymagająca testowania kompletnego flow z signOut
- `requestPasswordReset` - kluczowa metoda inicjalizacji resetowania hasła z logiką środowiskową
