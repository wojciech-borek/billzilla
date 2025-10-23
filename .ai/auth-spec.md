# Specyfikacja Techniczna Systemu Autentykacji - Billzilla

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1. Struktura stron i komponentów

#### 1.1.1. Strony Astro (Server-Side Rendered)

##### Strona logowania: `/src/pages/login.astro`

**Cel:** Obsługa logowania użytkowników za pomocą e-mail/hasło oraz Google OAuth.

**Odpowiedzialności:**

- Renderowanie layoutu z formularzem logowania
- Sprawdzenie czy użytkownik jest już zalogowany (przekierowanie na `/`)
- Obsługa komunikatów błędów z parametrów URL (po nieudanym logowaniu)
- Przekazanie konfiguracji Supabase do komponentu React
- **BEZPIECZEŃSTWO:** Obsługa bezpiecznych przekierowań - walidacja że redirect URL jest wewnętrzny (zaczyna się od `/`)

**Struktura:**

```
/login.astro (SSR)
├── Layout.astro (showHeader: true)
└── LoginForm.tsx (client:load)
    ├── EmailPasswordLoginSection
    │   ├── Input (email)
    │   ├── Input (password)
    │   └── Button (Zaloguj się)
    ├── Separator (lub)
    └── GoogleOAuthButton
```

**Logika SSR:**

- Odczyt sesji z `context.locals.supabase.auth.getSession()`
- Jeśli użytkownik zalogowany: przekierowanie na `/`
- Odczyt parametrów URL: `error`, `error_description`, `redirect`
- Walidacja parametru `redirect` - musi być wewnętrzną ścieżką (zaczynać się od `/` i nie zawierać `://`)

**Uwagi bezpieczeństwa:**

- **Ochrona przed Open Redirect vulnerability:** Walidacja że `redirect` URL jest wewnętrzny
- Regex do walidacji: `/^\/[^/].*$/` - musi zaczynać się od `/` i nie może być `//` (protokół względny)
- Odrzucenie zewnętrznych URL (zawierających `://` lub zaczynających się od `//`)
- Wszystkie przekierowania OAuth również walidowane przed użyciem

##### Strona rejestracji: `/src/pages/signup.astro`

**Cel:** Obsługa rejestracji nowych użytkowników.

**Odpowiedzialności:**

- Renderowanie layoutu z formularzem rejestracji
- Sprawdzenie czy użytkownik jest już zalogowany (przekierowanie na `/`)
- Obsługa komunikatów błędów i sukcesu z parametrów URL
- Przekazanie konfiguracji Supabase do komponentu React

**Struktura:**

```
/signup.astro (SSR)
├── Layout.astro (showHeader: true)
└── SignupForm.tsx (client:load)
    ├── EmailPasswordSignupSection
    │   ├── Input (full_name) - label: "Jak mamy Cię nazywać?"
    │   ├── Input (email) - label: "Adres e-mail"
    │   ├── Input (password) - label: "Hasło"
    │   ├── Input (confirm_password) - label: "Powtórz hasło"
    │   └── Button (Zarejestruj się)
    ├── Separator (lub)
    ├── GoogleOAuthButton
    └── Link do logowania: "Masz już konto? Zaloguj się"
```

**Logika SSR:**

- Odczyt sesji z `context.locals.supabase.auth.getSession()`
- Jeśli użytkownik zalogowany: przekierowanie na `/`
- Odczyt parametrów URL: `success`, `error`, `error_description`

##### Strona resetowania hasła: `/src/pages/reset-password.astro`

**Cel:** Obsługa żądania resetowania hasła i ustawiania nowego hasła.

**Odpowiedzialności:**

- Renderowanie formularza żądania resetu (podanie e-mail)
- Renderowanie formularza ustawiania nowego hasła (po kliknięciu w link z e-maila)
- Rozróżnienie między dwoma trybami na podstawie parametrów URL

**Struktura:**

```
/reset-password.astro (SSR)
├── Layout.astro (showHeader: true)
└── ResetPasswordForm.tsx (client:load)
    ├── RequestResetMode
    │   ├── Input (email)
    │   └── Button (Wyślij link resetujący)
    └── SetNewPasswordMode (gdy type=recovery w URL)
        ├── Input (new_password)
        ├── Input (confirm_password)
        └── Button (Ustaw nowe hasło)
```

**Logika SSR:**

- Odczyt parametrów URL: `type`, `access_token`, `error`, `success`
- Jeśli `type=recovery` i `access_token` obecny: tryb ustawiania nowego hasła
- W przeciwnym razie: tryb żądania resetu

##### Strona potwierdzenia e-mail: `/src/pages/auth/confirm.astro`

**Cel:** Obsługa kliknięcia w link potwierdzający e-mail.

**Odpowiedzialności:**

- Przechwycenie tokenu z URL i weryfikacja
- Wyświetlenie komunikatu sukcesu lub błędu
- Przekierowanie na dashboard po pomyślnej weryfikacji

**Struktura:**

```
/auth/confirm.astro (SSR)
├── Layout.astro (showHeader: true)
└── EmailConfirmationMessage.tsx (client:load)
    ├── SuccessState (email potwierdzony)
    └── ErrorState (błąd weryfikacji)
```

**Logika SSR:**

- Odczyt parametrów: `token_hash`, `type`, `next`
- Wywołanie `supabase.auth.verifyOtp()` jeśli token obecny
- Ustawienie sesji po pomyślnej weryfikacji
- Przekierowanie na `/` lub wartość z parametru `next`

##### Strona "O aplikacji": `/src/pages/about.astro`

**Cel:** Publiczna strona informacyjna o aplikacji (bez zmian).

**Status:** Bez wymaganej autentykacji, dostępna dla wszystkich.

##### Modyfikacja strony głównej: `/src/pages/index.astro`

**Aktualne zmiany:**

- Obecna implementacja już sprawdza użytkownika przez `Astro.locals.user`
- Wymaga zaktualizowania sprawdzenia autentykacji (usunięcie logiki mock user)
- Przekierowanie na `/login` jeśli brak sesji

**Logika SSR (do zaktualizowania):**

```typescript
const session = await Astro.locals.supabase.auth.getSession();
const user = session.data.session?.user;

if (!user) {
  return Astro.redirect("/login");
}
```

##### Modyfikacje innych chronionych stron

**Strony wymagające aktualizacji:**

- `/src/pages/groups/new.astro`
- `/src/pages/groups/[groupId]/index.astro`

**Wzorzec aktualizacji:**

```typescript
// Zamiast używania Astro.locals.user (mock)
// Użyj rzeczywistej sesji Supabase
const session = await Astro.locals.supabase.auth.getSession();
const user = session.data.session?.user;

if (!user) {
  // BEZPIECZEŃSTWO: Przekieruj na /login z bezpiecznym parametrem redirect
  const currentPath = Astro.url.pathname + Astro.url.search;
  return Astro.redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
}
```

#### 1.1.2. Komponenty React (Client-Side)

##### LoginForm.tsx (`/src/components/auth/LoginForm.tsx`)

**Typ:** Interaktywny komponent React (client:load)

**Props:**

```typescript
interface LoginFormProps {
  errorMessage?: string;
  redirectTo?: string; // Walidowany wewnętrzny URL przekierowania
}
```

**Odpowiedzialności:**

- Zarządzanie stanem formularza (email, password)
- Walidacja po stronie klienta (Zod schema)
- Wywołanie `supabase.auth.signInWithPassword()` dla logowania e-mail/hasło
- Wywołanie `supabase.auth.signInWithOAuth()` dla Google OAuth
- Wyświetlanie błędów walidacji i błędów API
- Zarządzanie stanami ładowania (przyciski disabled podczas request)
- **Przekierowanie na `redirectTo` lub `/` po pomyślnym zalogowaniu (tylko walidowane wewnętrzne ścieżki)**
- Link do rejestracji (`/signup`) pod formularzem
- Link do resetowania hasła (`/reset-password`) pod formularzem

**Hooki:**

- `useAuthForm()` - niestandardowy hook do zarządzania stanem formularza
- `useSupabaseAuth()` - dostęp do Supabase client

**Walidacja:**

- Email: wymagany, poprawny format e-mail
- Password: wymagany, min. 8 znaków

**Obsługa błędów:**

- Błędy walidacji: wyświetlane pod polami (czerwony tekst)
- Błędy API: wyświetlane jako alert nad formularzem
- Błędy Google OAuth: wyświetlane jako toast notification

##### SignupForm.tsx (`/src/components/auth/SignupForm.tsx`)

**Typ:** Interaktywny komponent React (client:load)

**Props:**

```typescript
interface SignupFormProps {
  successMessage?: string;
  errorMessage?: string;
}
```

**Odpowiedzialności:**

- Zarządzanie stanem formularza (full_name, email, password, confirm_password)
- Walidacja po stronie klienta (Zod schema)
- Wywołanie `supabase.auth.signUp()` dla rejestracji e-mail/hasło
- Wywołanie `supabase.auth.signInWithOAuth()` dla Google OAuth
- Wyświetlanie komunikatu o wysłaniu e-maila weryfikacyjnego
- Wyświetlanie błędów walidacji i błędów API
- Zarządzanie stanami ładowania
- Link do logowania (`/login`) pod formularzem - "Masz już konto? Zaloguj się"

