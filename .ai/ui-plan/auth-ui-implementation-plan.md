# Auth UI Implementation Plan

## 1. Przegląd interfejsu autentykacji

System autentykacji Billzilla implementuje kompletny interfejs użytkownika zgodny z Billzilla UI Guidelines. Składa się z responsywnych stron Astro i interaktywnych komponentów React, zapewniających spójne doświadczenie na wszystkich urządzeniach.

## 2. Struktura stron i komponentów

### Strony Astro (Server-Side Rendered)

#### /login.astro

**Struktura:**
```
Layout.astro (showHeader: true)
└── LoginForm.tsx (client:load)
    ├── EmailPasswordLoginSection
    │   ├── Input (email)
    │   ├── Input (password)
    │   └── Button (Zaloguj się)
    ├── Separator (lub)
    └── GoogleOAuthButton
```

**Logika SSR:**
- Odczyt sesji i przekierowanie na `/` jeśli zalogowany
- Odczyt parametrów URL: `error`, `error_description`, `redirect`
- Walidacja parametru `redirect` (bezpieczeństwo Open Redirect)

#### /signup.astro

**Struktura:**
```
Layout.astro (showHeader: true)
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

#### /reset-password.astro

**Struktura:**
```
Layout.astro (showHeader: true)
└── ResetPasswordForm.tsx (client:load)
    ├── RequestResetMode
    │   ├── Input (email)
    │   └── Button (Wyślij link resetujący)
    └── SetNewPasswordMode (gdy type=recovery w URL)
        ├── Input (new_password)
        ├── Input (confirm_password)
        └── Button (Ustaw nowe hasło)
```

#### /auth/confirm.astro

**Struktura:**
```
Layout.astro (showHeader: true)
└── EmailConfirmationMessage.tsx (client:load)
    ├── SuccessState (email potwierdzony)
    └── ErrorState (błąd weryfikacji)
```

### Komponenty React (Client-Side)

#### LoginForm.tsx

**Props:**
```typescript
interface LoginFormProps {
  errorMessage?: string;
  redirectTo?: string;
}
```

**Odpowiedzialności:**
- Zarządzanie stanem formularza (email, password)
- Walidacja client-side (Zod schema)
- Wywołanie `supabase.auth.signInWithPassword()`
- Obsługa Google OAuth przez `GoogleOAuthButton`
- Wyświetlanie błędów walidacji i API
- Zarządzanie stanami ładowania
- Przekierowanie po sukcesie (walidacja redirect URL)
- Linki do rejestracji i resetowania hasła

#### SignupForm.tsx

**Props:**
```typescript
interface SignupFormProps {
  successMessage?: string;
  errorMessage?: string;
}
```

**Odpowiedzialności:**
- Zarządzanie stanem formularza (full_name, email, password, confirm_password)
- Walidacja client-side (Zod schema)
- Wywołanie `supabase.auth.signUp()`
- Obsługa Google OAuth
- Wyświetlanie komunikatu o wysłaniu e-maila weryfikacyjnego
- Wyświetlanie błędów walidacji i API
- Link do logowania

#### ResetPasswordForm.tsx

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
- Walidacja client-side
- Wyświetlanie błędów i komunikatów sukcesu

#### GoogleOAuthButton.tsx

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

#### UserMenu.tsx

**Props:**
```typescript
interface UserMenuProps {
  user: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}
```

**Odpowiedzialności:**
- Wyświetlanie avatara użytkownika (inicjały jeśli brak zdjęcia)
- Wyświetlanie nazwy i email w dropdown
- Dropdown menu z opcjami wylogowania
- Integracja z shadcn/ui DropdownMenu

## 3. Styling i paleta kolorów

### Paleta kolorów Billzilla

**Primary Actions:**
- Tło: `bg-primary` (#49A067)
- Tekst: `text-white`
- Hover: `hover:bg-primary-dark` (#0E2E24)

**Secondary Actions:**
- OAuth button: `bg-white border-2 border-gray-200 hover:border-primary`

**Backgrounds:**
- Strony auth: `bg-background` (#F9FAF8)
- Karty/formularze: `bg-white`
- Granice: `border-gray-100`

**Text:**
- Nagłówki: `text-foreground` (#0C2231) `font-bold tracking-tight`
- Tekst główny: `text-gray-700`
- Placeholder: `text-gray-400`
- Błędy: `text-red-600`

### Komponenty UI (Shadcn/ui)

#### Button
```tsx
<Button className="w-full bg-primary hover:bg-primary-dark rounded-xl transition-all duration-300">
  Zaloguj się
