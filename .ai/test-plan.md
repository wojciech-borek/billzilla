Jasne, oto zaktualizowana wersja planu testów, która uwzględnia Twoje uwagi dotyczące wyboru konkretnych narzędzi i uszczegółowienia ich konfiguracji.

---

# Zaktualizowany Plan Testów dla Aplikacji "Billzilla"

---

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie

Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji **Billzilla**, przeznaczonej do zarządzania wydatkami grupowymi. Aplikacja oparta jest na nowoczesnym stosie technologicznym, w skład którego wchodzą m.in. Astro, React, Supabase oraz usługi AI (OpenRouter) do transkrypcji mowy na dane. Celem planu jest zapewnienie systematycznego podejścia do weryfikacji jakości, funkcjonalności, niezawodności i bezpieczeństwa aplikacji przed jej wdrożeniem produkcyjnym.

### 1.2. Cele testowania

Główne cele procesu testowania to:

- **Weryfikacja funkcjonalna:** Upewnienie się, że wszystkie funkcje aplikacji działają zgodnie ze specyfikacją, w szczególności kluczowe procesy takie jak uwierzytelnianie, zarządzanie grupami, dodawanie wydatków (manualne i głosowe) oraz obliczanie sald.
- **Zapewnienie niezawodności:** Identyfikacja i eliminacja błędów, które mogłyby prowadzić do nieprawidłowego działania aplikacji, utraty danych lub negatywnego doświadczenia użytkownika.
- **Walidacja integralności danych:** Potwierdzenie, że wszystkie operacje finansowe są poprawnie zapisywane w bazie danych, a salda użytkowników są kalkulowane bezbłędnie.
- **Ocena bezpieczeństwa:** Sprawdzenie, czy dane użytkowników są odpowiednio chronione, a dostęp do grup i wydatków jest ograniczony wyłącznie do autoryzowanych osób.
- **Weryfikacja użyteczności (UX/UI):** Zapewnienie, że interfejs użytkownika jest intuicyjny, responsywny i spójny na różnych urządzeniach i przeglądarkach.
- **Ocena funkcjonalności AI:** Sprawdzenie skuteczności i dokładności mechanizmu transkrypcji mowy na dane wydatku oraz odporności na różnorodne scenariusze i błędy.

---

## 2. Zakres testów

### 2.1. Funkcjonalności objęte testami

Testom poddane zostaną następujące moduły i funkcjonalności aplikacji:

- **Moduł uwierzytelniania:**
  - Rejestracja nowego użytkownika (formularz email/hasło).
  - Potwierdzenie adresu e-mail.
  - Logowanie (email/hasło oraz Google OAuth).
  - Wylogowywanie.
  - Proces resetowania hasła.
  - Obsługa sesji użytkownika.
- **Panel główny (Dashboard):**
  - Wyświetlanie listy grup z poprawnymi saldami.
  - Wyświetlanie i obsługa zaproszeń do grup.
  - Funkcjonalność "pull-to-refresh".
  - Nieskończone przewijanie (infinite scroll) dla listy grup.
  - Obsługa stanów pustych i błędów ładowania danych.
- **Zarządzanie grupami:**
  - Tworzenie nowej grupy (z zaproszeniami i bez).
  - Wyświetlanie szczegółów grupy (członkowie, waluty, oczekujące zaproszenia).
  - Zapraszanie nowych członków do istniejącej grupy.
  - Zarządzanie walutami w grupie (dodawanie, aktualizacja kursu).
- **Zarządzanie wydatkami:**
  - Dodawanie nowego wydatku za pomocą formularza.
  - Walidacja danych w formularzu wydatku.
  - Podział wydatku na uczestników (równy i niestandardowy).
  - Obsługa wielu walut i przeliczanie na walutę bazową.
- **Transkrypcja mowy na wydatek (funkcja AI):**
  - Proces nagrywania głosu (inicjacja, zatrzymanie, anulowanie).
  - Obsługa uprawnień do mikrofonu.
  - Proces wysyłania nagrania i śledzenia statusu przetwarzania (polling).
  - Poprawność wypełnienia formularza na podstawie danych z AI.
  - Obsługa stanów błędu (np. błąd API, niska jakość transkrypcji, timeout).
