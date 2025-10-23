# Stos Technologiczny Projektu Billzilla

### Frontend - Astro z React dla komponentów interaktywnych:

- **Astro 5:** Wykorzystamy architekturę **Astro Islands**, aby domyślnie wysyłać do przeglądarki statyczny HTML, co gwarantuje błyskawiczne ładowanie aplikacji. Taka wydajność jest kluczowa dla dobrego doświadczenia użytkownika, zwłaszcza na urządzeniach mobilnych (zgodnie z wymogiem RWD).
- **React 19:** Będzie "nawadniał" poszczególne komponenty (wyspy), dostarczając interaktywność tam, gdzie jest to niezbędne – w formularzach dodawania wydatków (US-005, US-006), podczas dynamicznych kalkulacji podziału kosztów (F-012) oraz do aktualizacji sald w czasie rzeczywistym.
- **TypeScript 5:** Zapewni bezpieczeństwo typów w całym kodzie frontendowym, a w szczególności w komunikacji z backendem Supabase, minimalizując ryzyko błędów w czasie działania aplikacji.
- **Tailwind 4:** Jako framework utility-first, pozwoli na szybkie budowanie w pełni customizowalnego i responsywnego interfejsu bez opuszczania kodu HTML/JSX.
- **Shadcn/ui:** Dostarczy gotową, dostępną (accessibility) i łatwą do stylizowania bazę komponentów (pola formularzy, przyciski, modale, toasty), co znacząco przyspieszy development i zapewni spójność wizualną UI.
- **Zarządzanie stanem:** Wykorzystujemy **React Hooks** (useState, useEffect) oraz **React Context** do zarządzania stanem aplikacji. Stan globalny jest minimalny i zarządzany przez komponenty oraz custom hooki.
- **Formularze:** Zastosujemy bibliotekę **React Hook Form** do obsługi walidacji formularzy po stronie klienta, co zapewni natychmiastowy feedback dla użytkownika (np. przy podziale wydatku - F-012).

### Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- **Baza danych PostgreSQL z Row-Level Security (RLS):** To kluczowy element bezpieczeństwa. RLS pozwoli nam zdefiniować precyzyjne reguły dostępu na poziomie wiersza w bazie danych, gwarantując, że użytkownicy będą mieli dostęp wyłącznie do danych swoich grup. Umożliwi to realizację wymagań takich jak F-013 (tylko autor może edytować/usuwać wydatek).
- **SDK (supabase-js) i Logika Backendowa:** SDK umożliwi bezpośrednią i bezpieczną komunikację z bazą danych z poziomu frontendu. Jednak kluczowe, wrażliwe operacje (np. walidacja i zapis wydatków w ramach transakcji) będą obsługiwane przez logikę po stronie serwera (Astro API Routes lub Edge Functions), aby zapewnić integralność danych i dodatkowe bezpieczeństwo.
- **Autentykacja:** Wbudowany moduł Supabase Auth obsługuje **pełny system uwierzytelniania** (F-001, F-001a, F-001b):
  - **E-mail i hasło:** Rejestracja z weryfikacją e-mail, logowanie, resetowanie hasła
  - **Google OAuth:** Szybka rejestracja/logowanie przez konto Google
  - **Ochrona tras:** Middleware Astro zabezpiecza wszystkie strony oprócz `/login`, `/signup`, `/reset-password` i `/about` (F-001c)
- **Realtime Subscriptions:** Wykorzystamy tę funkcję do natychmiastowej aktualizacji interfejsu dla wszystkich członków grupy po dodaniu lub modyfikacji wydatku. Gdy jeden użytkownik zapisze zmianę, salda i lista transakcji zaktualizują się u pozostałych bez potrzeby odświeżania strony (kluczowe dla F-014).
- **Edge Functions:** Bezserwerowe funkcje (napisane w TypeScript) będą pełniły rolę bezpiecznego pośrednika w komunikacji z usługami zewnętrznymi (np. Openrouter.ai) oraz do obsługi złożonej logiki biznesowej, która wymaga środowiska serwerowego.
- **Klucz API do Openrouter.ai będzie przechowywany i używany wyłącznie w Edge Function**, dzięki czemu nigdy nie zostanie on ujawniony w kodzie po stronie klienta.

### AI - Komunikacja z modelami przez usługę Openrouter.ai:

- **Dwuetapowe przetwarzanie mowy:** Zastosujemy dwustopniowy proces:
  1.  **Transkrypcja (Speech-to-Text):** Model taki jak **Whisper (OpenAI)** zostanie użyty do zamiany nagrania audio na surowy tekst.
  2.  **Ekstrakcja danych (Text-to-JSON):** Przetworzony tekst, wzbogacony o kontekst (np. listę członków grupy), zostanie wysłany do zaawansowanego modelu LLM (np. **Claude 3 Sonnet, Llama 3, GPT-4o**), który na podstawie precyzyjnego promptu wyodrębni potrzebne informacje i zwróci je w formacie JSON.
- **Elastyczność i optymalizacja:** Openrouter.ai umożliwi nam łatwe przełączanie się między modelami, aby znaleźć optymalny balans między dokładnością (MS-003), szybkością (MS-002) a kosztem operacji AI.

### CI/CD i Hosting:

- **Github Actions:** Posłuży jako narzędzie do automatyzacji procesów: uruchamiania testów, lintera oraz budowania obrazu produkcyjnego aplikacji.
- **Hosting DigitalOcean + Docker**
  - **Uzasadnienie:** Zapewnia pełną kontrolę nad środowiskiem hostingowym i może być bardziej opłacalny w dużej skali, jednak wymaga większego nakładu pracy przy konfiguracji i utrzymaniu infrastruktury.
