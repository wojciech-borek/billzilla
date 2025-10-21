# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis Usługi

`OpenRouterService` będzie hermetyzować logikę interakcji z API OpenRouter. Jej głównym zadaniem jest wysyłanie transkrypcji głosowej wraz z kontekstem (np. lista członków grupy) do wybranego modelu LLM i otrzymywanie w odpowiedzi ustrukturyzowanych danych w formacie JSON, zgodnych z predefiniowanym schematem. Usługa ta będzie kluczowym elementem funkcji dodawania wydatków za pomocą głosu (US-006).

Usługa będzie działać wyłącznie po stronie serwera (w ramach Astro API Routes lub Supabase Edge Functions), aby chronić klucz API i zarządzać logiką biznesową w bezpiecznym środowisku.

## 2. Opis Konstruktora

Konstruktor będzie odpowiedzialny za inicjalizację usługi i sprawdzenie jej podstawowej konfiguracji.

```typescript
interface OpenRouterServiceConfig {
  apiKey?: string;
}

class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string = "https://openrouter.ai/api/v1";

  constructor(config: OpenRouterServiceConfig = {}) {
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;

    if (!this.apiKey) {
      // Błąd jest rzucany natychmiast, jeśli brakuje klucza API
      throw new Error("OPENROUTER_API_KEY is not set in environment variables.");
    }
  }
}
```

- **Cel:** Upewnienie się, że usługa jest poprawnie skonfigurowana z kluczem API od samego początku. Rzucenie błędu na wczesnym etapie zapobiega próbom wykonania nieautoryzowanych zapytań.
- **Parametry:**
  - `config` (opcjonalny): Obiekt konfiguracyjny, który pozwala na nadpisanie domyślnego zachowania (np. wstrzyknięcie klucza API w testach jednostkowych). Domyślnie klucz jest pobierany ze zmiennych środowiskowych.

## 3. Metody i Pola Publiczne

### `async extractExpenseData<T extends z.ZodTypeAny>(params: ExtractDataParams<T>): Promise<z.infer<T>>`

Jest to główna metoda publiczna usługi. Przyjmuje tekst, schemat walidacji Zod oraz opcjonalne parametry, a następnie zwraca sparsowane i zwalidowane dane.

```typescript
// Definicje typów dla parametrów metody
import { z } from 'zod';

interface ExtractDataParams<T extends z.ZodTypeAny> {
  transcription: string;
  context: string; // Dodatkowy kontekst, np. "Group members: ['Alice', 'Bob']"
  schema: T;
  model: string; // np. "anthropic/claude-3.5-sonnet"
  temperature?: number;
  maxTokens?: number;
}

// Wewnątrz klasy OpenRouterService
public async extractExpenseData<T extends z.ZodTypeAny>(params: ExtractDataParams<T>): Promise<z.infer<T>> {
  // Implementacja zostanie opisana w planie krok po kroku
}
```

- **Parametry:**
  - `transcription`: Surowy tekst uzyskany z transkrypcji audio.
  - `context`: Dodatkowe informacje, które pomogą modelowi LLM poprawnie zinterpretować tekst (np. lista członków grupy, waluta).
  - `schema`: Schemat walidacji `Zod`, który definiuje oczekiwaną strukturę danych wyjściowych.
  - `model`: Nazwa modelu do użycia w OpenRouter.
  - `temperature`, `maxTokens` (opcjonalne): Parametry kontrolujące zachowanie modelu.
- **Zwraca:** Obietnicę (`Promise`), która po rozwiązaniu zawiera obiekt danych zgodny ze schematem `Zod` (`z.infer<T>`).
- **Rzuca:** Błędy (np. `OpenRouterApiError`, `ValidationError`) w przypadku problemów z komunikacją API lub walidacją danych.

## 4. Metody i Pola Prywatne

### `private buildSystemPrompt(): string`

- **Cel:** Tworzy stały, ogólny komunikat systemowy, który instruuje model LLM o jego roli jako asystenta finansowego.
- **Logika:** Zwraca predefiniowany ciąg znaków.
- **Przykład:** `"You are an expert financial assistant. Your task is to analyze a transcribed text... You must only respond in the JSON format requested."`

### `private buildUserPrompt(transcription: string, context: string): string`