- **Obliczanie sald i rozliczenia:**
  - Poprawność kalkulacji sald dla poszczególnych członków grupy.
  - Tworzenie i wyświetlanie rozliczeń (settlements).
  - Wpływ rozliczeń na ogólne saldo użytkowników.

### 2.2. Funkcjonalności wyłączone z testów

- Testy wydajnościowe infrastruktury firm trzecich (Supabase, OpenRouter).
- Testy penetracyjne wykraczające poza standardowe sprawdzenie podatności (np. SQL Injection, XSS, CSRF).
- Kompatybilność z przestarzałymi przeglądarkami (np. Internet Explorer).

---

## 3. Typy testów do przeprowadzenia

W celu zapewnienia kompleksowego pokrycia testowego, przeprowadzone zostaną następujące rodzaje testów:

- **Testy jednostkowe (Unit Tests):** Weryfikacja poszczególnych funkcji, komponentów i hooków w izolacji. Skupią się na logice biznesowej w serwisach (`/lib/services`), funkcjach pomocniczych (`/lib/utils`), schematach walidacji (`/lib/schemas`) oraz logice wewnątrz hooków Reactowych (`/lib/hooks`).
- **Testy integracyjne (Integration Tests):** Sprawdzenie współpracy pomiędzy różnymi częściami systemu.
  - **Integracja komponentów:** Testowanie interakcji między komponentami frontendu (np. formularz wydatku i jego podkomponenty).
  - **Integracja Frontend-Backend:** Testowanie komunikacji między aplikacją kliencką a API (`/pages/api`), weryfikacja poprawności wysyłanych żądań i przetwarzania odpowiedzi.
- **Testy End-to-End (E2E):** Symulacja kompletnych scenariuszy użytkownika w przeglądarce, odzwierciedlająca rzeczywiste interakcje. Obejmą one pełne ścieżki, np. od rejestracji po dodanie wydatku i weryfikację salda.
- **Testy API:** Bezpośrednie testowanie punktów końcowych API w celu weryfikacji logiki serwerowej, autoryzacji, walidacji danych wejściowych i formatu odpowiedzi. Testy te będą realizowane przy użyciu wbudowanych w **Playwright** możliwości testowania API, co pozwoli na efektywne łączenie testów UI z bezpośrednimi wywołaniami API (np. do przygotowania danych testowych).
- **Testy manualne eksploracyjne:** Ręczne testowanie aplikacji w celu znalezienia błędów, które mogły zostać pominięte w testach automatycznych. Szczególny nacisk zostanie położony na użyteczność (UX) i obsługę nietypowych przypadków.
- **Testy kompatybilności (Cross-Browser Testing):** Weryfikacja poprawnego działania i wyświetlania aplikacji w najnowszych wersjach popularnych przeglądarek internetowych.
- **Testy responsywności (Responsive Design Testing):** Sprawdzenie, czy interfejs aplikacji poprawnie adaptuje się do różnych rozmiarów ekranu (desktop, tablet, mobile).
- **Testy bezpieczeństwa:** Podstawowa weryfikacja mechanizmów bezpieczeństwa, w tym:
  - Kontrola dostępu do danych (upewnienie się, że użytkownik widzi tylko swoje grupy i wydatki).
  - Ochrona endpointów API przed nieautoryzowanym dostępem.

---

## 4. Scenariusze testowe dla kluczowych funkcjonalności

Poniżej przedstawiono przykładowe scenariusze testowe dla najważniejszych obszarów aplikacji.

### 4.1. Moduł Uwierzytelniania

| ID          | Scenariusz                                                         | Oczekiwany rezultat                                                                |   Priorytet   |
| :---------- | :----------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :-----------: |
| **AUTH-01** | Rejestracja użytkownika z poprawnymi i unikalnymi danymi.          | Użytkownik zostaje zarejestrowany, otrzymuje e-mail z linkiem aktywacyjnym.        | **Krytyczny** |
| **AUTH-02** | Próba rejestracji z zajętym adresem e-mail.                        | Wyświetlony zostaje komunikat o błędzie informujący, że e-mail jest już w użyciu.  |  **Wysoki**   |
| **AUTH-03** | Logowanie przy użyciu poprawnych danych (email/hasło).             | Użytkownik zostaje zalogowany i przekierowany do panelu głównego.                  | **Krytyczny** |
| **AUTH-04** | Logowanie przy użyciu niepoprawnych danych.                        | Wyświetlony zostaje komunikat o błędzie "Nieprawidłowy login lub hasło".           |  **Wysoki**   |
| **AUTH-05** | Logowanie za pomocą konta Google.                                  | Użytkownik zostaje poprawnie uwierzytelniony i przekierowany do panelu głównego.   |  **Wysoki**   |
| **AUTH-06** | Proces resetowania hasła (żądanie linku, ustawienie nowego hasła). | Użytkownik pomyślnie zmienia hasło i może zalogować się przy użyciu nowych danych. |  **Wysoki**   |