</Button>
```

#### Input
```tsx
<Input className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/40" />
```

#### Card/Form Container
```tsx
<Card className="bg-white rounded-2xl shadow-md shadow-green-100 p-8 max-w-md mx-auto">
  {/* Form content */}
</Card>
```

#### Label
```tsx
<Label className="text-sm font-medium text-foreground">
  Adres e-mail
</Label>
```

### Layout stron auth

**Typowa struktura strony logowania:**
```astro
<Layout title="Zaloguj się | Billzilla" showHeader={true}>
  <main class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <img src="/billzilla-logo.png" alt="Billzilla" class="h-20 w-20 mx-auto rounded-2xl" />
        <h1 class="mt-4 text-3xl font-bold tracking-tight text-foreground">
          Witaj z powrotem!
        </h1>
        <p class="mt-2 text-gray-600">Zaloguj się do swojego konta</p>
      </div>

      <!-- Form -->
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

## 4. Friendly komunikaty i etykiety

### Formularz rejestracji - przyjazne komunikaty

| Pole             | Label                   | Placeholder                           | Komunikat błędu |
|------------------|-------------------------|---------------------------------------|------------------|
| full_name        | "Jak mamy Cię nazywać?" | "np. Janusz123, Kasia, MonsterSlayer" | "To pole jest wymagane" / "Nazwa musi mieć minimum 2 znaki" |
| email            | "Adres e-mail"          | "twoj@email.com"                      | "Adres e-mail jest wymagany" / "Nieprawidłowy format" |
| password         | "Hasło"                 | "••••••••"                            | "Hasło musi mieć minimum 8 znaków" / "Hasło musi zawierać cyfrę i literę" |
| confirm_password | "Powtórz hasło"         | "••••••••"                            | "Hasła muszą być identyczne" |

### Filozofia komunikatów

- ❌ NIE: "Imię i nazwisko", "Podaj swoje dane osobowe"
- ✅ TAK: "Jak mamy Cię nazywać?", "Twoja nazwa" - sugeruje elastyczność
- Pokazujemy przykłady w placeholder: login, pseudonim, ksywka
- Użytkownik może wpisać co chce - nie wymuszamy formatu

## 5. Google OAuth Button styling

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

## 6. Typografia

### Nagłówki
- H1: `text-3xl font-bold tracking-tight text-foreground`
- H2: `text-2xl font-bold tracking-tight text-foreground`
- H3: `text-xl font-semibold text-foreground`

### Body text
- Normal: `text-base font-normal text-gray-700`
- Small: `text-sm text-gray-600`
- Tiny: `text-xs text-gray-500`

### Links
```tsx
<a href="/signup" class="text-primary hover:text-primary-dark font-medium transition-colors">
  Zarejestruj się
</a>
```

## 7. Responsywność

### Mobile-first approach

- Padding: `p-4` (mobile) → `sm:p-6` → `lg:p-8`
- Font sizes: `text-xl` → `sm:text-2xl` → `lg:text-3xl`
- Max widths: `max-w-md` dla formularzy na wszystkich ekranach

### Breakpoints

- Mobile: < 640px (default)
- Tablet: 640px - 1024px (sm:, md:)
- Desktop: > 1024px (lg:, xl:)

## 8. Loading states i animacje

### Loading buttons
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

### Transitions
Wszystkie komponenty używają:
- `transition-all duration-300 ease-out`
- `hover:scale-105` dla subtle scale effects
- `hover:opacity-80` dla linków i ikon

