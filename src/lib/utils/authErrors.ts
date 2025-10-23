/**
 * Mapowanie kodów błędów Supabase Auth na przyjazne komunikaty w języku polskim
 */
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

/**
 * Zwraca przyjazny komunikat błędu na podstawie obiektu błędu z Supabase
 * @param error - Obiekt błędu z Supabase Auth
 * @returns Przyjazny komunikat błędu w języku polskim
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!error) return AUTH_ERROR_MESSAGES["unknown_error"];

  const errorCode = error?.code || error?.error_code || error?.message;

  // Jeśli mamy gotowy komunikat dla tego kodu błędu
  if (errorCode && AUTH_ERROR_MESSAGES[errorCode]) {
    return AUTH_ERROR_MESSAGES[errorCode];
  }

  // Jeśli to błąd sieciowy
  if (error?.message?.includes("fetch") || error?.message?.includes("network")) {
    return AUTH_ERROR_MESSAGES["network_error"];
  }

  // Domyślny komunikat
  return AUTH_ERROR_MESSAGES["unknown_error"];
}

/**
 * Komunikaty sukcesu dla operacji autentykacji
 */
export const AUTH_SUCCESS_MESSAGES = {
  signup: "Konto utworzone! Sprawdź swoją skrzynkę e-mail i kliknij w link aktywacyjny.",
  passwordResetRequested: "Link do resetowania hasła został wysłany na Twój adres e-mail.",
  passwordChanged: "Hasło zostało zmienione pomyślnie. Możesz się teraz zalogować.",
  emailConfirmed: "Twój adres e-mail został potwierdzony! Możesz teraz korzystać z pełni funkcji aplikacji.",
};