### 4.2. Zarządzanie Grupami i Zaproszeniami

| ID         | Scenariusz                                                                | Oczekiwany rezultat                                                                                        |   Priorytet   |
| :--------- | :------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------- | :-----------: |
| **GRP-01** | Utworzenie nowej grupy bez zapraszania członków.                          | Grupa zostaje utworzona, a twórca jest jej jedynym członkiem z rolą "creator".                             | **Krytyczny** |
| **GRP-02** | Utworzenie nowej grupy z zaproszeniem istniejących i nowych użytkowników. | Grupa zostaje utworzona, istniejący użytkownicy są dodani, a nowi otrzymują zaproszenia.                   |  **Wysoki**   |
| **GRP-03** | Akceptacja zaproszenia do grupy.                                          | Użytkownik staje się członkiem grupy, a zaproszenie znika z jego panelu. Grupa pojawia się na liście grup. |  **Wysoki**   |
| **GRP-04** | Odrzucenie zaproszenia do grupy.                                          | Zaproszenie znika z panelu użytkownika. Użytkownik nie zostaje członkiem grupy.                            |  **Średni**   |

### 4.3. Zarządzanie Wydatkami (Formularz Manualny)

| ID         | Scenariusz                                                                    | Oczekiwany rezultat                                                                                            |   Priorytet   |
| :--------- | :---------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :-----------: |
| **EXP-01** | Dodanie wydatku z podziałem równym na wszystkich członków.                    | Wydatek zostaje dodany, a jego koszt jest równo podzielony. Salda członków zostają poprawnie zaktualizowane.   | **Krytyczny** |
| **EXP-02** | Dodanie wydatku z niestandardowym podziałem kwot.                             | Wydatek zostaje dodany, a salda są aktualizowane zgodnie z wprowadzonymi kwotami.                              |  **Wysoki**   |
| **EXP-03** | Próba dodania wydatku, gdzie suma podziałów nie zgadza się z kwotą całkowitą. | Formularz wyświetla błąd walidacji i uniemożliwia dodanie wydatku.                                             |  **Wysoki**   |
| **EXP-04** | Dodanie wydatku w walucie obcej.                                              | Wydatek zostaje dodany, a jego wartość jest poprawnie przeliczona na walutę bazową grupy przy obliczaniu sald. |  **Wysoki**   |

### 4.4. Transkrypcja Mowy na Wydatek (Funkcja AI)

| ID        | Scenariusz                                                                                      | Oczekiwany rezultat                                                                                                 |   Priorytet   |
| :-------- | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :-----------: |
| **AI-01** | Pomyślny scenariusz: czysta mowa, proste polecenie (np. "Obiad za 50 złotych dla mnie i Kasi"). | System poprawnie rozpoznaje opis, kwotę, walutę i uczestników, a następnie wypełnia formularz.                      | **Krytyczny** |
| **AI-02** | Odmowa dostępu do mikrofonu.                                                                    | Aplikacja wyświetla stosowny komunikat o błędzie i uniemożliwia nagrywanie.                                         |  **Wysoki**   |
| **AI-03** | Nagranie zbyt krótkie (poniżej 1 sekundy).                                                      | Wyświetlony zostaje komunikat o błędzie, a nagranie nie jest wysyłane.                                              |  **Średni**   |
| **AI-04** | Nagranie z szumem w tle lub niewyraźną mową.                                                    | System próbuje przetworzyć nagranie. Wynik może mieć niski `confidence score`, co powinno być zasygnalizowane w UI. |  **Wysoki**   |
| **AI-05** | Błąd po stronie API (np. usługa OpenRouter niedostępna).                                        | UI wyświetla komunikat o błędzie przetwarzania i umożliwia ponowienie próby.                                        |  **Wysoki**   |
| **AI-06** | Przekroczenie czasu oczekiwania na wynik (timeout).                                             | UI przerywa oczekiwanie, wyświetla komunikat o błędzie i umożliwia ponowienie próby.                                |  **Wysoki**   |