**Hooki:**

- `useAuthForm()` - niestandardowy hook do zarządzania stanem formularza
- `useSupabaseAuth()` - dostęp do Supabase client

**Walidacja:**

- full_name: wymagane, min. 2 znaki, max. 50 znaków (dowolne znaki - można wpisać login, pseudonim, co się chce)
- Email: wymagany, poprawny format e-mail
- Password: wymagany, min. 8 znaków, zawiera przynajmniej 1 cyfrę i 1 literę
- Confirm password: musi być identyczny z password

**Labele w UI:**

- full_name → "Jak mamy Cię nazywać?" (sugeruje elastyczność)
- Placeholder: "np. Janusz123, Kasia, MonsterSlayer" (pokazuje, że można wpisać co się chce)

**Obsługa błędów:**

- Błędy walidacji: wyświetlane pod polami (czerwony tekst)
- Błędy API: wyświetlane jako alert nad formularzem
- Sukces: wyświetlanie komunikatu o wysłaniu e-maila weryfikacyjnego

##### ResetPasswordForm.tsx (`/src/components/auth/ResetPasswordForm.tsx`)

**Typ:** Interaktywny komponent React (client:load)

**Props:**

```typescript
interface ResetPasswordFormProps {
  mode: "request" | "reset";
  accessToken?: string;
  errorMessage?: string;
  successMessage?: string;
}
```

**Odpowiedzialności:**

- Dwutorowa logika: żądanie resetu vs ustawianie nowego hasła
- W trybie 'request': wywołanie `supabase.auth.resetPasswordForEmail()`
- W trybie 'reset': wywołanie `supabase.auth.updateUser()`
- Walidacja po stronie klienta
- Wyświetlanie błędów i komunikatów sukcesu

**Hooki:**

- `useAuthForm()` - hook do zarządzania stanem formularza
- `useSupabaseAuth()` - dostęp do Supabase client

**Walidacja (tryb request):**

- Email: wymagany, poprawny format e-mail

**Walidacja (tryb reset):**

- new_password: wymagany, min. 8 znaków, zawiera przynajmniej 1 cyfrę i 1 literę
- confirm_password: musi być identyczny z new_password

##### GoogleOAuthButton.tsx (`/src/components/auth/GoogleOAuthButton.tsx`)

**Typ:** Reużywalny komponent React

**Props:**

```typescript
interface GoogleOAuthButtonProps {
  mode: "login" | "signup";
  redirectTo?: string;
}
```

**Odpowiedzialności:**

- Wywołanie `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Ustawienie odpowiedniego redirect URL
- Wyświetlanie ikony Google i tekstu przycisku
- Obsługa stanów ładowania

##### LogoutButton.tsx (`/src/components/auth/LogoutButton.tsx`)

**Typ:** Prosty komponent React

**Props:**

```typescript
interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline";
  className?: string;
}
```

**Odpowiedzialności:**

- Wywołanie `supabase.auth.signOut()`
- Przekierowanie na `/login` po wylogowaniu
- Czyszczenie lokalnego state (jeśli używany Zustand)

##### UserMenu.tsx (`/src/components/layout/UserMenu.tsx`)

**Typ:** Komponent React z dropdown menu

**Props:**

```typescript
interface UserMenuProps {
  user: {
    id: string;
    email: string;
    full_name?: string; // Nazwa użytkownika (może być login, pseudonim, itp.)
    avatar_url?: string;
  };
}
```

**Odpowiedzialności:**

- Wyświetlanie avatara użytkownika (lub inicjałów z full_name)
- Wyświetlanie nazwy użytkownika (full_name) i email w dropdown
- Dropdown menu z opcjami:
  - Wyloguj się (LogoutButton)
- Integracja z shadcn/ui DropdownMenu
- **Styling zgodny z Billzilla UI Guidelines** (zielone akcenty, zaokrąglone)

#### 1.1.3. Modyfikacje istniejącego layoutu

##### Layout.astro (rozszerzenie)

**Zmiany w nagłówku:**

- Dodanie UserMenu po prawej stronie nawigacji (tylko dla zalogowanych)
- **USUNIĘCIE linków "Zaloguj się"/"Zarejestruj się" z nagłówka**
- Niezalogowani użytkownicy widzą pusty nagłówek (tylko logo)

**Zmiany w stopce:**

- **DODANIE linku "O aplikacji" w stopce** (zamiast nagłówka)
- Może zawierać również linki do regulaminu, polityki prywatności, itp.

**Nowa struktura nagłówka:**

```astro
{
  showHeader && (
    <header class="sticky top-0 z-40 border-b border-gray-100 bg-background/95 backdrop-blur-sm shadow-sm">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          class="flex items-center gap-3 transition-all duration-300 ease-out hover:opacity-80 hover:scale-105"
          aria-label="Billzilla - Strona główna"
        >
          <img src="/billzilla-logo.png" alt="Billzilla logo" class="h-10 w-10 rounded-xl" />
          <span class="text-xl font-bold tracking-tight text-foreground">Billzilla</span>
        </a>
        <nav>{user && <UserMenu user={user} client:load />}</nav>
      </div>
    </header>
  )
}
```

**Nowa struktura stopki:**

```astro
<footer class="border-t border-gray-100 bg-white">
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="flex justify-center gap-6 text-sm text-gray-600">
      <a href="/about" class="hover:text-primary transition-colors">O aplikacji</a>
      <a href="/privacy" class="hover:text-primary transition-colors">Polityka prywatności</a>
      <a href="/terms" class="hover:text-primary transition-colors">Regulamin</a>
    </div>
    <p class="mt-4 text-center text-xs text-gray-500">© 2025 Billzilla. Wszystkie prawa zastrzeżone.</p>
  </div>
</footer>
```

**Logika SSR w Layout:**

```typescript
// Pobierz dane użytkownika z bazy gdy zalogowany
const session = await Astro.locals.supabase.auth.getSession();
let user = null;

if (session.data.session?.user) {
  // Pobierz profil z bazy danych dla full_name i avatar_url
  const { data: profile } = await Astro.locals.supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("id", session.data.session.user.id)
    .single();

  user = profile;
}
```

**Styling zgodny z Billzilla UI Guidelines:**

- Kolory: `background` (#F9FAF8), `primary` (#49A067), `foreground` (#0C2231)
- Zaokrąglenia: `rounded-xl` na logo
- Animacje: `transition-all duration-300 ease-out`
- Typografia: `font-bold tracking-tight`

#### 1.1.4. Walidacja i komunikaty błędów

##### Walidacja po stronie klienta (React Hook Form + Zod)

**Schema dla logowania** (`/src/lib/schemas/authSchemas.ts`):

```typescript
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Adres e-mail jest wymagany")
    .email("Nieprawidłowy format adresu e-mail")
    .toLowerCase()
    .trim(),

  password: z.string().min(1, "Hasło jest wymagane").min(8, "Hasło musi mieć minimum 8 znaków"),
});
```

**Schema dla rejestracji**:

```typescript
export const signupSchema = z
  .object({
    full_name: z
      .string()
      .min(1, "To pole jest wymagane")
      .min(2, "Nazwa musi mieć minimum 2 znaki")
      .max(50, "Nazwa może mieć maksymalnie 50 znaków")
      .trim(),

    email: z
      .string()
      .min(1, "Adres e-mail jest wymagany")
      .email("Nieprawidłowy format adresu e-mail")
      .toLowerCase()
      .trim(),

    password: z
      .string()
      .min(1, "Hasło jest wymagane")
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę")
      .regex(/[a-zA-Z]/, "Hasło musi zawierać przynajmniej jedną literę"),

    confirm_password: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Hasła muszą być identyczne",
    path: ["confirm_password"],
  });
```

**Uwaga:** Pole `full_name` akceptuje dowolne znaki - użytkownik może wpisać login, pseudonim, ksywkę, imię lub cokolwiek chce.

**Schema dla żądania resetu hasła**:

```typescript
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .min(1, "Adres e-mail jest wymagany")
    .email("Nieprawidłowy format adresu e-mail")
    .toLowerCase()
    .trim(),
});
```

**Schema dla ustawiania nowego hasła**:

```typescript
export const setNewPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(1, "Nowe hasło jest wymagane")
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę")
      .regex(/[a-zA-Z]/, "Hasło musi zawierać przynajmniej jedną literę"),

    confirm_password: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Hasła muszą być identyczne",
    path: ["confirm_password"],
  });
