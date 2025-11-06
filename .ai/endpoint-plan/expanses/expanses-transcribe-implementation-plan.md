# API Endpoint Implementation Plan: POST /api/expenses/transcribe

## 1. Przegląd punktu końcowego

Endpoint `POST /api/expenses/transcribe` umożliwia synchroniczne przetwarzanie plików audio w celu automatycznej ekstrakcji danych wydatków przy użyciu sztucznej inteligencji. Endpoint przyjmuje plik audio oraz identyfikator grupy, przetwarza go natychmiast i zwraca wyekstrahowane dane wydatku lub błąd. Proces obejmuje dwuetapową analizę: transkrypcję mowy na tekst (Whisper) oraz ekstrakcję strukturalnych danych wydatku (LLM).

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/expenses/transcribe`
- **Typ zawartości:** `multipart/form-data`
- **Parametry:**
  - **Wymagane:**
    - `audio`: plik audio (formaty audio/\*, max 25MB)
    - `group_id`: UUID grupy (jako pole formularza lub query parameter)
  - **Opcjonalne:** brak
- **Nagłówki:**
  - `Authorization`: Bearer token (wymagany dla autoryzacji)
  - `Content-Type`: multipart/form-data

## 3. Wykorzystywane typy

- **Command Modele:**
  - `CreateExpenseCommand` - struktura danych wydatku wyekstrahowanych przez AI
- **DTOs:**
  - `TranscribeTaskResponseDTO` - odpowiedź z task_id i statusem
  - `TranscribeTaskStatusDTO` - pełny status zadania z wynikiem lub błędem
  - `TranscriptionResultDTO` - wynik transkrypcji z danymi wydatku
  - `TranscriptionErrorDTO` - szczegóły błędów transkrypcji

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** 200 OK
- **Treść odpowiedzi:** `TranscriptionResultDTO`
  ```typescript
  {
    transcription: string; // surowy tekst transkrypcji
    expense_data: CreateExpenseCommand; // wyekstrahowane dane wydatku
    confidence: number; // poziom pewności AI (0-1)
  }
  ```
- **Kody błędów:**
  - 400: Nieprawidłowe dane wejściowe
  - 401: Brak autoryzacji
  - 403: Brak dostępu do grupy
  - 404: Grupa nie istnieje
  - 413: Plik zbyt duży
  - 422: Błąd walidacji danych z AI
  - 500: Błąd serwera
  - 503: Usługa AI niedostępna

## 5. Przepływ danych

1. **Walidacja żądania:** Sprawdzenie autoryzacji, dostępu do grupy, formatu i rozmiaru pliku
2. **Synchroniczne przetwarzanie:**
   - Krok 1: Transkrypcja audio na tekst przez Whisper (timeout: 25s)
   - Krok 2: Ekstrakcja danych wydatku z kontekstem grupy przez LLM
3. **Walidacja wyniku:** Sprawdzenie poprawności wyekstrahowanych danych
4. **Zwrot wyniku:** Natychmiastowe zwrócenie danych wydatku lub błędu

## 6. Względy bezpieczeństwa

- **Autoryzacja:** Wymagany Bearer token, użytkownik musi należeć do grupy
- **Walidacja dostępu:** Sprawdzenie członkostwa w grupie przez RLS w Supabase
- **Walidacja plików:** Ograniczenie typu MIME (audio/\*), maksymalny rozmiar (25MB)
- **Bezpieczeństwo API:** Klucz Openrouter.ai przechowywany wyłącznie w Edge Function
- **Ochrona przed DoS:** Limity rozmiaru plików i timeout dla zadań AI
- **RLS w bazie:** Zapewnienie dostępu tylko do danych własnych grup

## 7. Obsługa błędów

- **400 Bad Request:** Nieprawidłowy format pliku, brak wymaganych parametrów
- **401 Unauthorized:** Brak lub nieprawidłowy token autoryzacji
- **403 Forbidden:** Użytkownik nie należy do wskazanej grupy
- **404 Not Found:** Grupa o podanym ID nie istnieje
- **413 Payload Too Large:** Plik audio przekracza limit rozmiaru
- **422 Unprocessable Entity:** AI nie mogła wyodrębnić prawidłowych danych wydatku
- **500 Internal Server Error:** Błędy serwera, baza danych, lub komunikacja z AI
- **503 Service Unavailable:** Usługa Openrouter.ai niedostępna
- **Logowanie błędów:** Szczegóły błędów AI zapisywane do systemu logowania

## 8. Wydajność

- **Synchroniczne przetwarzanie:** Endpoint przetwarza audio i zwraca wynik w jednym żądaniu
- **Timeout przetwarzania:** Maksymalny czas 25 sekund dla całego procesu AI
- **Ograniczenia plików:** Maksymalny rozmiar 25MB dla plików audio
- **Optymalizacja AI:** Wybór odpowiednich modeli dla balansu prędkość/jakość
- **Brak cache:** Wyniki nie są cachowane - każde żądanie przetwarza audio od nowa

## 9. Kroki implementacji

### Faza 1: Przygotowanie infrastruktury

1. Utworzenie schematów Zod dla walidacji (`expenseTranscriptionSchemas.ts`)
2. Implementacja nowego service `expenseTranscriptionService.ts`
3. Dodanie typów do `types.ts` jeśli potrzebne
4. Konfiguracja Edge Function w Supabase dla przetwarzania AI

### Faza 2: Implementacja endpointu API

5. Utworzenie pliku `/src/pages/api/expenses/transcribe.ts`
6. Implementacja middleware autoryzacji i walidacji
7. Logika obsługi multipart/form-data
8. Integracja z `expenseTranscriptionService`

### Faza 3: Logika biznesowa

9. Implementacja funkcji transkrypcji w Edge Function
10. Przygotowanie promptów dla modeli AI z kontekstem grupy
11. Obsługa wyników i błędów z Openrouter.ai
12. Zapis wyników do pamięci podręcznej

### Faza 4: Testowanie i optymalizacja

13. Testy jednostkowe dla walidacji i service
14. Testy integracyjne z różnymi formatami audio
15. Testy błędów i przypadków brzegowych
16. Optymalizacja wydajności i kosztów AI
17. Dokumentacja API i przykładów użycia