---

## 5. Środowisko testowe

- **Środowisko Staging:** Dedykowana instancja aplikacji wdrożona w środowisku zbliżonym do produkcyjnego. Połączona z oddzielną bazą danych Supabase (kopia struktury produkcyjnej, ale z danymi testowymi).
- **Przeglądarki Desktopowe:**
  - Google Chrome (najnowsza wersja)
  - Mozilla Firefox (najnowsza wersja)
  - Safari (najnowsza wersja na macOS)
  - Microsoft Edge (najnowsza wersja)
- **Urządzenia Mobilne:**
  - Emulator Androida (najnowsza wersja Chrome).
  - Emulator iOS (najnowsza wersja Safari).
  - Testy na urządzeniach fizycznych (rekomendowane przed wdrożeniem).
- **Dane testowe:** Przygotowany zestaw kont użytkowników, grup, członków i walut w celu umożliwienia spójnego i powtarzalnego testowania.

---

## 6. Narzędzia do testowania

Wybrano następujący, konkretny zestaw narzędzi w celu zapewnienia spójności i efektywności procesu testowania.

| Typ testów                              | Wybrane narzędzia                      |
| :-------------------------------------- | :------------------------------------- |
| **Testy jednostkowe i integracyjne**    | **Vitest** z **React Testing Library** |
| **Testy E2E i API**                     | **Playwright**                         |
| **Zarządzanie testami i błędami**       | **GitHub Issues & Projects**           |
| **Ciągła integracja (CI)**              | **GitHub Actions**                     |
| **Mockowanie API (testy komponentowe)** | **MSW (Mock Service Worker)**          |
| **Pokrycie kodu (Coverage)**            | **@vitest/coverage-v8**                |

### 6.1. Konfiguracja i Struktura Narzędzi Testowych

#### Vitest (Testy jednostkowe i komponentowe)

- **Konfiguracja:** Główny plik konfiguracyjny `vitest.config.ts` w katalogu głównym projektu będzie zawierał ustawienia środowiska testowego (np. `jsdom`), globalne setupy oraz konfigurację pokrycia kodu.
- **Struktura:** Testy będą umieszczane bezpośrednio obok testowanych modułów, zgodnie z konwencją `*.test.ts` lub `*.spec.tsx`. Taka kolokacja ułatwia utrzymanie i odnajdywanie testów.
  - Przykład: `src/lib/utils/formatCurrency.test.ts` będzie testować funkcję w `src/lib/utils.ts`.
  - Przykład: `src/components/auth/LoginForm.spec.tsx` będzie testować komponent `LoginForm`.
- **Zakres:** Testowane będą głównie funkcje pomocnicze (`/lib/utils`), hooki (`/lib/hooks`), serwisy (`/lib/services`), schematy walidacji (`/lib/schemas`) oraz izolowane komponenty React.

#### Playwright (Testy E2E i API)

- **Konfiguracja:** Plik `playwright.config.ts` zdefiniuje kluczowe parametry, takie jak:
  - Adres URL środowiska testowego (`baseURL`).
  - Przeglądarki do testów (Chromium, Firefox, WebKit).
  - Konfiguracja reporterów (np. HTML reporter do przeglądania wyników).
  - Strategia `trace` do nagrywania śladów po nieudanych testach.
- **Struktura:** Wszystkie testy E2E i API będą znajdować się w dedykowanym katalogu `/tests-e2e/` na najwyższym poziomie projektu, co zapewni ich separację od kodu źródłowego aplikacji.
  - `/tests-e2e/specs/`: Główne pliki z testami, podzielone tematycznie (np. `auth.spec.ts`, `group-creation.spec.ts`).
  - `/tests-e2e/poms/`: Implementacja wzorca Page Object Model. Każdy plik będzie reprezentował jedną stronę lub kluczowy komponent aplikacji (np. `LoginPage.ts`, `DashboardPage.ts`), hermetyzując selektory i akcje.
  - `/tests-e2e/fixtures/`: Dane testowe, takie jak dane logowania użytkowników, przykładowe dane grup itp.
  - `/tests-e2e/api-helpers/`: Funkcje pomocnicze do interakcji z API, używane do szybkiego przygotowania stanu aplikacji przed testem UI (np. tworzenie grupy przez API zamiast klikania w interfejsie).