```

##### Komunikaty błędów API

**Mapowanie błędów Supabase na przyjazne komunikaty** (`/src/lib/utils/authErrors.ts`):

```typescript
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Login errors
  invalid_credentials: "Nieprawidłowy adres e-mail lub hasło",
  email_not_confirmed: "Potwierdź swój adres e-mail przed zalogowaniem",
  user_not_found: "Nie znaleziono użytkownika o podanym adresie e-mail",

  // Signup errors
  user_already_exists: "Użytkownik o tym adresie e-mail już istnieje",
  email_exists: "Ten adres e-mail jest już zarejestrowany",
  weak_password: "Hasło jest zbyt słabe. Użyj co najmniej 8 znaków, w tym cyfry i litery",

  // Password reset errors
  same_password: "Nowe hasło musi być inne niż poprzednie",
  invalid_token: "Link resetujący hasło wygasł lub jest nieprawidłowy",

  // OAuth errors
  oauth_provider_error: "Wystąpił błąd podczas logowania przez Google",
  oauth_callback_error: "Nie udało się zakończyć logowania przez Google",

  // Generic errors
  network_error: "Błąd połączenia. Sprawdź połączenie internetowe i spróbuj ponownie",
  server_error: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę",
  unknown_error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie",
};

export function getAuthErrorMessage(error: any): string {
  const errorCode = error?.code || error?.error_code || error?.message;
  return AUTH_ERROR_MESSAGES[errorCode] || AUTH_ERROR_MESSAGES["unknown_error"];
}
```

##### Komunikaty sukcesu

**Po rejestracji:**

```
"Konto utworzone! Sprawdź swoją skrzynkę e-mail i kliknij w link aktywacyjny."
```

**Po wysłaniu linku resetującego:**

```
"Link do resetowania hasła został wysłany na Twój adres e-mail."
```

**Po zmianie hasła:**

```
"Hasło zostało zmienione pomyślnie. Możesz się teraz zalogować."
```

**Po potwierdzeniu e-maila:**

```
"Twój adres e-mail został potwierdzony! Możesz teraz korzystać z pełni funkcji aplikacji."
```

#### 1.1.5. Najważniejsze scenariusze użytkownika

##### Scenariusz 1: Rejestracja przez e-mail i hasło

1. Użytkownik wchodzi na `/signup`
2. Wypełnia formularz: imię i nazwisko, e-mail, hasło, potwierdzenie hasła
3. Kliknięcie "Zarejestruj się" wywołuje walidację Zod
4. Jeśli walidacja OK: wywołanie `supabase.auth.signUp()`
5. Supabase wysyła e-mail weryfikacyjny
6. Wyświetlenie komunikatu o konieczności potwierdzenia e-maila
7. Użytkownik klika link w e-mailu → przekierowanie na `/auth/confirm?token=...`
8. SSR weryfikuje token przez `verifyOtp()`
9. Po sukcesie: przekierowanie na `/` (dashboard)

##### Scenariusz 2: Rejestracja przez Google OAuth

1. Użytkownik wchodzi na `/signup`
2. Kliknięcie "Kontynuuj z Google"
3. Wywołanie `signInWithOAuth({ provider: 'google' })`
4. Przekierowanie na stronę Google do uwierzytelnienia
5. Po zatwierdzeniu: callback na `/auth/callback`
6. Middleware Exchange code za session
7. Trigger w bazie danych tworzy profil z `raw_user_meta_data`
8. Przekierowanie na `/` (dashboard)

##### Scenariusz 3: Logowanie przez e-mail i hasło

1. Użytkownik wchodzi na `/login`
2. Wypełnia formularz: e-mail, hasło
3. Kliknięcie "Zaloguj się" wywołuje walidację Zod
4. Jeśli walidacja OK: wywołanie `supabase.auth.signInWithPassword()`
5. Jeśli sukces: przekierowanie na wartość z parametru `redirect` lub `/`
6. Jeśli błąd (np. niepotwiedzony e-mail): wyświetlenie komunikatu błędu

##### Scenariusz 4: Logowanie przez Google OAuth

1. Użytkownik wchodzi na `/login`
2. Kliknięcie "Kontynuuj z Google"
3. Wywołanie `signInWithOAuth({ provider: 'google' })`
4. Przekierowanie na stronę Google do uwierzytelnienia
5. Po zatwierdzeniu: callback na `/auth/callback`
6. Middleware exchange code za session
7. Przekierowanie na wartość z parametru `redirect` lub `/`

##### Scenariusz 5: Resetowanie hasła

1. Użytkownik wchodzi na `/login` i klika "Zapomniałeś hasła?"
2. Przekierowanie na `/reset-password`
3. Wypełnia formularz: e-mail
4. Wywołanie `supabase.auth.resetPasswordForEmail()`
5. Wyświetlenie komunikatu o wysłaniu linku
6. Użytkownik klika link w e-mailu → przekierowanie na `/reset-password?type=recovery&access_token=...`
7. Formularz przełącza się w tryb "ustaw nowe hasło"
8. Użytkownik wpisuje nowe hasło i potwierdzenie
9. Wywołanie `supabase.auth.updateUser({ password: newPassword })`
10. Po sukcesie: przekierowanie na `/login` z komunikatem sukcesu

##### Scenariusz 6: Próba dostępu do chronionej strony bez logowania

1. Niezalogowany użytkownik próbuje wejść na `/groups/new`
2. Middleware sprawdza sesję: brak użytkownika
3. SSR w `/groups/new.astro` sprawdza sesję
4. Przekierowanie na `/login?redirect=/groups/new`
5. Po zalogowaniu: automatyczne przekierowanie na `/groups/new`

##### Scenariusz 7: Wylogowanie

1. Zalogowany użytkownik klika ikonę użytkownika w nagłówku
2. W dropdown menu wybiera "Wyloguj się"
3. Wywołanie `supabase.auth.signOut()`
4. Przekierowanie na `/login`
5. Sesja wygaszona, cookie usunięty

---

## 2. LOGIKA BACKENDOWA

### 2.1. Middleware Astro

#### Aktualizacja `/src/middleware/index.ts`

**Odpowiedzialności:**

- Inicjalizacja klienta Supabase z cookies dla SSR
- Sprawdzenie sesji użytkownika
- Dodanie klienta Supabase i danych użytkownika do `context.locals`
- Ochrona chronionych tras (przekierowanie na `/login`)
- Obsługa callback OAuth
- Obsługa refresh token

**Implementacja:**

```typescript
import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/reset-password", "/about", "/auth/callback", "/auth/confirm"];

// Check if path matches public route (including dynamic segments)
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

// Validate redirect URL to prevent Open Redirect vulnerability
function isValidRedirectUrl(url: string): boolean {
  if (!url) return false;

  // Must start with / (internal path)
  if (!url.startsWith("/")) return false;

  // Cannot start with // (protocol-relative URL)
  if (url.startsWith("//")) return false;

  // Cannot contain :// (absolute URL)
  if (url.includes("://")) return false;

  return true;
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with cookie handling for SSR
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return context.cookies.get(key)?.value;
        },
        set(key, value, options) {
          context.cookies.set(key, value, options);
        },
        remove(key, options) {
          context.cookies.delete(key, options);
        },
      },
    }
  );

  // Add Supabase client to context.locals
  context.locals.supabase = supabase;

  // Get current session
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // Set user in context.locals
  if (session?.user) {
    context.locals.user = {
      id: session.user.id,
      email: session.user.email!,
    };
  } else {
    context.locals.user = null;
  }

  const pathname = context.url.pathname;

  // Allow access to public routes
  if (isPublicRoute(pathname)) {
    return next();
  }

  // Allow access to static assets
  if (pathname.startsWith("/_") || pathname.includes(".")) {
    return next();
  }

  // Protect all other routes
  if (!session) {
    // Build redirect path with search params
    const redirectPath = pathname + context.url.search;

    // Only add redirect param if it's a valid internal URL
    if (isValidRedirectUrl(redirectPath)) {
      return context.redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }

    // Fallback to login without redirect for invalid URLs
    return context.redirect("/login");
  }

  // Continue to the page
  return next();
});
```

**Typy dla context.locals** (`/src/env.d.ts`):

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    supabase: import("@supabase/supabase-js").SupabaseClient<import("./db/database.types").Database>;
    user: {
      id: string;
      email: string;
    } | null;
  }
}
```

### 2.2. Endpoint OAuth Callback

#### Utworzenie `/src/pages/auth/callback.ts`

**Cel:** Obsługa callback z Google OAuth i exchange code za session.

**Odpowiedzialności:**

- Odczyt parametru `code` z URL
- Exchange code za session przez `exchangeCodeForSession()`
- Ustawienie cookie sesji
- Przekierowanie na dashboard lub wartość z parametru `redirect`

**Implementacja:**

```typescript
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, cookies, locals, redirect }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";
  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Handle OAuth errors
  if (errorParam) {
    const encodedError = encodeURIComponent(errorDescription || errorParam);
    return redirect(`/login?error=${encodedError}`);
  }

  // Exchange code for session
  if (code) {
    const supabase = locals.supabase;
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    // Successful authentication - redirect to next page
    return redirect(next);
  }

  // No code provided - redirect to login
  return redirect("/login?error=missing_code");
};

export const prerender = false;
```

### 2.3. Decyzja architektury: Brak endpointu `/api/profile/me`