- **Cel:** Tworzy komunikat użytkownika, łącząc transkrypcję z dodatkowym kontekstem.
- **Logika:** Formatuje wejściowe ciągi znaków w jeden spójny prompt dla modelu.
- **Przykład:** `return \`Transcribed text: "${transcription}"\n\nContext: "${context}"\``

### `private createApiPayload<T extends z.ZodTypeAny>(...): object`

- **Cel:** Buduje kompletny obiekt JSON (payload) do wysłania do API OpenRouter.
- **Logika:**
  1.  Wywołuje `buildSystemPrompt` i `buildUserPrompt`.
  2.  Konwertuje schemat `Zod` na `JSON Schema` przy użyciu biblioteki `zod-to-json-schema`.
  3.  Składa wszystkie części (prompty, model, parametry, `response_format`) w jeden obiekt zgodny ze specyfikacją OpenRouter.

### `private async makeApiRequest(payload: object): Promise<any>`

- **Cel:** Obsługuje wysyłanie żądania `POST` do API OpenRouter i odbieranie odpowiedzi.
- **Logika:**
  1.  Używa `fetch` do wysłania `payload` na adres `https://openrouter.ai/api/v1/chat/completions`.
  2.  Dodaje niezbędne nagłówki: `Authorization: Bearer ${this.apiKey}` i `Content-Type: application/json`.
  3.  Sprawdza status odpowiedzi HTTP. Jeśli nie jest to `2xx`, rzuca błąd `OpenRouterApiError`.
  4.  Zwraca sparsowaną odpowiedź JSON.

### `private parseAndValidateResponse<T extends z.ZodTypeAny>(apiResponse: any, schema: T): z.infer<T>`

- **Cel:** Wyodrębnia dane z odpowiedzi API i waliduje je względem schematu Zod.
- **Logika:**
  1.  Wyciąga argumenty z odpowiedzi (`choices[0].message.tool_calls[0].function.arguments`).
  2.  Parsuje string JSON na obiekt.
  3.  Używa `schema.safeParse()` do walidacji obiektu.
  4.  Jeśli walidacja się powiedzie, zwraca dane. W przeciwnym razie rzuca `ValidationError` z informacjami o błędach.

## 5. Obsługa Błędów

Usługa będzie definiować i rzucać niestandardowe typy błędów, aby umożliwić warstwie wywołującej odpowiednią reakcję.

- **`ConfigurationError`**: Rzucany przez konstruktor, jeśli brakuje klucza `OPENROUTER_API_KEY`.
- **`OpenRouterApiError`**: Rzucany, gdy API OpenRouter zwróci status błędu (np. 401, 429, 500). Będzie zawierał oryginalny status i komunikat błędu z API.
- **`NetworkError`**: Rzucany w przypadku problemów z połączeniem sieciowym podczas próby komunikacji z API (np. timeout).
- **`InvalidJsonResponseError`**: Rzucany, gdy odpowiedź modelu nie jest poprawnym formatem JSON.
- **`ValidationError`**: Rzucany, gdy odpowiedź JSON jest poprawna, ale nie przechodzi walidacji schematem `Zod`. Będzie zawierał szczegóły błędów walidacji.

## 6. Kwestie Bezpieczeństwa

1.  **Ochrona Klucza API**: Klucz API OpenRouter **musi** być przechowywany jako zmienna środowiskowa (`OPENROUTER_API_KEY`) w środowisku serwerowym (Astro lub Supabase). Nigdy nie może być ujawniony po stronie klienta.
2.  **Walidacja Wejścia**: Chociaż głównym źródłem danych będzie transkrypcja, wszelkie dane kontekstowe pochodzące od użytkownika powinny być oczyszczone (sanitized), aby zapobiec atakom typu Prompt Injection.
3.  **Ograniczenie Zasobów**: Należy zaimplementować mechanizmy ograniczające liczbę zapytań do API na poziomie aplikacji (np. rate limiting per user), aby kontrolować koszty i zapobiegać nadużyciom.

## 7. Plan Wdrożenia Krok po Kroku

### Krok 1: Instalacja Zależności

Dodaj bibliotekę `zod-to-json-schema` do projektu.

```bash
npm install zod-to-json-schema
```

### Krok 2: Konfiguracja Zmiennych Środowiskowych