### 6.2. Specjalne podejście do testowania funkcji AI

Funkcja transkrypcji głosowej wymaga szczególnego podejścia ze względu na integrację z zewnętrznym API (OpenRouter) i nieprzewidywalność wyników.

#### Strategie testowania:

**Testy jednostkowe (Vitest + MSW):**

- **Contract Testing:** Walidacja schematu odpowiedzi z OpenRouter API
- **Snapshot Testing:** Porównanie struktury zparsowanych danych z poprzednimi wersjami
- **Error Handling:** Mockowanie błędów API (timeout, 429 rate limit, 500, 503)
- **Confidence Score Logic:** Testowanie logiki obsługi niskiego confidence

**Testy E2E (Playwright):**

- **Fixture-based Testing:** Zestaw przykładowych nagrań audio (.webm) z oczekiwanymi rezultatami
  - `/tests-e2e/fixtures/audio/success-simple.webm` → oczekiwany wynik w JSON
  - `/tests-e2e/fixtures/audio/noisy-background.webm` → low confidence
  - `/tests-e2e/fixtures/audio/unclear-speech.webm` → błąd parsowania
- **Polling Mechanism:** Testowanie mechanizmu śledzenia statusu przetwarzania
- **Timeout Scenarios:** Weryfikacja obsługi długiego czasu oczekiwania

**Mockowanie w środowisku testowym:**

- Dla testów E2E na CI używamy mock'owanego endpointa `/api/transcription`
  z predefiniowanymi odpowiedziami (unikanie kosztów API i deterministyczne wyniki)

### 6.3. Nowoczesne praktyki testowe (2025)

- **Test-Driven Development (TDD):**
  - Obowiązkowy dla krytycznych funkcji finansowych (kalkulacja sald, settlements)
  - Zalecany dla services i złożonych hooków

- **Flaky Test Detection:**
  - Automatyczny retry failed tests 2x w CI przed uznaniem za fail
  - Monitoring i flagowanie niestabilnych testów

- **Parallel Test Execution:**
  - Playwright: 4 workery w CI, 2 lokalnie
  - Vitest: automatyczne wykorzystanie wszystkich CPU cores

- **Test Sharding:**
  - Długie E2E suite dzielone na 4 shardy wykonywane równolegle
  - `playwright test --shard=1/4`, `--shard=2/4`, etc.

- **Trace on Failure:**
  - Automatyczne nagrywanie Playwright traces przy błędach testów
  - Możliwość odtworzenia testu krok po kroku w Playwright Trace Viewer

- **Component Isolation:**
  - Testowanie komponentów UI w izolacji (Vitest + React Testing Library)
  - Mock'owanie wszystkich zależności zewnętrznych

- **Snapshot Testing:**
  - Dla stabilnych komponentów UI (np. Shadcn/ui customizacje)
  - Dla struktur danych z AI (odpowiedzi transkrypcji)

### 6.4. Dostępne komendy testowe

| Komenda                   | Opis                                   |
| :------------------------ | :------------------------------------- |
| `npm run test`            | Uruchom testy jednostkowe (watch mode) |
| `npm run test:run`        | Uruchom testy jednostkowe (single run) |
| `npm run test:ui`         | Vitest UI - interaktywny interface     |
| `npm run test:coverage`   | Generuj raport pokrycia kodu           |
| `npm run test:e2e`        | Uruchom wszystkie testy E2E (headless) |
| `npm run test:e2e:ui`     | Playwright UI - debugowanie testów     |
| `npm run test:e2e:headed` | E2E z widoczną przeglądarką            |
| `npm run test:e2e:debug`  | E2E w trybie debug (step-by-step)      |

---

## 7. Harmonogram testów

Testowanie będzie procesem ciągłym, zintegrowanym z cyklem rozwoju oprogramowania.

- **Testy jednostkowe i integracyjne:** Pisane przez deweloperów równolegle z implementacją nowych funkcji. Uruchamiane automatycznie w ramach CI przy każdym `push` do repozytorium.
- **Testy E2E:** Rozwijane przez inżynierów QA. Uruchamiane automatycznie w ramach CI przed każdym mergem do głównej gałęzi oraz cyklicznie (np. co noc) na środowisku stagingowym.
- **Testy manualne i eksploracyjne:** Przeprowadzane po wdrożeniu większych funkcjonalności na środowisko stagingowe.
- **Pełna regresja:** Przeprowadzana przed każdym wydaniem produkcyjnym w celu zapewnienia, że nowe zmiany nie zepsuły istniejących funkcjonalności.