**Uzasadnienie:**

Dla MVP nie tworzymy oddzielnego endpointu `/api/profile/me`. Zamiast tego, **dane użytkownika są pobierane w Layout.astro (SSR) i przekazywane przez props** do komponentów.

**Za tym rozwiązaniem:**

- ✅ **Mniej requestów HTTP** - lepszy performance (dane pobierane raz w SSR)
- ✅ **Prostszy kod** - brak dodatkowego endpointu do utrzymania
- ✅ **Dane już dostępne** - middleware pobiera sesję, Layout pobiera profil
- ✅ **Wystarczające dla MVP** - nie potrzebujemy dynamicznego odświeżania profilu
- ✅ **Mniej potencjalnych błędów** - mniej miejsc, gdzie coś może pójść nie tak

**Przeciw (dlaczego moglibyśmy potrzebować endpoint):**

- ❌ **Brak client-side refresh** - trzeba przeładować stronę po edycji profilu (ale to w przyszłości)
- ❌ **Brak standard RESTful API** - ale nie budujemy pełnego API, tylko MVP
- ❌ **Trudniej używać z innych miejsc** - ale na razie używamy tylko w Layout

**Implementacja w Layout.astro:**

```typescript
// Pobierz dane użytkownika z bazy gdy zalogowany
const session = await Astro.locals.supabase.auth.getSession();
let user = null;

if (session.data.session?.user) {
  // Pobierz profil z bazy danych
  const { data: profile } = await Astro.locals.supabase
    .from("profiles")
    .select("id, email, username, avatar_url")
    .eq("id", session.data.session.user.id)
    .single();

  user = profile;
}
```

**Użycie w komponentach:**

```typescript
// W Layout.astro
<UserMenu user={user} client:load />

// W UserMenu.tsx
interface UserMenuProps {
  user: AuthUserWithProfile
}
```

**Przyszłość:** Gdy dodamy funkcję edycji profilu, możemy wtedy rozważyć dodanie endpointu dla dynamicznej aktualizacji danych.

### 2.4. Rozszerzenie typów dla DTO

#### Aktualizacja `/src/types.ts`

**Dodanie typów związanych z autentykacją:**

```typescript
// ============================================================================
// Authentication DTOs
// ============================================================================

/**
 * Login credentials
 * Used in: LoginForm component
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Signup credentials
 * Used in: SignupForm component
 */
export interface SignupCredentials {
  full_name: string; // Nazwa użytkownika - może być login, pseudonim, itp.
  email: string;
  password: string;
  confirm_password: string;
}

/**
 * Password reset request
 * Used in: ResetPasswordForm component
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Set new password
 * Used in: ResetPasswordForm component
 */
export interface SetNewPassword {
  new_password: string;
  confirm_password: string;
}

/**
 * Authenticated user info with profile data
 * Passed as props to components from SSR
 */
export interface AuthUserWithProfile {
  id: string;
  email: string;
  full_name: string | null; // Nazwa użytkownika (login, pseudonim, itp.)
  avatar_url: string | null;
}
```

### 2.5. Obsługa walidacji danych wejściowych

**Wszystkie schematy walidacyjne znajdują się w:**

- `/src/lib/schemas/authSchemas.ts` - schematy dla autentykacji (nowy plik)

**Walidacja odbywa się:**

- **Po stronie klienta:** React Hook Form + Zod (natychmiastowy feedback)
- **Po stronie serwera:** Supabase Auth zajmuje się walidacją (bezpieczeństwo)

**Podejście:**

- Schematy po stronie klienta zawierają komunikaty w języku polskim
- Błędy API są mapowane na przyjazne komunikaty przez `getAuthErrorMessage()`

### 2.6. Obsługa wyjątków

#### Strategia obsługi błędów

**Poziom 1: Walidacja klienta**

- Zod schemas wychwytują błędy walidacji przed wysłaniem request
- Błędy wyświetlane bezpośrednio pod polami formularza
- Przyciski submit disabled podczas błędów walidacji

**Poziom 2: Błędy API**

- Try-catch w funkcjach wywołujących Supabase Auth
- Mapowanie błędów Supabase na przyjazne komunikaty
- Wyświetlanie błędów jako alert nad formularzem

**Poziom 3: Błędy sieciowe**

- Obsługa błędów network (brak internetu)
- Timeout dla długo trwających requestów
- Retry mechanism dla kluczowych operacji (opcjonalnie)

**Poziom 4: Błędy middleware**

- Middleware przekierowuje na `/login` w przypadku braku sesji
- Błędy OAuth przekierowują na `/login` z parametrem error

#### Przykładowa implementacja obsługi błędów w komponencie

```typescript
// W LoginForm.tsx

// Helper function to validate redirect URL (same as in middleware)
function isValidRedirectUrl(url: string): boolean {
  if (!url) return false;
  if (!url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  if (url.includes("://")) return false;
  return true;
}

async function handleLogin(data: LoginCredentials) {
  setIsLoading(true);
  setError(null);

  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Map Supabase error to user-friendly message
      setError(getAuthErrorMessage(error));
      return;
    }

    // Success - redirect with validation
    const redirectParam = searchParams.get("redirect");
    const redirectTo = isValidRedirectUrl(redirectParam) ? redirectParam : "/";
    window.location.href = redirectTo;
  } catch (err) {
    // Network or unexpected error
    setError(AUTH_ERROR_MESSAGES["network_error"]);
  } finally {
    setIsLoading(false);
  }
}
```

### 2.7. Aktualizacja renderowania stron SSR

#### Wzorzec dla chronionych stron Astro

**Wszystkie chronione strony powinny zawierać:**

```typescript
---
// Przykład: /src/pages/groups/new.astro

import Layout from '@/layouts/Layout.astro'
import CreateGroupForm from '@/components/group/CreateGroupForm'

// Check authentication
const session = await Astro.locals.supabase.auth.getSession()
const user = session.data.session?.user

if (!user) {
  const currentPath = Astro.url.pathname
  return Astro.redirect(`/login?redirect=${encodeURIComponent(currentPath)}`)
}
---

<Layout title="Utwórz grupę | Billzilla">
  <CreateGroupForm currentUserId={user.id} client:load />
</Layout>
```

**Wzorzec dla stron publicznych (login, signup):**

```typescript
---
// Przykład: /src/pages/login.astro

import Layout from '@/layouts/Layout.astro'
import LoginForm from '@/components/auth/LoginForm'

// Helper function to validate redirect URL
function isValidRedirectUrl(url: string | null): boolean {
  if (!url) return false
  if (!url.startsWith('/')) return false
  if (url.startsWith('//')) return false
  if (url.includes('://')) return false
  return true
}

// If already logged in, redirect to dashboard
const session = await Astro.locals.supabase.auth.getSession()
const user = session.data.session?.user

if (user) {
  return Astro.redirect('/')
}

// Get redirect param and error messages from URL
const redirectParam = Astro.url.searchParams.get('redirect')
const redirect = isValidRedirectUrl(redirectParam) ? redirectParam : '/'
const error = Astro.url.searchParams.get('error') || undefined
---

<Layout title="Zaloguj się | Billzilla">
  <LoginForm redirectTo={redirect} errorMessage={error} client:load />
</Layout>
```

---

## 3. SYSTEM AUTENTYKACJI

### 3.1. Architektura Supabase Auth

#### 3.1.1. Konfiguracja Supabase

**Zmienne środowiskowe (`.env`):**

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site URL for OAuth callbacks
PUBLIC_SITE_URL=http://localhost:3000
```

**Konfiguracja w Supabase Dashboard:**

1. **Authentication Settings:**
   - Enable Email provider
   - Enable Google OAuth provider
   - Set Site URL: `http://localhost:3000` (dev) / `https://your-domain.com` (prod)
   - Set Redirect URLs:
     - `http://localhost:3000/auth/callback` (dev)
     - `https://your-domain.com/auth/callback` (prod)

2. **Email Templates (dostosowanie):**
   - **Confirm signup:** Link kieruje na `/auth/confirm?token_hash={{ .TokenHash }}&type=email`
   - **Reset password:** Link kieruje na `/reset-password?token_hash={{ .TokenHash }}&type=recovery`
   - **Magic link:** (opcjonalnie w przyszłości)

3. **Google OAuth Configuration:**
   - Utworzenie projektu w Google Cloud Console
   - Włączenie Google+ API
   - Utworzenie OAuth 2.0 credentials
   - Dodanie authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
   - Skopiowanie Client ID i Client Secret do Supabase Dashboard

#### 3.1.2. Klient Supabase dla SSR

**Aktualizacja `/src/db/supabase.client.ts`:**

```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Browser client (for client-side React components)
export function createClient() {
  return createBrowserClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
}

export type SupabaseClient = ReturnType<typeof createClient>;
```

**Użycie w komponentach React:**

```typescript
// W komponencie React
import { createClient } from '@/db/supabase.client'

function MyComponent() {
  const supabase = createClient()

  // Użycie klienta
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({...})
  }
}
```

