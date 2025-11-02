# Architektura UI dla Billzilla

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika Billzilla została zaprojektowana w oparciu o podejście "mobile-first", z naciskiem na prostotę, szybkość działania i aktualizacje w czasie rzeczywistym. Opiera się na architekturze komponentowej (Astro + React) i bibliotece Shadcn/ui, aby zapewnić spójność wizualną i wysoką dostępność (WCAG).

Kluczowe założenia:

- **Minimalny stan globalny:** Globalny store (Zustand) przechowuje wyłącznie dane zalogowanego użytkownika. Wszystkie inne dane (grupy, wydatki, salda) są traktowane jako "stan serwera" i pobierane na żądanie przy użyciu dedykowanej biblioteki (np. React Query), co zapewnia, że UI zawsze wyświetla aktualne informacje.
- **Nawigacja oparta na kontekście:** Aplikacja wykorzystuje głównie modale do akcji tworzenia i edycji (np. dodawanie wydatku, tworzenie grupy), aby utrzymać użytkownika w bieżącym kontekście, zamiast przenosić go do oddzielnych stron.
- **Zarządzanie zaproszeniami:** Zaproszenia do grup są wyświetlane bezpośrednio na pulpicie użytkownika jako specjalne karty, umożliwiając szybką akceptację lub odrzucenie w głównym widoku aplikacji.
- **Dynamiczne UI w czasie rzeczywistym:** Interfejs aktywnie wykorzystuje Supabase Realtime Subscriptions do natychmiastowego odzwierciedlania zmian (np. nowych wydatków, aktualizacji sald) bez konieczności ręcznego odświeżania strony, z subtelnymi animacjami sygnalizującymi nowe dane.

## 2. Lista widoków

### Widok 1: Logowanie (Login)

- **Ścieżka:** `/login`
- **Główny cel:** Uwierzytelnienie użytkownika w systemie.
- **Kluczowe informacje:** Formularz logowania z opcjami e-mail/hasło lub Google OAuth, link do rejestracji i resetowania hasła.
- **Kluczowe komponenty:**
  - `LoginForm`: Formularz z polami e-mail i hasło oraz przyciskiem "Zaloguj się".
  - `GoogleLoginButton`: Przycisk "Kontynuuj z Google" do logowania przez OAuth.
  - `Link`: Link "Nie masz konta? Zarejestruj się" przekierowujący do `/signup`.
  - `Link`: Link "Zapomniałeś hasła?" przekierowujący do `/reset-password`.
  - `Divider`: Separator wizualny "lub" między formularzem a przyciskiem Google.
- **UX, dostępność, bezpieczeństwo:**
  - **UX:** Użytkownik ma wybór między tradycyjnym logowaniem (e-mail/hasło) a szybkim logowaniem przez Google. Formularze są proste i intuicyjne z jasną walidacją w czasie rzeczywistym.
  - **Dostępność:** Wszystkie pola formularza mają odpowiednie labele. Komunikaty błędów są jasne i dostępne dla czytników ekranu.
  - **Bezpieczeństwo:** Hasła nie są widoczne (type="password"). Proces OAuth jest obsługiwany przez Supabase. Komunikaty błędów nie ujawniają, czy dany e-mail istnieje w systemie.

### Widok 1a: Rejestracja (Signup)

- **Ścieżka:** `/signup`
- **Główny cel:** Utworzenie nowego konta użytkownika.
- **Kluczowe informacje:** Formularz rejestracji z opcjami e-mail/hasło lub Google OAuth, link do logowania.
- **Kluczowe komponenty:**
  - `SignupForm`: Formularz z polami: e-mail, hasło, potwierdzenie hasła, opcjonalnie imię i nazwisko, przycisk "Zarejestruj się".
  - `PasswordStrengthIndicator`: Wizualizacja siły hasła (słabe/średnie/silne).
  - `GoogleSignupButton`: Przycisk "Kontynuuj z Google" do rejestracji przez OAuth.
  - `Link`: Link "Masz już konto? Zaloguj się" przekierowujący do `/login`.
  - `Divider`: Separator wizualny "lub" między formularzem a przyciskiem Google.