Dodaj `OPENROUTER_API_KEY` do pliku `.env` w projekcie oraz do zmiennych środowiskowych w panelu hostingu (DigitalOcean/Supabase).

```.env
OPENROUTER_API_KEY="sk-or-v1-..."
```

### Krok 3: Stworzenie Pliku Usługi

Utwórz plik `src/lib/services/openRouterService.ts` i zdefiniuj w nim klasę `OpenRouterService` wraz z konstruktorem i typami niestandardowych błędów.

```typescript
// src/lib/services/openRouterService.ts
import { z } from 'zod';

// Definicje niestandardowych błędów
export class OpenRouterApiError extends Error { /* ... */ }
export class ValidationError extends Error { /* ... */ }
// ...inne błędy

export class OpenRouterService {
  private readonly apiKey: string;
  // ... reszta implementacji
}
```

### Krok 4: Implementacja Prywatnych Metod

Zaimplementuj logikę dla każdej z prywatnych metod, zaczynając od budowania promptów, przez tworzenie payloadu, aż po wykonanie zapytania i parsowanie odpowiedzi.

**Przykład implementacji `createApiPayload`:**

```typescript
import { zodToJsonSchema } from 'zod-to-json-schema';

// Wewnątrz klasy OpenRouterService
private createApiPayload<T extends z.ZodTypeAny>(params: ExtractDataParams<T>) {
  const { transcription, context, schema, model, temperature, maxTokens } = params;

  const systemPrompt = this.buildSystemPrompt();
  const userPrompt = this.buildUserPrompt(transcription, context);

  const jsonSchema = zodToJsonSchema(schema, "extracted_data_schema");

  return {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    tool_choice: { type: "tool", tool: "extract_expense_details" },
    tools: [{
        type: "function",
        function: {
            name: "extract_expense_details",
            description: "Extracts structured expense data from the user's text.",
            parameters: jsonSchema.definitions.extracted_data_schema,
        }
    }],
    temperature: temperature || 0.1,
    max_tokens: maxTokens || 1024,
  };
}
```

### Krok 5: Implementacja Głównej Metody Publicznej

Połącz wszystkie prywatne metody w ramach `extractExpenseData`, dodając obsługę błędów `try-catch` na każdym etapie (zapytanie API, parsowanie, walidacja).

```typescript
// Wewnątrz klasy OpenRouterService
public async extractExpenseData<T extends z.ZodTypeAny>(params: ExtractDataParams<T>): Promise<z.infer<T>> {
  try {
    const payload = this.createApiPayload(params);
    const apiResponse = await this.makeApiRequest(payload);
    const validatedData = this.parseAndValidateResponse(apiResponse, params.schema);
    return validatedData;
  } catch (error) {
    // Logowanie błędu
    console.error("Error in OpenRouterService:", error);
    // Rzucenie błędu dalej lub opakowanie go w niestandardowy typ
    throw error;
  }
}
```

### Krok 6: Integracja Usługi w Astro API Route

Utwórz nowy endpoint API w Astro, który będzie korzystał z `OpenRouterService`. Endpoint ten będzie odbierał dane z frontendu (np. plik audio lub transkrypcję), przetwarzał je i zwracał ustrukturyzowane dane.

```typescript
// src/pages/api/expenses/transcribe.ts
import type { APIRoute } from 'astro';
import { OpenRouterService } from '@/lib/services/openRouterService';
import { expenseTranscriptionSchema } from '@/lib/schemas/expenseSchemas';

export const POST: APIRoute = async ({ request }) => {
  const { transcription, context } = await request.json();

  if (!transcription || !context) {
    return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400 });
  }

  try {
    const openRouterService = new OpenRouterService();
    const data = await openRouterService.extractExpenseData({
      transcription,
      context,
      schema: expenseTranscriptionSchema,
      model: 'anthropic/claude-3.5-sonnet',
    });

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    // Tutaj obsługa niestandardowych błędów i zwracanie odpowiednich statusów HTTP
    return new Response(JSON.stringify({ error: 'Failed to process transcription.' }), { status: 500 });
  }
};
```

### Krok 7: Testowanie

Napisz testy jednostkowe dla `OpenRouterService`, mockując `fetch`, aby testować logikę budowania promptów, parsowania i walidacji bez wykonywania rzeczywistych zapytań do API. Napisz również testy integracyjne dla endpointu API.