## 9. Obsługa błędów UI

### Błędy walidacji
- Wyświetlane pod polami formularza (czerwony tekst)
- Natychmiastowe czyszczenie błędu przy zmianie wartości pola

### Błędy API
- Wyświetlane jako alert nad formularzem
- Mapowane przez `getAuthErrorMessage()` na przyjazne komunikaty

### Success messages
- "Konto utworzone! Sprawdź swoją skrzynkę e-mail i kliknij w link aktywacyjny."
- "Link do resetowania hasła został wysłany na Twój adres e-mail."
- "Hasło zostało zmienione pomyślnie. Możesz się teraz zalogować."

## 10. Accessibility (WCAG)

### Keyboard navigation
- Wszystkie formularze dostępne z klawiatury
- Tab order logiczny i przewidywalny
- Enter do submit formularzy

### Screen readers
- Odpowiednie `aria-label` i `aria-describedby`
- Komunikaty błędów ogłaszane przez screen readers
- Focus indicators widoczne

### Semantic HTML
- Prawidłowe użycie `<label>` dla pól formularza
- Role i landmarks gdzie potrzebne
- Semantic headings (h1, h2, etc.)

### Color contrast
- Kontrast kolorów spełnia WCAG AA
- Focus states wyraźnie widoczne
- Error states wyraźnie wyróżnione

## 11. Komponenty modalne i overlay

### Loading overlay
```tsx
{isLoading && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 flex items-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span>Trwa logowanie...</span>
    </div>
  </div>
)}
```

### Error toast
```tsx
{error && (
  <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm z-50">
    <div className="flex items-center gap-2">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <p className="text-red-800">{error}</p>
    </div>
  </div>
)}
```

## 12. Form validation UX

### Real-time validation
- Walidacja przy blur (opuszczenie pola)
- Nie blokuje submit - pokazuje błędy po próbie wysłania
- Czyszczenie błędów przy wprowadzaniu poprawek

### Password strength indicator
```tsx
<div className="space-y-2">
  <Input type="password" placeholder="••••••••" />
  <div className="flex gap-1">
    <div className={`h-1 flex-1 rounded ${strength >= 1 ? 'bg-red-400' : 'bg-gray-200'}`} />
    <div className={`h-1 flex-1 rounded ${strength >= 2 ? 'bg-yellow-400' : 'bg-gray-200'}`} />
    <div className={`h-1 flex-1 rounded ${strength >= 3 ? 'bg-green-400' : 'bg-gray-200'}`} />
  </div>
  <p className="text-xs text-gray-600">
    {strength === 0 && "Hasło musi mieć minimum 8 znaków"}
    {strength === 1 && "Dodaj cyfry"}
    {strength === 2 && "Dodaj wielkie litery"}
    {strength === 3 && "Silne hasło!"}
  </p>
</div>
```

## 13. Dark mode considerations

### CSS Variables
```css
:root {
  --background: #F9FAF8;
  --foreground: #0C2231;
  --primary: #49A067;
  --primary-dark: #0E2E24;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0C2231;
    --foreground: #F9FAF8;
    --primary: #49A067;
    --primary-dark: #7BCAA8;
  }
}
```

### Conditional styling
```tsx
<div className="bg-background text-foreground">
  {/* Content adapts to theme */}
</div>
```

## 14. Etapy implementacji UI

1. **Podstawowe komponenty:**
   - Implementacja `LoginForm`, `SignupForm`, `ResetPasswordForm`
   - Styling zgodnie z paletą kolorów
   - Responsywność mobile-first

2. **Zaawansowane komponenty:**
   - `GoogleOAuthButton` z Google Brand Guidelines
   - `UserMenu` z dropdown
   - Loading states i animacje

3. **Accessibility:**
   - Dodanie aria-labels i semantic HTML
   - Keyboard navigation
   - Screen reader support

4. **Polishing:**
   - Error handling UX
   - Success states
   - Loading overlays i toasts

5. **Testing:**
   - Cross-browser testing
   - Mobile device testing
   - Accessibility audit