- **UX, dostępność, bezpieczeństwo:**
  - **UX:** Jasny proces rejestracji z natychmiastowym feedbackiem o sile hasła. Po rejestracji użytkownik widzi komunikat o konieczności potwierdzenia e-maila.
  - **Dostępność:** Wszystkie pola są prawidłowo oznaczone. Błędy walidacji są jasne i pomocne.
  - **Bezpieczeństwo:** Walidacja siły hasła (min. 8 znaków). Hasła muszą się zgadzać. E-mail jest weryfikowany przed pełnym dostępem do aplikacji.

### Widok 1b: Resetowanie hasła (Reset Password)

- **Ścieżka:** `/reset-password`
- **Główny cel:** Umożliwienie użytkownikowi zresetowania zapomnianego hasła.
- **Kluczowe informacje:** Formularz z polem e-mail lub (jeśli token resetujący w URL) formularz ustawiania nowego hasła.
- **Kluczowe komponenty:**
  - `ResetPasswordRequestForm`: Formularz z polem e-mail i przyciskiem "Wyślij link resetujący".
  - `ResetPasswordForm`: Formularz z polami: nowe hasło, potwierdzenie hasła, przycisk "Zmień hasło" (widoczny tylko gdy jest token w URL).
  - `PasswordStrengthIndicator`: Wizualizacja siły nowego hasła.
  - `Link`: Link "Wróć do logowania" przekierowujący do `/login`.
- **UX, dostępność, bezpieczeństwo:**
  - **UX:** Dwuetapowy proces: (1) żądanie linku resetującego, (2) ustawienie nowego hasła. Jasne komunikaty o sukcesie po każdym kroku.
  - **Dostępność:** Formularze są w pełni dostępne z klawiatury z jasnymi komunikatami.
  - **Bezpieczeństwo:** Link resetujący ma ograniczony czas życia. Komunikat sukcesu zawsze pokazuje się, nawet jeśli e-mail nie istnieje (aby nie ujawniać informacji o użytkownikach).

### Widok 1c: O aplikacji (About)

- **Ścieżka:** `/about`
- **Główny cel:** Prezentacja informacji o aplikacji Billzilla dla niezalogowanych użytkowników.
- **Kluczowe informacje:** Opis aplikacji, główne funkcje, korzyści, link do rejestracji/logowania.
- **Kluczowe komponenty:**
  - `HeroSection`: Sekcja nagłówkowa z opisem aplikacji i przyciskami CTA "Zacznij teraz" (-> /signup) lub "Zaloguj się" (-> /login).
  - `FeaturesSection`: Prezentacja kluczowych funkcji (głosowe dodawanie wydatków, zarządzanie grupami, automatyczne salda).
  - `Footer`: Stopka z linkami i informacjami kontaktowymi.
- **UX, dostępność, bezpieczeństwo:**
  - **UX:** Strona jest dostępna publicznie i służy jako landing page dla nowych użytkowników. Jasne CTA zachęcają do rejestracji.
  - **Dostępność:** Semantyczny HTML, odpowiedni kontrast, czytelna treść.
  - **Bezpieczeństwo:** Strona nie wymaga uwierzytelnienia (publiczna).

### Widok 2: Pulpit (Dashboard)

- **Ścieżka:** `/` (główny widok po zalogowaniu, wymaga uwierzytelnienia)
- **Główny cel:** Wyświetlenie listy grup i zaproszeń użytkownika oraz zapewnienie szybkiego dostępu do kluczowych akcji.
- **Kluczowe informacje:**
  - Lista kart grup, do których należy użytkownik.
  - Lista kart z oczekującymi zaproszeniami do grup.
  - Stan pusty (Empty State) dla nowych użytkowników bez grup i zaproszeń.

- **Kluczowe komponenty:**
  - `Header`: Nagłówek aplikacji z menu użytkownika (wyloguj).
  - `DashboardList`: Komponent wyświetlający na pulpicie dwie oddzielne, wyraźnie oznaczone sekcje: jedną dla zaproszeń (`InvitationCard`) i drugą dla grup (`GroupCard`). Dane dla każdej sekcji są pobierane osobno.
  - `GroupCard`: Karta z nazwą grupy, saldem użytkownika, sliderem z awatarami uczestników (z tooltipem `+N`) i przyciskiem szybkiej akcji "Dodaj wydatek".
  - `InvitationCard`: Specjalna karta dla zaproszenia, wyświetlająca nazwę grupy, informację o zapraszającym oraz przyciski "Akceptuj" i "Odrzuć".
  - `FloatingActionButton (FAB)`: Przycisk do tworzenia nowej grupy.
  - `EmptyState`: Komponent wyświetlany nowym użytkownikom, zachęcający do stworzenia pierwszej grupy.