**Użycie w middleware i stronach Astro:**

```typescript
// Middleware tworzy server client i dodaje do locals
// W stronach Astro używamy:
const supabase = Astro.locals.supabase;
```

#### 3.1.3. Session Management

**Strategie zarządzania sesją:**

1. **Cookie-based sessions:**
   - Supabase przechowuje session w secure HTTP-only cookies
   - Automatyczne odświeżanie tokenu przez middleware
   - Bezpieczne dla SSR i client-side

2. **Session refresh:**
   - Middleware sprawdza sesję przy każdym request
   - Automatyczne odświeżanie wygasających tokenów
   - Obsługa expired sessions (przekierowanie na login)

3. **Logout:**
   - Wywołanie `supabase.auth.signOut()` usuwa sesję
   - Cookies są czyszczone automatycznie
   - Przekierowanie na `/login`

**Implementacja refresh w middleware:**

```typescript
// W middleware
const {
  data: { session },
  error,
} = await supabase.auth.getSession();

// Supabase SDK automatycznie odświeża token jeśli potrzeba
// Cookies są aktualizowane przez callbacki set/remove
```

### 3.2. Flow autentykacji

#### 3.2.1. Rejestracja przez E-mail/Hasło

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. GET /signup
       ▼
┌─────────────────┐
│  signup.astro   │  (SSR)
│  - Check if     │
│    logged in    │
│  - Render form  │
└────────┬────────┘
         │
         │ 2. Render
         ▼
┌─────────────────┐
│ SignupForm.tsx  │  (Client)
└────────┬────────┘
         │
         │ 3. User fills form
         │ 4. Validate with Zod
         │
         │ 5. supabase.auth.signUp({
         │      email,
         │      password,
         │      options: {
         │        data: { full_name }
         │      }
         │    })
         ▼
┌─────────────────┐
│  Supabase Auth  │
│  - Create user  │
│  - Send email   │
└────────┬────────┘
         │
         │ 6. Trigger: on_auth_user_created
         ▼
┌─────────────────┐
│   Database      │
│  - Insert into  │
│    profiles     │
└────────┬────────┘
         │
         │ 7. Show success message
         ▼
┌─────────────────┐
│   User sees     │
│  "Check email"  │
└─────────────────┘
         │
         │ 8. User clicks link in email
         ▼
┌─────────────────┐
│ /auth/confirm   │  (SSR)
│  - verifyOtp()  │
│  - Set session  │
│  - Redirect to  │
│    dashboard    │
└─────────────────┘
```

#### 3.2.2. Logowanie przez E-mail/Hasło

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. GET /login
       ▼
┌─────────────────┐
│   login.astro   │  (SSR)
│  - Check if     │
│    logged in    │
│  - Render form  │
└────────┬────────┘
         │
         │ 2. Render
         ▼
┌─────────────────┐
│  LoginForm.tsx  │  (Client)
└────────┬────────┘
         │
         │ 3. User fills form
         │ 4. Validate with Zod
         │
         │ 5. supabase.auth.signInWithPassword({
         │      email,
         │      password
         │    })
         ▼
┌─────────────────┐
│  Supabase Auth  │
│  - Verify creds │
│  - Create sess  │
│  - Set cookies  │
└────────┬────────┘
         │
         │ 6. Success response
         ▼
┌─────────────────┐
│  LoginForm.tsx  │
│  - Redirect to  │
│    dashboard or │
│    redirect URL │
└─────────────────┘
```

#### 3.2.3. Google OAuth Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Click "Continue with Google"
       ▼
┌─────────────────────┐
│ GoogleOAuthButton   │
│  signInWithOAuth({  │
│    provider: google │
│  })                 │
└──────┬──────────────┘
       │
       │ 2. Redirect to Google
       ▼
┌─────────────────┐
│  Google OAuth   │
│  - User login   │
│  - Consent      │
└────────┬────────┘
         │
         │ 3. Callback with code
         ▼
┌──────────────────────┐
│ /auth/callback (API) │
│  - exchangeCodeFor   │
│    Session(code)     │
└──────┬───────────────┘
        │
        │ 4. Exchange successful
        ▼
┌─────────────────┐
│  Supabase Auth  │
│  - Create sess  │
│  - Set cookies  │
└────────┬────────┘
         │
         │ 5. Trigger (if new user)
         ▼
┌─────────────────┐
│   Database      │
│  - Insert into  │
│    profiles     │
│    (from OAuth  │
│     metadata)   │
└────────┬────────┘
         │
         │ 6. Redirect to dashboard
         ▼
┌─────────────────┐
│   Dashboard     │
└─────────────────┘
```

#### 3.2.4. Resetowanie hasła

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Click "Forgot password?"
       ▼
┌──────────────────────┐
│ /reset-password      │  (SSR)
│  mode: 'request'     │
└──────┬───────────────┘
       │
       │ 2. Render
       ▼
┌──────────────────────┐
│ ResetPasswordForm    │
│  - User enters email │
└──────┬───────────────┘
       │
       │ 3. resetPasswordForEmail(email)
       ▼
┌─────────────────┐
│  Supabase Auth  │
│  - Send email   │
└────────┬────────┘
         │
         │ 4. Show "Check email"
         ▼
┌─────────────────┐
│   User sees     │
│  success msg    │
└─────────────────┘
         │
         │ 5. User clicks link in email
         ▼
┌──────────────────────┐
│ /reset-password      │  (SSR)
│  ?type=recovery      │
│  &access_token=...   │
│  mode: 'reset'       │
└──────┬───────────────┘
       │
       │ 6. Render password form
       ▼
┌──────────────────────┐
│ ResetPasswordForm    │
│  - User enters new   │
│    password          │
└──────┬───────────────┘
       │
       │ 7. updateUser({ password })
       ▼
┌─────────────────┐
│  Supabase Auth  │
│  - Update pass  │
└────────┬────────┘
         │
         │ 8. Success - redirect to login
         ▼
┌─────────────────┐
│    /login       │
│  with success   │
│    message      │
└─────────────────┘
```

### 3.3. Row Level Security (RLS) i Database Triggers

**Polityki RLS nie wymagają zmian** - obecna implementacja już zabezpiecza dane:

- Tabela `profiles`: użytkownicy mogą odczytać swój profil i profile członków swoich grup
- Tabele grupowe: dostęp tylko dla członków grupy
- Trigger `handle_new_user` automatycznie tworzy profil po rejestracji

**Weryfikacja polityk dla autentykacji:**

```sql
-- profiles: użytkownik może odczytać swój profil
create policy "allow_read_own_profile" on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- profiles: użytkownik może zaktualizować swój profil
create policy "allow_update_own_profile" on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()));
```

**Te polityki już istnieją lub są pokryte przez obecne polityki RLS.**

#### Opcjonalna aktualizacja triggera `handle_new_user`

**OPCJONALNE ULEPSZENIE:** Możemy zaktualizować trigger, aby aktualizował dane przy każdym logowaniu (szczególnie przydatne dla OAuth).

**Obecna implementacja (działa dobrze):**

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer set search_path = '';
```

**Ulepszenie (opcjonalne - dla aktualizacji danych przy każdym logowaniu):**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Aktualizuj dane przy każdym logowaniu (przydatne dla OAuth)
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
```

**Zalety ulepszonej wersji:**

- Gdy użytkownik loguje się przez Google OAuth, jego dane mogą się aktualizować (np. zmienił avatar w Google)
- Trigger działa przy każdym logowaniu, nie tylko pierwszym
- `COALESCE` zapewnia, że nie nadpiszemy istniejących danych NULL-em

**Decyzja:** To ulepszenie nie jest wymagane dla MVP. Możesz zostawić obecny trigger - działa prawidłowo.

### 3.4. Obsługa E-maili

**Supabase automatycznie obsługuje wysyłanie e-maili:**

1. **E-mail weryfikacyjny po rejestracji:**
   - Template: "Confirm your signup"
   - Zawiera link: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

2. **E-mail resetowania hasła:**
   - Template: "Reset Password"
   - Zawiera link: `{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery`

**Dostosowanie szablonów w Supabase Dashboard:**

- Zmiana treści, stylu i języka e-maili
- Dodanie logo aplikacji
- Personalizacja linków przekierowujących

**Opcjonalnie:** W przyszłości można przełączyć się na niestandardowego dostawcę e-mail (SendGrid, Resend) przez Supabase Edge Functions.

### 3.5. Bezpieczeństwo

#### 3.5.1. Ochrona przed atakami

**CSRF Protection:**

- Supabase używa SameSite cookies
- Middleware weryfikuje origin requests

**XSS Protection:**

- React automatycznie escapuje dane wejściowe
- Supabase sanitizuje dane przechowywane w bazie

**SQL Injection:**

- Supabase używa prepared statements
- RLS zapobiega nieautoryzowanemu dostępowi

**Open Redirect Protection:**

