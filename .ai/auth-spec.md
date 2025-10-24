# Specyfikacja Systemu Autentykacji - Billzilla

## 1. WYMAGANIA FUNKCJONALNE

### US-001: Rejestracja i logowanie przez e-mail/hasło

**Opis:** Użytkownicy mogą tworzyć konta i logować się używając adresu e-mail i hasła.

**Akceptacja:**
- Strona `/signup` zawiera formularz rejestracji z polami: nazwa użytkownika, e-mail, hasło, potwierdzenie hasła
- Strona `/login` zawiera formularz logowania z polami: e-mail, hasło
- Hasło musi mieć minimum 8 znaków, zawierać cyfry i litery
- Po rejestracji wysyłany jest e-mail weryfikacyjny
- Użytkownik musi potwierdzić e-mail przed pełnym dostępem do aplikacji
- Formularze walidują dane w czasie rzeczywistym z przyjaznymi komunikatami błędów

### US-001a: Logowanie przez Google OAuth

**Opis:** Użytkownicy mogą logować się używając konta Google.

**Akceptacja:**
- Przycisk "Kontynuuj z Google" dostępny na stronach `/login` i `/signup`
- Proces OAuth przekierowuje na Google do uwierzytelnienia
- Po pomyślnym logowaniu użytkownik zostaje automatycznie zarejestrowany (jeśli konto nie istnieje)
- Nie wymaga dodatkowej weryfikacji e-maila

### US-001b: Resetowanie hasła

**Opis:** Użytkownicy mogą resetować zapomniane hasło.

**Akceptacja:**
- Link "Zapomniałeś hasła?" na stronie logowania
- Formularz resetowania hasła akceptuje adres e-mail
- Wysyłany jest bezpieczny link resetujący hasło
- Link prowadzi do formularza ustawiania nowego hasła
- Nowe hasło musi spełniać te same wymagania co przy rejestracji

### US-001c: Ochrona dostępu

**Opis:** System chroni wrażliwe części aplikacji przed dostępem niezalogowanych użytkowników.

**Akceptacja:**
- Strony publiczne: `/login`, `/signup`, `/reset-password`, `/about`
- Wszystkie pozostałe strony wymagają aktywnej sesji
- Próba dostępu bez logowania przekierowuje na `/login`
- Po zalogowaniu użytkownik zostaje przekierowany na pierwotnie żądaną stronę
- System waliduje redirect URL dla bezpieczeństwa (Open Redirect protection)

## 2. WYMAGANIA NIEFUNKCJONALNE

### Bezpieczeństwo

- Hasła są bezpiecznie hashowane (bcrypt)
- Sesje zarządzane przez bezpieczne HTTP-only cookies
- Automatyczne odświeżanie tokenów JWT (1 godzina życia)
- Ochrona przed atakami: CSRF, XSS, SQL injection, brute force
- Walidacja wszystkich redirect URL (tylko wewnętrzne ścieżki)
- Row-Level Security (RLS) w bazie danych
- Rate limiting na poziomie API

### Dostępność (WCAG)

- Wszystkie formularze dostępne z klawiatury
- Semantyczny HTML z odpowiednimi etykietami
- Komunikaty błędów ogłaszane przez czytniki ekranu
- Focus indicators widoczne dla wszystkich elementów interaktywnych
- Kontrast kolorów spełnia standardy WCAG AA

### Doświadczenie użytkownika (UX)

- Responsywny design (mobile-first)
- Natychmiastowa walidacja formularzy
- Przyjazne komunikaty błędów w języku polskim
- Loading states podczas wszystkich operacji asynchronicznych
- Success feedback po pomyślnych akcjach
- Spójny branding zgodny z Billzilla UI Guidelines

## 3. MAPA PODRÓŻY UŻYTKOWNIKA

### Scenariusz główny: Pierwszy użytkownik

1. **Odkrycie aplikacji** - Użytkownik trafia na stronę `/about`
2. **Rejestracja** - Wybiera rejestrację przez e-mail lub Google
3. **Weryfikacja** - Potwierdza adres e-mail (tylko dla rejestracji e-mail)
4. **Pierwsze logowanie** - Loguje się do aplikacji
5. **Pusty stan** - Widzi zachęte do utworzenia pierwszej grupy
6. **Eksploracja** - Rozpoczyna używanie funkcji aplikacji

### Scenariusz: Resetowanie hasła