- **UX, dostępność, bezpieczeństwo:**
  - **UX:** Pulpit jest podzielony na dwie klarowne sekcje: "Zaproszenia" i "Twoje grupy", co ułatwia orientację. Dane dla każdej sekcji ładowane są niezależnie. Po akceptacji zaproszenia, `InvitationCard` znika z sekcji zaproszeń, a na liście grup pojawia się nowa `GroupCard`.
  - **Dostępność:** Karty są focusowalne. FAB ma `aria-label`. Zmiany sald aktualizowane w czasie rzeczywistym są ogłaszane przez `aria-live`.
  - **Bezpieczeństwo:** API (zabezpieczone przez RLS) zwraca tylko te grupy i zaproszenia, do których użytkownik ma dostęp.

### Widok 3: Grupa (Group)

- **Ścieżka:** `/groups/:id/dashboard` (wymaga uwierzytelnienia)
- **Główny cel:** Szczegółowy widok pojedynczej grupy ze wszystkimi informacjami w jednym miejscu.
- **Kluczowe informacje:** Nazwa grupy, wydatki, salda i ustawienia grupy.
- **Kluczowe komponenty:**
  - `Header`: Nagłówek z przyciskiem "Wróć" do pulpitu i opcjami edycji grupy.
  - `DashboardTab`: Główny komponent zawierający wszystkie sekcje (wydatki, salda, ustawienia).
- **UX, dostępność, bezpieczeństwo:**
  - **UX:** Wszystkie informacje grupy są dostępne w jednym widoku bez konieczności przełączania między zakładkami.
  - **Dostępność:** Wszystkie komponenty są dostępne z klawiatury z odpowiednimi etykietami ARIA.
  - **Bezpieczeństwo:** Dostęp do widoku jest chroniony – użytkownik musi być uczestnikiem grupy.

#### Sekcje dashboard grupy

Dashboard grupy zawiera wszystkie informacje w jednym widoku podzielonym na logiczne sekcje:

**Sekcja podsumowania (Summary Cards):**
- Karty z kluczowymi metrykami: suma wydatków, liczba członków, do rozliczenia, własne saldo.
- Komponenty: `SummaryCard` (4 karty w grid).

**Sekcja wydatki (Expenses Section):**
- Lista wszystkich wydatków z opisem, kwotą, datą, płatnikiem oraz awatarami uczestników.
- Możliwość dodawania nowych wydatków przez FAB.
- Komponenty: `ExpenseList`, `ExpenseListItem`, `FloatingActionButton`.

**Sekcja salda (Balances Section):**
- Podsumowanie sald wszystkich członków grupy.
- Lista sugerowanych rozliczeń z przyciskami szybkiego rozliczenia.
- Komponenty: `MemberBalanceSummary`, `SuggestedSettlementList`, `SettleUpButton`.

**Sekcja ustawień grupy (Group Settings Section):**
- Zarządzanie członkami: lista uczestników, formularz zaproszeń.
- Zarządzanie walutami: lista walut z kursami, dodawanie nowych walut.
- Akcje grupy: opuszczenie grupy, archiwizacja (tylko dla twórcy).
- Komponenty: `GroupSettingsCards` zawierający wszystkie podsekcje ustawień.

**UX, dostępność, bezpieczeństwo:**
- **UX:** Wszystkie informacje są dostępne w jednym miejscu bez przełączania kontekstu. Sekcje są logicznie oddzielone wizualnie.
- **Dostępność:** Wszystkie komponenty są dostępne z klawiatury. Nowe dane są ogłaszane przez `aria-live`.
- **Bezpieczeństwo:** Uprawnienia są egzekwowane na poziomie komponentów (tylko twórca może edytować nazwę grupy, tylko autor wydatku może go edytować).

### Komponenty modalne (nie są osobnymi widokami)

#### Modal: Utwórz grupę (Create Group)

- **Cel:** Stworzenie nowej grupy.
- **Komponenty:** Formularz z polem na nazwę, wyborem waluty bazowej i opcjonalnym polem na e-maile do zaproszenia.

#### Modal: Dodaj/Edytuj wydatek (Add/Edit Expense)