- Walidacja wszystkich redirect URL przez funkcję `isValidRedirectUrl()`
- Akceptowane tylko wewnętrzne ścieżki (zaczynające się od `/`)
- Odrzucenie URL-i zewnętrznych, protocol-relative i z `javascript:` protocol
- Fallback na `/` dla nieprawidłowych redirect URL
- Implementacja w middleware, stronach Astro i komponentach React

**Brute Force Protection:**

- Supabase limituje liczbę prób logowania
- Rate limiting na poziomie API

#### 3.5.2. Bezpieczne przechowywanie

**Hasła:**

- Supabase używa bcrypt do hashowania
- Minimum 8 znaków wymóg po stronie klienta i serwera

**Tokens:**

- JWT tokens z krótkim czasem życia (1h)
- Refresh tokens przechowywane w HTTP-only cookies
- Automatyczne odświeżanie przez middleware

**Session Cookies:**

- HTTP-only (niedostępne dla JavaScript)
- Secure flag w produkcji (tylko HTTPS)
- SameSite=Lax (ochrona przed CSRF)

### 3.6. Hooki i utility functions

#### `/src/lib/hooks/useSupabaseAuth.ts`

**Cel:** Niestandardowy hook dla dostępu do Supabase Auth w komponentach React.

```typescript
import { createClient } from "@/db/supabase.client";
import { useMemo } from "react";

export function useSupabaseAuth() {
  const supabase = useMemo(() => createClient(), []);

  return {
    supabase,
    signIn: supabase.auth.signInWithPassword,
    signUp: supabase.auth.signUp,
    signOut: supabase.auth.signOut,
    signInWithOAuth: supabase.auth.signInWithOAuth,
    resetPassword: supabase.auth.resetPasswordForEmail,
    updateUser: supabase.auth.updateUser,
  };
}
```

#### `/src/lib/hooks/useAuthForm.ts`

**Cel:** Hook do zarządzania stanem formularzy autentykacji.

```typescript
import { useState } from "react";
import type { ZodSchema } from "zod";

export function useAuthForm<T>(schema: ZodSchema<T>) {
  const [formData, setFormData] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleChange = (field: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const reset = () => {
    setFormData({});
    setErrors({});
    setApiError(null);
  };

  return {
    formData,
    errors,
    isLoading,
    apiError,
    setIsLoading,
    setApiError,
    handleChange,
    validate,
    reset,
  };
}
```

#### `/src/lib/utils/authErrors.ts`

**Cel:** Mapowanie błędów Supabase na przyjazne komunikaty (już opisane w sekcji 1.1.4).

#### `/src/lib/utils/redirectValidation.ts`

**Cel:** Walidacja redirect URL dla ochrony przed Open Redirect vulnerability.

```typescript
/**
 * Validates that a redirect URL is safe (internal to the application)
 * Prevents Open Redirect vulnerability by rejecting external URLs
 *
 * @param url - The redirect URL to validate
 * @returns true if URL is a valid internal path, false otherwise
 *
 * @example
 * isValidRedirectUrl('/groups/123')        // ✅ true - valid internal path
 * isValidRedirectUrl('/groups/123?tab=1')  // ✅ true - with query params
 * isValidRedirectUrl('https://evil.com')   // ❌ false - external URL
 * isValidRedirectUrl('//evil.com')         // ❌ false - protocol-relative
 * isValidRedirectUrl('javascript:alert(1)') // ❌ false - javascript: protocol
 */
export function isValidRedirectUrl(url: string | null | undefined): boolean {
  // Null/undefined/empty check
  if (!url) return false;

  // Must start with / (internal path)
  if (!url.startsWith("/")) return false;

  // Cannot start with // (protocol-relative URL)
  if (url.startsWith("//")) return false;

  // Cannot contain :// (absolute URL with protocol)
  if (url.includes("://")) return false;

  return true;
}
```

**Użycie:**

- W middleware (`/src/middleware/index.ts`)
- W stronach Astro (`/src/pages/login.astro`, `/src/pages/auth/callback.ts`)
- W komponentach React (`LoginForm.tsx`, `GoogleOAuthButton.tsx`)
- W chronionych stronach Astro podczas przekierowań

---

## 4. HARMONOGRAM IMPLEMENTACJI

### Faza 1: Przygotowanie infrastruktury (1-2 dni)

1. Instalacja zależności: `@supabase/ssr`, `@supabase/auth-helpers-react`
2. Konfiguracja Supabase w Dashboard (OAuth, Email templates)
3. Utworzenie zmiennych środowiskowych
4. Aktualizacja typów w `env.d.ts`

### Faza 2: Middleware i routing (1 dzień)

1. Aktualizacja middleware dla SSR auth
2. Utworzenie endpoint `/auth/callback`
3. Utworzenie endpoint `/auth/confirm`
4. Aktualizacja Layout.astro do pobierania danych użytkownika (zamiast endpoint /me)

### Faza 3: Komponenty i strony auth (3-4 dni)

1. Utworzenie schematów Zod (`authSchemas.ts`)
2. Utworzenie hooków (`useSupabaseAuth`, `useAuthForm`)
3. Utworzenie utility functions (`authErrors.ts`, `redirectValidation.ts`)
4. Komponent `GoogleOAuthButton`
5. Komponent `LoginForm`
6. Strona `/login.astro`
7. Komponent `SignupForm`
8. Strona `/signup.astro`
9. Komponent `ResetPasswordForm`
10. Strona `/reset-password.astro`

### Faza 4: Integracja z layoutem (1 dzień)

1. Komponent `UserMenu`
2. Komponent `LogoutButton`
3. Aktualizacja `Layout.astro` (nagłówek z UserMenu)
4. Aktualizacja wszystkich chronionych stron (użycie prawdziwej sesji)

### Faza 5: Testowanie i optymalizacja (2-3 dni)

1. Testy manualne wszystkich flow
2. Testy edge cases (expired tokens, błędy sieci)
3. Testy responsywności (mobile, tablet, desktop)
4. Accessibility audit
5. Performance optimization (lazy loading, code splitting)

### Faza 6: Dokumentacja (1 dzień)

1. Aktualizacja README.md
2. Dokumentacja zmiennych środowiskowych
3. Guide dla konfiguracji Google OAuth
4. Troubleshooting guide

---

## 5. ZGODNOŚĆ Z ISTNIEJĄCĄ ARCHITEKTURĄ

### 5.1. Zachowanie obecnej funkcjonalności

**Nie naruszamy istniejących funkcji:**

- Dashboard (`/src/pages/index.astro`) - tylko aktualizacja sprawdzania użytkownika
- Grupy (`/src/pages/groups/*`) - tylko aktualizacja sprawdzania użytkownika
- Komponenty grup (`/src/components/group/*`) - bez zmian
- Komponenty dashboard (`/src/components/dashboard/*`) - bez zmian
- Serwisy (`/src/lib/services/*`) - bez zmian
- API endpoints (`/src/pages/api/*`) - bez zmian (już używają `locals.user`)

### 5.2. Migracja z mock user

**Usunięcie mock user z middleware:**

```typescript
// PRZED (obecne)
const MOCK_USER_ENABLED = true;
const MOCK_USER = { id: "...", email: "..." };

// PO (docelowe)
// Całkowite usunięcie logiki mock user
// Użycie prawdziwej sesji Supabase
```

**Aktualizacja użycia `Astro.locals.user`:**

- Wszystkie miejsca używające `Astro.locals.user` będą działać bez zmian
- Typ `AuthUser` jest zgodny z poprzednim typem mock user
- Żadne API endpoints nie wymagają zmian

### 5.3. Kompatybilność z bazą danych

**Obecna struktura bazy już wspiera autentykację:**

- Tabela `profiles` z foreign key do `auth.users`
- Trigger `handle_new_user` automatycznie tworzy profile
- RLS policies już zabezpieczają dane
- Funkcje pomocnicze (`is_group_member`) działają z `auth.uid()`

**Brak wymaganych migracji dla MVP:**

- Pole `full_name` w bazie pozostaje bez zmian
- Trigger `handle_new_user` działa poprawnie
- Opcjonalne ulepszenie triggera opisane w sekcji 3.3 (ON CONFLICT DO UPDATE)

### 5.4. Zgodność ze stack technologicznym

**Astro 5:**

- Middleware działa w trybie SSR (server output)
- Strony używają `export const prerender = false` dla dynamicznych tras
- Cookies są obsługiwane przez Astro.cookies

**React 19:**

- Komponenty auth używane jako Astro Islands (`client:load`)
- Hooki React kompatybilne z React 19
- Nie używamy deprecated features

**TypeScript 5:**

- Wszystkie nowe pliki w pełni typowane
- Wykorzystanie `Database` types z Supabase
- Brak użycia `any` (tylko w catch blocks jako `unknown`)

**Tailwind 4:**

- Komponenty auth używają tych samych utility classes
- Zgodność z istniejącymi komponentami shadcn/ui

**Shadcn/ui:**

- Wykorzystanie istniejących komponentów: Input, Button, Label, Alert, Card
- Dodanie DropdownMenu dla UserMenu (jeśli nie istnieje)

---

## 6. CHECKLISTY AKCEPTACJI