---

## 8. Kryteria akceptacji testów

### 8.1. Kryteria wejścia (rozpoczęcia testów)

- Funkcjonalność została zaimplementowana i wdrożona na środowisku testowym.
- Testy jednostkowe i podstawowe testy integracyjne przechodzą pomyślnie.
- Dostępna jest dokumentacja techniczna lub opis funkcjonalności.

### 8.2. Kryteria wyjścia (zakończenia testów i akceptacji)

- **Pokrycie testami:** Osiągnięto zdefiniowany poziom pokrycia kodu testami automatycznymi (np. 80% dla testów jednostkowych).
- **Status testów:** 100% krytycznych i wysokich scenariuszy testowych zakończyło się powodzeniem.
- **Błędy:** Brak otwartych błędów o priorytecie krytycznym (blokujących). Liczba otwartych błędów o priorytecie wysokim jest zgodna z ustaleniami zespołu (np. zero).
- **Akceptacja:** Wszystkie kluczowe funkcjonalności zostały zweryfikowane i zaakceptowane przez Product Ownera.

### 8.2.1. Szczegółowe metryki pokrycia kodu:

- **Services (`/lib/services`):** > 90%
  - Logika biznesowa jest krytyczna, wymaga wysokiego pokrycia
- **Schemas (`/lib/schemas`):** 100%
  - Każda reguła walidacji musi być przetestowana
- **Utils (`/lib/utils`):** > 85%
  - Funkcje pomocnicze używane wszędzie
- **Hooks (`/lib/hooks`):** > 80%
  - Custom hooki muszą być dobrze przetestowane
- **Components:** > 70%
  - Komponenty UI (nie tylko logika renderowania)
- **Critical paths:**
  - Uwierzytelnianie: 100%
  - Kalkulacja sald: 100%
  - Operacje na wydatkach: 100%
  - Settlements: 100%

---

## 9. Role i odpowiedzialności

| Rola              | Odpowiedzialność                                                                                                                                                                                                                                 |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deweloperzy**   | - Implementacja funkcjonalności.<br>- Pisanie i utrzymanie testów jednostkowych i integracyjnych.<br>- Naprawa zgłoszonych błędów.<br>- Dbanie o jakość kodu i proces code review.                                                               |
| **Inżynier QA**   | - Tworzenie i utrzymanie planu testów.<br>- Projektowanie i automatyzacja scenariuszy E2E i API.<br>- Przeprowadzanie testów manualnych, eksploracyjnych i regresji.<br>- Raportowanie i weryfikacja błędów.<br>- Koordynacja procesu testowego. |
| **Product Owner** | - Definiowanie wymagań i kryteriów akceptacji.<br>- Priorytetyzacja funkcjonalności i błędów.<br>- Ostateczna akceptacja funkcjonalności (UAT).                                                                                                  |

---

## 10. Procedury raportowania błędów

Wszystkie zidentyfikowane błędy będą raportowane w **GitHub Issues**. W repozytorium zostanie zdefiniowany szablon zgłoszenia błędu, aby zapewnić spójność i kompletność informacji. Każdy raport powinien zawierać:

- **Tytuł:** Zwięzły i jednoznaczny opis problemu.
- **Środowisko:** Wersja aplikacji, przeglądarka, system operacyjny.
- **Kroki do odtworzenia:** Szczegółowa, ponumerowana lista kroków prowadzących do wystąpienia błędu.
- **Oczekiwany rezultat:** Opis, jak aplikacja powinna się zachować.
- **Rzeczywisty rezultat:** Opis, jak aplikacja faktycznie się zachowała.
- **Priorytet/Waga:** Określenie wpływu błędu na działanie aplikacji (np. `critical`, `high`, `medium`, `low`).
- **Załączniki:** Zrzuty ekranu, nagrania wideo lub logi z konsoli, które mogą pomóc w diagnozie problemu.

Błędy oraz zadania związane z testowaniem będą zarządzane za pomocą **GitHub Projects**, co pozwoli na wizualizację postępów i śledzenie cyklu życia każdego zgłoszenia.