- **Cel:** Dodanie lub modyfikacja wydatku.
- **Komponenty:**
  - Formularz (opis, kwota, waluta, data, płatnik, uczestnicy).
  - `SplitMethodToggle`: Przełącznik podziału ("po równo" / "każdy ma swoją kwotę").
  - `VoiceInputButton`: Ikona mikrofonu do aktywacji nagrywania, która zmienia stan na "nagrywanie" i "przetwarzanie".
  - `CustomSplitInputList`: Pola do wpisania niestandardowych kwot dla uczestników.
- **UX:** Walidacja sumy podziałów w czasie rzeczywistym. Funkcja głosowa jest zintegrowana i nie przerywa przepływu.

#### Modal: Rozlicz się (Settle Up)

- **Cel:** Zarejestrowanie spłaty długu.
- **Komponenty:** Formularz z wyborem płacącego, odbiorcy i kwoty (w walucie bazowej).

## 3. Mapa podróży użytkownika

### 3.1. Przepływ dla nowego użytkownika (rejestracja przez e-mail)

1.  **Strona startowa:** Nowy użytkownik trafia na `/about`, czyta o aplikacji i klika "Zacznij teraz".
2.  **Rejestracja:** Jest przekierowany na `/signup`, gdzie wypełnia formularz rejestracji (e-mail, hasło).
3.  **Potwierdzenie e-maila:** Otrzymuje e-mail weryfikacyjny, klika w link i potwierdza swój adres.
4.  **Pierwsze logowanie:** Wraca na `/login`, loguje się swoim e-mailem i hasłem.
5.  **Pusty pulpit:** Jest przekierowany na `/` (strona główna), gdzie widzi `EmptyState` i klika "Stwórz grupę".
6.  **Tworzenie grupy:** W modalu `Utwórz grupę` podaje nazwę, wybiera walutę i zaprasza znajomego przez e-mail.
7.  **Pierwsza grupa:** Po zapisaniu modal znika, a na `/` pojawia się nowa karta grupy.
8.  **Dalsze kroki:** Użytkownik kontynuuje jak w przepływie głównym poniżej (punkt 5 i dalej).

### 3.2. Przepływ dla nowego użytkownika (rejestracja przez Google)

1.  **Strona startowa:** Użytkownik trafia na `/about`, czyta o aplikacji i klika "Zacznij teraz".
2.  **Rejestracja:** Jest przekierowany na `/signup`, gdzie klika "Kontynuuj z Google".
3.  **OAuth Google:** Przechodzi przez proces uwierzytelniania Google i zostaje automatycznie zarejestrowany i zalogowany.
4.  **Pusty pulpit:** Jest przekierowany na `/` (strona główna) i kontynuuje jak w przepływie głównym poniżej.

### 3.3. Główny przepływ ("happy path") dla użytkownika tworzącego grupę

1.  **Logowanie:** Użytkownik trafia na `/login`, loguje się (e-mail/hasło lub Google) i zostaje uwierzytelniony.
2.  **Pusty pulpit:** Zostaje przekierowany na `/` (strona główna), gdzie widzi `EmptyState` i klika "Stwórz grupę".
3.  **Tworzenie grupy:** W modalu `Utwórz grupę` podaje nazwę, wybiera walutę i zaprasza znajomego przez e-mail.
4.  **Pierwsza grupa:** Po zapisaniu modal znika, a na `/` pojawia się nowa karta grupy.
5.  **Wejście do grupy:** Użytkownik klika kartę grupy i przechodzi do `/groups/:id/dashboard`.
6.  **Dodawanie wydatku:** Klika FAB, co otwiera modal `Dodaj wydatek`.
7.  **Dodawanie głosem:** Klika ikonę mikrofonu, mówi "Ja zapłaciłem 100 złotych za zakupy dla mnie i Ani", system przetwarza polecenie i automatycznie wypełnia formularz.
8.  **Weryfikacja i zapis:** Użytkownik sprawdza dane, potwierdza i zapisuje wydatek. Modal się zamyka, a nowy wydatek pojawia się na liście.
9.  **Sprawdzenie sald:** Użytkownik sprawdza sekcję sald w tym samym widoku, gdzie widzi, że Ania jest mu winna 50 PLN.
10. **Rozliczenie:** Użytkownik klika na sugestię spłaty, co otwiera pre-wypełniony modal `Rozlicz się`, zatwierdza go, a salda w grupie zostają wyrównane.

### 3.4. Przepływ dla użytkownika resetującego hasło