### 6.1. Wymagania funkcjonalne

#### US-001: Rejestracja i logowanie przez e-mail/hasło

- [ ] Strona `/signup` z formularzem rejestracji
- [ ] Walidacja: min. 8 znaków hasła
- [ ] E-mail weryfikacyjny wysyłany po rejestracji
- [ ] Użytkownik musi potwierdzić e-mail przed pełnym dostępem
- [ ] Strona `/login` z formularzem logowania
- [ ] Komunikaty błędów przy błędnych danych

#### US-001a: Logowanie przez Google OAuth

- [ ] Przycisk "Kontynuuj z Google" na `/login` i `/signup`
- [ ] Przekierowanie do Google OAuth
- [ ] Pomyślne logowanie tworzy sesję
- [ ] Automatyczne utworzenie konta dla nowych użytkowników
- [ ] Komunikaty błędów przy nieudanym OAuth

#### US-001b: Resetowanie hasła

- [ ] Link "Zapomniałeś hasła?" na `/login`
- [ ] Strona `/reset-password` z formularzem
- [ ] E-mail z linkiem resetującym
- [ ] Formularz ustawiania nowego hasła
- [ ] Walidacja nowego hasła (min. 8 znaków)

#### US-001c: Ochrona dostępu

- [ ] Strony publiczne: `/login`, `/signup`, `/reset-password`, `/about`
- [ ] Wszystkie inne strony wymagają logowania
- [ ] Przekierowanie na `/login` przy próbie dostępu bez sesji
- [ ] Przekierowanie z powrotem na żądaną stronę po zalogowaniu
- [ ] Zalogowani użytkownicy mają pełny dostęp

### 6.2. Wymagania niefunkcjonalne

#### Bezpieczeństwo

- [ ] Hasła hashowane przez Supabase (bcrypt)
- [ ] Session cookies są HTTP-only i Secure
- [ ] RLS policies chronią dane użytkowników
- [ ] CSRF protection przez SameSite cookies
- [ ] Rate limiting na poziomie Supabase

#### Accessibility

- [ ] Wszystkie formularze dostępne przez klawiaturę
- [ ] Odpowiednie aria-labels i role
- [ ] Komunikaty błędów ogłaszane przez screen readers
- [ ] Kontrast kolorów WCAG AA
- [ ] Focus states widoczne

#### UX

- [ ] Komunikaty błędów w języku polskim
- [ ] Przyjazne komunikaty (nie techniczne)
- [ ] Loading states podczas requestów
- [ ] Success feedback po akcjach
- [ ] Responsywność (mobile, tablet, desktop)

---

## 7. PODSUMOWANIE

Specyfikacja obejmuje kompletny system autentykacji i autoryzacji dla aplikacji Billzilla, zgodny z wymaganiami z PRD (US-001, US-001a, US-001b, US-001c) i stack technologiczny.

### Kluczowe elementy architektury:

1. **Frontend:**
   - Strony Astro SSR dla renderowania formularzy i weryfikacji sesji
   - Komponenty React dla interaktywności (formularze, OAuth buttons)
   - Walidacja Zod po stronie klienta
   - Przyjazne komunikaty błędów w języku polskim

2. **Backend:**
   - Middleware Astro dla ochrony tras i zarządzania sesją
   - Endpoints dla OAuth callback i potwierdzenia e-mail
   - Supabase Auth jako backend autentykacji
   - Row Level Security dla bezpieczeństwa danych

3. **Autentykacja:**
   - E-mail/hasło z weryfikacją e-mail
   - Google OAuth
   - Resetowanie hasła
   - Session management przez cookies
   - Automatyczne odświeżanie tokenów

### Zgodność z istniejącą aplikacją:

- Nie narusza obecnej funkcjonalności
- Płynna migracja z mock user na prawdziwą autentykację
- Wykorzystanie istniejącej struktury bazy danych
- Kompatybilność z obecnym stack technologicznym
- Wykorzystanie istniejących komponentów UI

### Bezpieczeństwo i compliance:

- Bezpieczne przechowywanie haseł (bcrypt)
- HTTP-only, Secure cookies
- CSRF i XSS protection
- **Open Redirect protection** (walidacja redirect URL)
- Rate limiting
- RLS policies

---

## 8. ZGODNOŚĆ Z BILLZILLA UI GUIDELINES

Wszystkie komponenty autentykacji muszą być zgodne z brandingiem Billzilla opisanym w `.cursor/rules/bllzilla-ui-guidelines.md`.

### 8.1. Paleta kolorów w komponentach auth

**Primary Actions (przyciski główne):**