1. **Próba logowania** - Użytkownik próbuje się zalogować
2. **Zapomniane hasło** - Klika link "Zapomniałeś hasła?"
3. **Żądanie resetu** - Podaje adres e-mail
4. **Otrzymanie linku** - Klika w link z e-maila
5. **Nowe hasło** - Ustawia nowe hasło
6. **Logowanie** - Loguje się z nowym hasłem

### Scenariusz: Ochrona dostępu

1. **Bezpośredni dostęp** - Użytkownik próbuje wejść na chronioną stronę
2. **Przekierowanie** - Zostaje przekierowany na `/login`
3. **Logowanie** - Loguje się z danymi
4. **Powrót** - Zostaje automatycznie przekierowany na pierwotnie żądaną stronę

## 4. ARCHITEKTURA SYSTEMU

### Struktura stron

- **`/login`** - Logowanie przez e-mail/hasło lub Google OAuth
- **`/signup`** - Rejestracja nowego użytkownika
- **`/reset-password`** - Resetowanie hasła
- **`/auth/confirm`** - Potwierdzenie adresu e-mail
- **`/auth/callback`** - Callback OAuth Google
- **`/about`** - Publiczna strona informacyjna

### Flow autentykacji

#### Rejestracja e-mail/hasło

1. Użytkownik wypełnia formularz rejestracji
2. Walidacja danych po stronie klienta
3. Wysyłanie żądania rejestracji do Supabase Auth
4. Otrzymanie e-maila weryfikacyjnego
5. Kliknięcie w link weryfikacyjny
6. Automatyczne utworzenie profilu użytkownika
7. Przekierowanie na dashboard

#### Logowanie

1. Użytkownik wypełnia formularz logowania
2. Walidacja danych po stronie klienta
3. Wysyłanie żądania logowania do Supabase Auth
4. Utworzenie sesji JWT
5. Przekierowanie na dashboard lub stronę docelową

#### Google OAuth

1. Użytkownik klika przycisk Google
2. Przekierowanie na Google OAuth
3. Uwierzytelnienie przez Google
4. Callback z kodem autoryzacyjnym
5. Wymiana kodu na tokeny JWT
6. Utworzenie profilu (jeśli nowy użytkownik)
7. Przekierowanie na dashboard

#### Resetowanie hasła

1. Użytkownik podaje adres e-mail
2. Wysyłanie linku resetującego przez Supabase
3. Kliknięcie w link resetujący
4. Ustawienie nowego hasła
5. Aktualizacja hasła w Supabase Auth
6. Przekierowanie na stronę logowania

## 5. ZGODNOŚĆ Z BILLZILLA UI GUIDELINES

Wszystkie komponenty autentykacji muszą być zgodne z brandingiem Billzilla:

### Paleta kolorów

- **Primary:** #49A067 (zielony)
- **Background:** #F9FAF8 (jasny)
- **Foreground:** #0C2231 (ciemny)
- **Błędy:** czerwień dla komunikatów błędów

### Komponenty

- **Formularze:** Zaokrąglone rogi (rounded-xl), białe tło z subtelnym cieniem
- **Przyciski:** Zielone dla akcji głównych, szare dla dodatkowych
- **Linki:** Zielone z efektami hover
- **Responsywność:** Mobile-first approach

### Typografia

- **Nagłówki:** font-bold tracking-tight
- **Treść:** czytelna, hierarchiczna
- **Komunikaty błędów:** czerwone, wyraźnie widoczne

## 6. BEZPIECZEŃSTWO

### Ochrona przed atakami

- **Open Redirect Protection:** Walidacja wszystkich redirect URL
- **CSRF Protection:** SameSite cookies
- **XSS Protection:** Escapowanie danych wejściowych
- **SQL Injection:** Parametryzowane zapytania
- **Brute Force:** Rate limiting i blokada kont

### Zarządzanie sesjami

- **JWT Tokens:** Krótkie życie (1 godzina) z automatycznym odświeżaniem
- **HTTP-only Cookies:** Bezpieczne przechowywanie tokenów
- **Secure Flags:** Wymuszanie HTTPS w produkcji

### Walidacja danych

- **Po stronie klienta:** Natychmiastowa walidacja z przyjaznymi komunikatami
- **Po stronie serwera:** Dodatkowa walidacja dla bezpieczeństwa
- **Sanityzacja:** Czyszczenie danych wejściowych

---

*Szczegóły implementacyjne znajdują się w dokumentach:*
- `.ai/endpoint-plan/auth-implementation-plan.md` - Szczegóły techniczne
- `.ai/ui-plan/auth-ui-implementation-plan.md` - Szczegóły UI