1.  **Strona logowania:** Użytkownik trafia na `/login` i klika "Zapomniałeś hasła?".
2.  **Żądanie resetu:** Jest przekierowany na `/reset-password`, gdzie podaje swój e-mail.
3.  **E-mail resetujący:** Otrzymuje e-mail z linkiem do resetowania hasła.
4.  **Nowe hasło:** Klika w link, jest przekierowany na `/reset-password?token=...` i ustawia nowe hasło.
5.  **Logowanie:** Po zmianie hasła jest przekierowany na `/login`, gdzie loguje się nowym hasłem.

### 3.5. Przepływ dla zaproszonego użytkownika

1.  **Logowanie/Rejestracja:** Użytkownik, który otrzymał zaproszenie przez e-mail, rejestruje się (jeśli nie ma konta) lub loguje się po raz pierwszy.
2.  **Widok pulpitu z zaproszeniem:** Na stronie głównej (`/`), obok ewentualnych innych grup, widzi `InvitationCard` z nazwą grupy, do której został zaproszony.
3.  **Akceptacja zaproszenia:** Klika przycisk "Akceptuj" bezpośrednio na karcie zaproszenia.
4.  **Potwierdzenie i zmiana widoku:** Karta zaproszenia znika (lub zamienia się w standardową kartę grupy), a na ekranie pojawia się komunikat (Toast) o pomyślnym dołączeniu do grupy. Użytkownik od razu widzi nową grupę na swojej liście.

## 4. Układ i struktura nawigacji

- **Strony publiczne (bez uwierzytelnienia):** `/login`, `/signup`, `/reset-password`, `/about` - dostępne dla wszystkich użytkowników.
- **Strony chronione (wymagają uwierzytelnienia):** Wszystkie pozostałe strony wymagają zalogowania. Próba dostępu bez uwierzytelnienia przekierowuje na `/login`.
- **Nawigacja główna:** Jest płaska i maksymalnie uproszczona. Zalogowany użytkownik porusza się głównie między stroną główną (`/`) a widokiem szczegółów grupy (`/groups/:id`). `Header` zapewnia spójny punkt dostępu do menu użytkownika i nawigacji wstecz. Nie ma osobnej strony do zarządzania zaproszeniami.
- **Nawigacja wewnątrz grupy:** Wszystkie informacje grupy są dostępne w jednym widoku dashboard bez konieczności przełączania kontekstu.
- **Wyzwalanie akcji:** Kluczowe akcje (tworzenie, edycja, akceptacja zaproszeń) są inicjowane przez przyciski (na kartach, FAB) i otwierają modale (dla tworzenia/edycji), co zapobiega utracie kontekstu i przeładowywaniu strony.

## 5. Kluczowe komponenty

Poniżej lista reużywalnych komponentów kluczowych dla spójności i funkcjonalności aplikacji:

- **`Header`:** Spójny nagłówek z nawigacją wstecz i menu użytkownika (z opcją wylogowania).
- **`LoginForm`:** Formularz logowania z walidacją e-mail i hasła.
- **`SignupForm`:** Formularz rejestracji z walidacją i wskaźnikiem siły hasła.
- **`ResetPasswordForm`:** Formularz resetowania hasła.
- **`PasswordStrengthIndicator`:** Wizualny wskaźnik siły hasła.
- **`GoogleAuthButton`:** Przycisk do uwierzytelniania przez Google OAuth.
- **`GroupCard`:** Karta reprezentująca grupę, do której użytkownik należy.
- **`InvitationCard`:** Karta reprezentująca oczekujące zaproszenie do grupy, z akcjami akceptacji/odrzucenia.
- **`FloatingActionButton (FAB)`:** Główny przycisk akcji na widokach list.
- **`EmptyState`:** Komponent informujący o braku danych (np. grup, wydatków) z wezwaniem do akcji.
- **`ExpenseListItem`:** Element listy wydatków, wyświetlający wszystkie kluczowe informacje.
- **`MemberSelector`:** Pole formularza do wyboru jednego lub wielu uczestników grupy (z awatarami).
- **`ConfirmationDialog`:** Modal używany do potwierdzania niebezpiecznych akcji (np. opuszczenie grupy).
- **`Toast`:** Komponent do wyświetlania globalnych powiadomień (błędy, sukcesy).
- **`VoiceInputButton`:** Komponent obsługujący interfejs nagrywania i przetwarzania głosu.