- Tło: `bg-primary` (#49A067)
- Tekst: `text-white`
- Hover: `hover:bg-primary-dark` (#0E2E24)

**Secondary Actions:**

- OAuth button: `bg-white border-2 border-gray-200 hover:border-primary`
- Linki: `text-primary hover:text-primary-dark`

**Backgrounds:**

- Strony login/signup: `bg-background` (#F9FAF8)
- Karty/formularze: `bg-white`
- Granice: `border-gray-100`

**Text:**

- Nagłówki: `text-foreground` (#0C2231) `font-bold tracking-tight`
- Tekst główny: `text-gray-700`
- Placeholder: `text-gray-400`
- Błędy: `text-red-600`

### 8.2. Komponenty UI (Shadcn/ui)

**Button:**

```tsx
<Button className="w-full bg-primary hover:bg-primary-dark rounded-xl transition-all duration-300">Zaloguj się</Button>
```

**Input:**

```tsx
<Input className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/40" />
```

**Card/Form Container:**

```tsx
<Card className="bg-white rounded-2xl shadow-md shadow-green-100 p-8 max-w-md mx-auto">{/* Formularz */}</Card>
```

### 8.3. Przyjazne labele i komunikaty

**Formularz rejestracji - przyjazne komunikaty:**

| Pole             | Label                   | Placeholder                           | Komunikat błędu                                                           |
| ---------------- | ----------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| full_name        | "Jak mamy Cię nazywać?" | "np. Janusz123, Kasia, MonsterSlayer" | "To pole jest wymagane" / "Nazwa musi mieć minimum 2 znaki"               |
| email            | "Adres e-mail"          | "twoj@email.com"                      | "Adres e-mail jest wymagany" / "Nieprawidłowy format"                     |
| password         | "Hasło"                 | "••••••••"                            | "Hasło musi mieć minimum 8 znaków" / "Hasło musi zawierać cyfrę i literę" |
| confirm_password | "Powtórz hasło"         | "••••••••"                            | "Hasła muszą być identyczne"                                              |

**Filozofia komunikatów:**

- ❌ NIE: "Imię i nazwisko", "Podaj swoje dane osobowe"
- ✅ TAK: "Jak mamy Cię nazywać?", "Twoja nazwa" - sugeruje elastyczność
- Pokazujemy przykłady w placeholder: login, pseudonim, ksywka
- Użytkownik może wpisać co chce - nie wymuszamy formatu

### 8.4. Layout stron auth

**Struktura typowej strony logowania/rejestracji:**

```astro
<Layout title="Zaloguj się | Billzilla" showHeader={true}>
  <main class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo dinozaura (opcjonalnie) -->
      <div class="text-center mb-8">
        <img src="/billzilla-logo.png" alt="Billzilla" class="h-20 w-20 mx-auto rounded-2xl" />
        <h1 class="mt-4 text-3xl font-bold tracking-tight text-foreground">Witaj z powrotem!</h1>
        <p class="mt-2 text-gray-600">Zaloguj się do swojego konta</p>
      </div>

      <!-- Formularz -->
      <Card className="bg-white rounded-2xl shadow-md shadow-green-100 p-8">
        <LoginForm errorMessage={error} client:load />
      </Card>

      <!-- Link do rejestracji -->
      <p class="mt-4 text-center text-sm text-gray-600">
        Nie masz konta?{" "}
        <a href="/signup" class="text-primary hover:text-primary-dark font-medium transition-colors">
          Zarejestruj się
        </a>
      </p>
    </div>
  </main>
</Layout>
```

### 8.5. Styling Google OAuth Button

**Zgodnie z Google Brand Guidelines:**

```tsx
<Button
  variant="outline"
  className="w-full rounded-xl border-2 border-gray-200 hover:border-primary bg-white transition-all duration-300"
  onClick={handleGoogleLogin}
>
  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
    {/* Google icon SVG */}
  </svg>
  Kontynuuj z Google
</Button>
```

### 8.6. Typografia

**Nagłówki:**

- H1: `text-3xl font-bold tracking-tight text-foreground`
- H2: `text-2xl font-bold tracking-tight text-foreground`
- H3: `text-xl font-semibold text-foreground`

**Body text:**

- Normal: `text-base font-normal text-gray-700`
- Small: `text-sm text-gray-600`
- Tiny: `text-xs text-gray-500`

**Labels:**

```tsx
<Label className="text-sm font-medium text-foreground">Adres e-mail</Label>
```

### 8.7. Animacje i transitions

**Wszystkie komponenty używają:**

- `transition-all duration-300 ease-out` - dla smooth transitions
- `hover:scale-105` - dla subtle scale effects (logo, przyciski)
- `hover:opacity-80` - dla linków i ikon

**Loading states:**

```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Trwa logowanie...
    </>
  ) : (
    "Zaloguj się"
  )}
</Button>
```

### 8.8. Responsywność

**Mobile-first approach:**

- Padding: `p-4` (mobile) → `sm:p-6` → `lg:p-8`
- Font sizes: `text-xl` → `sm:text-2xl` → `lg:text-3xl`
- Max widths: `max-w-md` dla formularzy na wszystkich ekranach

**Breakpoints:**

- Mobile: < 640px (default)
- Tablet: 640px - 1024px (sm:, md:)
- Desktop: > 1024px (lg:, xl:)

---

## 9. ZMIANY WYNIKAJĄCE Z FEEDBACKU

Poniżej podsumowanie kluczowych zmian wprowadzonych na podstawie feedbacku:

### 🔒 1. Bezpieczeństwo - Bezpieczna implementacja parametru redirect

**Problem:** Open Redirect Vulnerability - brak walidacji mogłaby pozwolić atakującemu na przekierowanie użytkownika na złośliwy URL

**Rozwiązanie:** Implementacja bezpiecznych przekierowań z walidacją

- **Walidacja:** Parametr `redirect` musi być wewnętrzną ścieżką (zaczynać się od `/`)
- **Ochrona:** Odrzucenie URL-i zewnętrznych (zawierających `://` lub zaczynających się od `//`)
- **Funkcja walidacyjna:**
  ```typescript
  function isValidRedirectUrl(url: string): boolean {
    if (!url) return false;
    if (!url.startsWith("/")) return false; // Must be internal path
    if (url.startsWith("//")) return false; // No protocol-relative URLs
    if (url.includes("://")) return false; // No absolute URLs
    return true;
  }
  ```
- **Zastosowanie:** Walidacja w middleware, stronach Astro i komponentach React
- **Fallback:** Jeśli redirect jest nieprawidłowy, przekierowanie na `/`
- **Zgodność z PRD:** Spełnia wymaganie US-001c o przekierowaniu na żądaną stronę po zalogowaniu

### 🎨 2. Zgodność z UI Guidelines

**Dodano:**

- Szczegółową sekcję 8 z wytycznymi stylowania
- Przykłady kodu zgodne z Billzilla branding
- Paletę kolorów (#49A067, #0E2E24, #F9FAF8, #0C2231)
- Zaokrąglenia `rounded-2xl`, animacje `duration-300 ease-out`

### 👤 3. Przyjazne komunikaty zamiast "imię i nazwisko"

**Problem:** Pole `full_name` sugerowało, że trzeba podać prawdziwe imię i nazwisko
**Rozwiązanie:** Zostawiamy `full_name` w bazie, ale zmieniamy komunikaty UI

**Zmiany w UI:**

- Label: "Jak mamy Cię nazywać?" (zamiast "Imię i nazwisko")
- Placeholder: "np. Janusz123, Kasia, MonsterSlayer"
- Walidacja: 2-50 znaków, dowolne znaki (nie tylko alfanumeryczne)
- Komunikaty błędów: "To pole jest wymagane", "Nazwa musi mieć minimum 2 znaki"

**Co NIE zmieniliśmy:**

- Nazwa pola w bazie danych pozostaje `full_name` (brak migracji!)
- Typy TypeScript używają `full_name`
- Kod używa `full_name`, tylko UI jest przyjazny

**Filozofia:** Użytkownik może wpisać login, pseudonim, ksywkę, imię lub cokolwiek chce

### 🧭 4. Uproszczenie nawigacji

**Nagłówek:**

- **Usunięto:** Linki "Zaloguj się" / "Zarejestruj się" z nagłówka
- **Dodano:** Tylko logo (dla wszystkich) + UserMenu (dla zalogowanych)
- **Uzasadnienie:** Niezalogowany użytkownik i tak jest na stronie login

**Stopka:**

- **Dodano:** Link "O aplikacji" w stopce
- **Dodano:** Linki do regulaminu i polityki prywatności
- **Uzasadnienie:** Informacje prawne w stopce to standard

**Formularze:**

- **Dodano:** Link "Masz już konto? Zaloguj się" w SignupForm
- **Dodano:** Link "Nie masz konta? Zarejestruj się" w LoginForm
- **Dodano:** Link "Zapomniałeś hasła?" w LoginForm

### 🔌 5. Rezygnacja z endpointu /api/profile/me

**Decyzja:** Przekazywanie danych przez props zamiast API endpoint

**Za:**

- ✅ Mniej requestów HTTP (lepszy performance)
- ✅ Prostszy kod (brak endpointu do utrzymania)
- ✅ Dane już dostępne w SSR
- ✅ Wystarczające dla MVP

**Implementacja:**

- Layout.astro pobiera profil z bazy w SSR
- Przekazuje dane jako props do UserMenu
- Typ `AuthUserWithProfile` dla props

**Przyszłość:** Endpoint może być dodany później dla edycji profilu

### 🔄 6. Opcjonalna aktualizacja profilu przy logowaniu Google

**Problem:** Avatar i dane mogą się zmienić w Google
**Rozwiązanie (opcjonalne dla MVP):**

- Możemy zaktualizować trigger `handle_new_user` z `ON CONFLICT DO UPDATE`
- Przy każdym logowaniu aktualizowałby dane z `raw_user_meta_data`
- `COALESCE` zapewnia, że nie nadpisujemy NULL-em

**Decyzja:** Dla MVP zostawiamy obecny trigger - działa wystarczająco dobrze. Ulepszenie opisane w sekcji 3.3.

### 📝 7. Dokumentacja

**Dodano:**

- Szczegółowe wytyczne UI dla przyjaznych komunikatów (label, placeholder)
- Opcjonalne ulepszenie triggera `handle_new_user` (nie wymagane dla MVP)
- Szczegółowe uzasadnienie decyzji architektonicznych
- Sekcję zgodności z UI Guidelines
- **Brak wymaganych migracji bazy danych!**

---

## 10. CHECKLIST PRZED IMPLEMENTACJĄ

### Baza danych:

- [ ] ✅ Brak wymaganych migracji! (pole `full_name` pozostaje bez zmian)
- [ ] (Opcjonalnie) Rozważ ulepszenie triggera `handle_new_user` z `ON CONFLICT DO UPDATE`
- [ ] Przetestuj trigger z OAuth (Google) i email/password

### Konfiguracja Supabase:

- [ ] Włącz Email provider
- [ ] Skonfiguruj Google OAuth (Client ID, Secret)
- [ ] Ustaw Site URL i Redirect URLs
- [ ] Dostosuj szablony e-mail (języki, branding)

### Zmienne środowiskowe:

- [ ] `PUBLIC_SUPABASE_URL`
- [ ] `PUBLIC_SUPABASE_ANON_KEY`
- [ ] `PUBLIC_SITE_URL`

### Zależności:

- [ ] `@supabase/ssr`
- [ ] `@supabase/supabase-js` (już zainstalowane)
- [ ] `zod` (już zainstalowane)
- [ ] `react-hook-form` (jeśli nie ma)

### Utility Functions:

- [ ] Utwórz `/src/lib/utils/authErrors.ts` z mapowaniem błędów
- [ ] Utwórz `/src/lib/utils/redirectValidation.ts` z funkcją `isValidRedirectUrl()`
- [ ] Użyj `isValidRedirectUrl()` we wszystkich miejscach obsługujących redirect

### UI Guidelines:

- [ ] Zweryfikuj kolory w `tailwind.config.ts`
- [ ] Sprawdź fonty (Inter)
- [ ] Przygotuj komponenty Shadcn/ui (Button, Input, Card, Label, Alert)
- [ ] Dodaj DropdownMenu (dla UserMenu)

### Bezpieczeństwo:

- [ ] Zaimplementuj funkcję `isValidRedirectUrl()` we wszystkich miejscach obsługujących redirect
- [ ] Przetestuj scenariusze Open Redirect (próby przekierowania na zewnętrzne URL)
- [ ] Przetestuj prawidłowe przekierowania (wewnętrzne ścieżki jak `/groups/123`)
- [ ] Przetestuj nieprawidłowe przekierowania (`//evil.com`, `https://evil.com`, `javascript:alert(1)`)
- [ ] Zweryfikuj polityki RLS
- [ ] Test rate limiting (Supabase Auth)

### Testy:

- [ ] Scenariusz rejestracji email/password
- [ ] Scenariusz logowania email/password
- [ ] Scenariusz Google OAuth (signup i login)
- [ ] Scenariusz resetowania hasła
- [ ] Scenariusz próby dostępu bez logowania
- [ ] Test walidacji formularzy (wszystkie edge cases)
- [ ] Test responsywności (mobile, tablet, desktop)
- [ ] Test accessibility (keyboard navigation, screen readers)

**Implementacja według harmonogramu zajmie około 9-13 dni roboczych.**
