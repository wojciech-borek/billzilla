# LLM Tools Schema - AI Chat Assistant

**Data:** 2025-12-22  
**Status:** ✅ Zaimplementowane  
**Model:** `anthropic/claude-3-haiku` (OpenRouter)  
**Format:** OpenAI Function Calling / OpenRouter Compatible

---

## 🎯 Cel dokumentu

Definiuje strukturę `tools` dla modelu LLM zgodnie ze standardem OpenAI, używanym przez OpenRouter. Każda funkcja odpowiada funkcjonalnością opisanej w [ai-chat-planning-session.md](../../planning/product/ai-chat-planning-session.md).

---

## 🔄 Strategia: Simplified Approach

### Filozofia

Schemat wykorzystuje **uproszczone podejście**, skupiające się na podstawowych narzędziach do odczytu danych:

**1. Generic Low-Level Tools** (z paginacją)
- Bezpośredni dostęp do surowych danych
- Elastyczne filtrowanie i wyszukiwanie
- AI samodzielnie analizuje dane tekstowo

**2. Specialized High-Level Tools** (podstawowe agregacje)
- Proste podsumowania i salda
- Szybkie odpowiedzi na typowe pytania
- Brak ciężkich obliczeń i wykresów

### Kiedy AI używa których tools?

| Typ zapytania | Tool type | Przykład |
|---------------|-----------|----------|
| Typowe, proste | **Specialized** | "Ile wydaliśmy w grudniu?" → `get_expenses_summary` |
| Wyszukiwanie | **Specialized** | "Pizza wczoraj" → `search_expenses` |
| Surowe dane | **Generic** | "Pokaż wszystkie wydatki" → `get_expenses` |
| Salda | **Specialized** | "Kto ile wisi?" → `get_member_balances` |

### Korzyści uproszczonego podejścia

- ✅ **Niskie koszty** - lżejszy model (`claude-3-haiku`)
- ✅ **Wysoka stabilność** - brak timeoutów
- ✅ **Szybkie odpowiedzi** - proste operacje
- ✅ **Tekstowe odpowiedzi** - bez skomplikowanych wizualizacji

---

## 📐 Struktura narzędzi

### Kategoria 1: Generic Low-Level Tools (Raw Data Access)

#### G1. `get_expenses`

**Przeznaczenie:** Bezpośredni dostęp do surowych danych o wydatkach z paginacją

**Opis funkcji:**
Zwraca listę transakcji (wydatków) z grupy z możliwością filtrowania i paginacji. AI może samodzielnie analizować dane.

**Schemat JSON:**

```json
{
  "type": "function",
  "function": {
    "name": "get_expenses",
    "description": "Fetches raw expense data from the group with pagination and optional filters. Returns individual transactions for AI to analyze independently.",
    "parameters": {
      "type": "object",
      "properties": {
        "group_id": {
          "type": "string",
          "description": "The unique identifier of the group (UUID format)"
        },
        "page": {
          "type": "integer",
          "description": "Page number for pagination. Default: 1.",
          "default": 1,
          "minimum": 1
        },
        "limit": {
          "type": "integer",
          "description": "Number of expenses per page. Default: 50, Max: 100.",
          "default": 50,
          "minimum": 1,
          "maximum": 100
        },
        "start_date": {
          "type": "string",
          "format": "date",
          "description": "Optional. Filter expenses from this date onwards (ISO 8601 format)."
        },
        "end_date": {
          "type": "string",
          "format": "date",
          "description": "Optional. Filter expenses up to this date (ISO 8601 format)."
        },
        "payer_id": {
          "type": "string",
          "description": "Optional. Filter by who paid (member UUID)."
        },
        "currency": {
          "type": "string",
          "description": "Optional. Filter/convert to specific currency (ISO 4217)."
        },
        "sort_by": {
          "type": "string",
          "enum": ["date_desc", "date_asc", "amount_desc", "amount_asc"],
          "description": "Sorting order. Default: date_desc (newest first).",
          "default": "date_desc"
        }
      },
      "required": ["group_id"]
    }
  }
}
```

**Walidacja i obsługa błędów:**
- `limit` max 100 (ochrona przed oversized responses)
- Jeśli `page` * `limit` > total_count → zwraca pustą listę
- Response zawiera metadata: `total_count`, `page`, `limit`, `has_next_page`

**Response format:**

```json
{
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "expenses": [
    {
      "expense_id": "e1234567-...",
      "description": "Pizza domowa",
      "amount": 89.90,
      "currency": "PLN",
      "date": "2025-12-15T18:30:00Z",
      "payer": {
        "member_id": "660e8400-...",
        "member_name": "Ania"
      },
      "participants": [
        { "member_id": "660e8400-...", "member_name": "Ania", "share": 29.97 },
        { "member_id": "770e8400-...", "member_name": "Tomek", "share": 29.97 },
        { "member_id": "880e8400-...", "member_name": "Kasia", "share": 29.96 }
      ]
    }
  ],
  "metadata": {
    "total_count": 234,
    "page": 1,
    "limit": 50,
    "has_next_page": true,
    "total_pages": 5
  }
}
```

---

#### G2. `get_members`

**Przeznaczenie:** Lista członków grupy z podstawowymi statystykami

**Opis funkcji:**
Zwraca informacje o członkach grupy - AI może użyć do walidacji imion, ID, analizy aktywności.

**Schemat JSON:**

```json
{
  "type": "function",
  "function": {
    "name": "get_members",
    "description": "Retrieves the list of group members with basic information: names, IDs, join dates, and optional activity stats.",
    "parameters": {
      "type": "object",
      "properties": {
        "group_id": {
          "type": "string",
          "description": "The unique identifier of the group (UUID format)"
        },
        "include_stats": {
          "type": "boolean",
          "description": "If true, includes basic activity stats (number of expenses paid, total amount). Default: false.",
          "default": false
        }
      },
      "required": ["group_id"]
    }
  }
}
```

**Response format:**

```json
{
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "members": [
    {
      "member_id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Ania",
      "joined_at": "2025-01-10T10:00:00Z",
      "is_creator": true,
      "stats": {
        "expenses_paid": 45,
        "total_paid": 2340.50,
        "currency": "PLN"
      }
    }
  ],
  "total_members": 3
}
```

---

#### G3. `get_group_metadata`

**Przeznaczenie:** Szczegółowe informacje o grupie (rozszerzona wersja `get_group_context`)

**Opis funkcji:**
Zwraca pełne metadane grupy: ustawienia, waluty, daty utworzenia, status archiwizacji.

**Schemat JSON:**

```json
{
  "type": "function",
  "function": {
    "name": "get_group_metadata",
    "description": "Retrieves comprehensive group metadata including settings, currencies, creation date, archive status, and basic statistics.",
    "parameters": {
      "type": "object",
      "properties": {
        "group_id": {
          "type": "string",
          "description": "The unique identifier of the group (UUID format)"
        }
      },
      "required": ["group_id"]
    }
  }
}
```

**Response format:**

```json
{
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Wakacje Grecja 2025",
  "description": "Grupa wydatków na wakacje",
  "primary_currency": "PLN",
  "supported_currencies": ["PLN", "EUR", "USD"],
  "created_at": "2025-01-10T10:00:00Z",
  "is_archived": false,
  "creator": {
    "member_id": "660e8400-...",
    "name": "Ania"
  },
  "stats": {
    "total_members": 3,
    "total_expenses": 234,
    "total_amount": 15670.30,
    "currency": "PLN",
    "first_expense_date": "2025-01-15",
    "last_expense_date": "2025-12-15"
  }
}
```

---

### Kategoria 2: Specialized High-Level Tools (Podstawowe Agregacje)

Proste, zoptymalizowane funkcje dla najczęstszych zapytań. Zwracają tekstowe podsumowania bez ciężkich obliczeń.

#### 1. `get_member_balances`

**Przeznaczenie:** US-1.1 - Sprawdzanie sald między członkami grupy

**Opis funkcji:**
Zwraca informacje o saldach i długach między członkami grupy. Może zwrócić salda dla konkretnej osoby lub całej grupy.

**Schemat JSON:**

```json
{
  "type": "function",
  "function": {
    "name": "get_member_balances",
    "description": "Retrieves balance information between group members. Shows who owes whom and how much. Can filter by specific member or return all balances.",
    "parameters": {
      "type": "object",
      "properties": {
        "group_id": {
          "type": "string",
          "description": "The unique identifier of the group (UUID format)"
        },
        "member_id": {
          "type": "string",
          "description": "Optional. If provided, returns balances only for this specific member. If omitted, returns all balances in the group."
        },
        "currency": {
          "type": "string",
          "description": "Optional. Currency code (ISO 4217, e.g., 'PLN', 'EUR', 'USD'). If omitted, uses group's primary currency."
        }
      },
      "required": ["group_id"]
    }
  }
}
```

**Walidacja i obsługa błędów:**
- `group_id` musi być poprawnym UUID
- `member_id` (jeśli podany) musi należeć do grupy
- `currency` musi być wspieraną walutą w grupie
- Brak członków w grupie → zwraca pustą listę z informacją
- Brak transakcji → zwraca zerowe salda

---

#### 2. `get_expenses_summary`

**Przeznaczenie:** US-1.2 - Podsumowanie wydatków w czasie

**Opis funkcji:**
Agreguje wydatki grupy w wybranym okresie czasu. Zwraca sumę oraz opcjonalnie breakdown per osoba.

**Schemat JSON:**

```json
{
  "type": "function",
  "function": {
    "name": "get_expenses_summary",
    "description": "Aggregates group expenses for a specified time period. Returns total amount and optional breakdown per member.",
    "parameters": {
      "type": "object",
      "properties": {
        "group_id": {
          "type": "string",
          "description": "The unique identifier of the group (UUID format)"
        },
        "start_date": {
          "type": "string",
          "format": "date",
          "description": "Start date of the period in ISO 8601 format (YYYY-MM-DD). If omitted, uses beginning of current month."
        },
        "end_date": {
          "type": "string",
          "format": "date",
          "description": "End date of the period in ISO 8601 format (YYYY-MM-DD). If omitted, uses current date."
        },
        "currency": {
          "type": "string",
          "description": "Currency code for the summary (ISO 4217). If omitted, uses group's primary currency."
        },
        "include_member_breakdown": {
          "type": "boolean",
          "description": "If true, includes per-member spending breakdown. Default: false.",
          "default": false
        }
      },
      "required": ["group_id"]
    }
  }
}
```

**Walidacja i obsługa błędów:**
- `start_date` nie może być późniejsza niż `end_date`
- Daty muszą być w formacie ISO 8601
- Zbyt szeroki zakres (>365 dni) → ostrzeżenie o możliwej wolnej odpowiedzi
- Brak transakcji w okresie → zwraca sumę 0 z informacją

---

#### 3. `search_expenses`

**Przeznaczenie:** US-1.3 - Wyszukiwanie konkretnych transakcji

**Opis funkcji:**
Przeszukuje transakcje na podstawie słów kluczowych w opisie, daty lub innych kryteriów.

**Schemat JSON:**

```json
{
  "type": "function",
  "function": {
    "name": "search_expenses",
    "description": "Searches for specific expenses based on keywords in description, date range, payer, or amount range.",
    "parameters": {
      "type": "object",
      "properties": {
        "group_id": {
          "type": "string",
          "description": "The unique identifier of the group (UUID format)"
        },
        "keyword": {
          "type": "string",
          "description": "Search keyword to match in expense description. Case-insensitive, partial match."
        },
        "start_date": {
          "type": "string",
          "format": "date",
          "description": "Optional. Filter expenses from this date onwards (ISO 8601 format)."
        },
        "end_date": {
          "type": "string",
          "format": "date",
          "description": "Optional. Filter expenses up to this date (ISO 8601 format)."
        },
        "payer_id": {
          "type": "string",
          "description": "Optional. Filter expenses paid by this specific member (UUID)."
        },
        "min_amount": {
          "type": "number",
          "description": "Optional. Minimum expense amount (inclusive).",
          "minimum": 0
        },
        "max_amount": {
          "type": "number",
          "description": "Optional. Maximum expense amount (inclusive).",
          "minimum": 0
        },
        "limit": {
          "type": "integer",
          "description": "Maximum number of results to return. Default: 10, Max: 50.",
          "default": 10,
          "minimum": 1,
          "maximum": 50
        }
      },
      "required": ["group_id"]
    }
  }
}
```

**Walidacja i obsługa błędów:**
- Co najmniej jeden z filtrów (`keyword`, `start_date`, `end_date`, `payer_id`, `min_amount`, `max_amount`) musi być podany
- `min_amount` i `max_amount` muszą być >= 0
- `min_amount` nie może być większa niż `max_amount`
- `limit` maks. 50 (throttling)
- Brak wyników → zwraca pustą listę z sugestią rozszerzenia kryteriów

---

### Epic 2: Analizy i insighty

#### 4. `analyze_spending_trends`

**Przeznaczenie:** US-2.1 - Analiza trendów wydatków

**Opis funkcji:**
Porównuje wydatki między okresami i identyfikuje trendy (wzrost/spadek).

**Schemat JSON:**

```json
{
  "type": "function",
  "function": {
    "name": "analyze_spending_trends",
    "description": "Compares spending between time periods to identify trends. Returns percentage change and insights.",
    "parameters": {
      "type": "object",
      "properties": {
        "group_id": {
          "type": "string",
          "description": "The unique identifier of the group (UUID format)"
        },
        "current_period_start": {
          "type": "string",
          "format": "date",
          "description": "Start date of the current period (ISO 8601 format)"
        },
        "current_period_end": {
          "type": "string",
          "format": "date",
          "description": "End date of the current period (ISO 8601 format)"
        },
        "comparison_period_start": {
          "type": "string",
          "format": "date",
          "description": "Start date of the comparison period (ISO 8601 format)"
        },
        "comparison_period_end": {
          "type": "string",
          "format": "date",
          "description": "End date of the comparison period (ISO 8601 format)"
        },
        "currency": {
          "type": "string",
          "description": "Currency code for comparison (ISO 4217). Uses group's primary currency if omitted."
        }
      },
      "required": ["group_id", "current_period_start", "current_period_end", "comparison_period_start", "comparison_period_end"]
    }
  }
}
```

**Walidacja i obsługa błędów:**
- Okresy nie mogą się nakładać
- Każdy okres: `start_date` < `end_date`
- Okresy powinny być podobnej długości (różnica max 7 dni) → ostrzeżenie jeśli większa
- Brak transakcji w jednym z okresów → zwraca 0 dla tego okresu

---

#### 5. `get_top_expenses`

**Przeznaczenie:** US-2.2 - Top wydatków i statystyki

**Opis funkcji:**
Zwraca ranking największych wydatków w grupie.

**Schemat JSON:**

```json
{
  "type": "function",
  "function": {
    "name": "get_top_expenses",
    "description": "Returns the top N largest expenses in the group, optionally filtered by time period.",
    "parameters": {
      "type": "object",
      "properties": {
        "group_id": {
          "type": "string",
          "description": "The unique identifier of the group (UUID format)"
        },
        "limit": {
          "type": "integer",
          "description": "Number of top expenses to return. Default: 5, Max: 20.",
          "default": 5,
          "minimum": 1,
          "maximum": 20
        },
        "start_date": {
          "type": "string",
          "format": "date",
          "description": "Optional. Filter expenses from this date onwards (ISO 8601 format)."
        },
        "end_date": {
          "type": "string",
          "format": "date",
          "description": "Optional. Filter expenses up to this date (ISO 8601 format)."
        },
        "currency": {
          "type": "string",
          "description": "Currency code (ISO 4217). Uses group's primary currency if omitted."
        }
      },
      "required": ["group_id"]
    }
  }
}
```

**Walidacja i obsługa błędów:**
- `limit` maks. 20
- Jeśli w grupie jest mniej transakcji niż `limit` → zwraca wszystkie
- Brak transakcji → zwraca pustą listę

---

#### 6. `get_member_statistics`

**Przeznaczenie:** US-2.3 - Analiza zachowań członków

**Opis funkcji:**
Agreguje statystyki wydatków per członek grupy (liczba transakcji, suma wydana).

**Schemat JSON:**

```json
{
  "type": "function",
  "function": {
    "name": "get_member_statistics",
    "description": "Aggregates spending statistics per group member: number of transactions, total amount spent, average expense.",
    "parameters": {
      "type": "object",
      "properties": {
        "group_id": {
          "type": "string",
          "description": "The unique identifier of the group (UUID format)"
        },
        "member_id": {
          "type": "string",
          "description": "Optional. If provided, returns statistics only for this member. Otherwise, returns for all members."
        },
        "start_date": {
          "type": "string",
          "format": "date",
          "description": "Optional. Start date for the statistics period (ISO 8601 format)."
        },
        "end_date": {
          "type": "string",
          "format": "date",
          "description": "Optional. End date for the statistics period (ISO 8601 format)."
        },
        "currency": {
          "type": "string",
          "description": "Currency code (ISO 4217). Uses group's primary currency if omitted."
        }
      },
      "required": ["group_id"]
    }
  }
}
```

**Walidacja i obsługa błędów:**
- `member_id` (jeśli podany) musi należeć do grupy
- Członek bez transakcji → zwraca statystyki z wartościami 0
- Nieaktywny członek → oznaczony w odpowiedzi

---

#### 7. `generate_group_report`

**Przeznaczenie:** US-2.4 - Podsumowania i raporty

**Opis funkcji:**
Generuje kompleksowy raport finansowy grupy za wybrany okres.

**Schemat JSON:**

```json
{
  "type": "function",
  "function": {
    "name": "generate_group_report",
    "description": "Generates a comprehensive financial report for the group including total expenses, top expenses, member balances, and transaction count.",
    "parameters": {
      "type": "object",
      "properties": {
        "group_id": {
          "type": "string",
          "description": "The unique identifier of the group (UUID format)"
        },
        "start_date": {
          "type": "string",
          "format": "date",
          "description": "Start date of the report period (ISO 8601 format)"
        },
        "end_date": {
          "type": "string",
          "format": "date",
          "description": "End date of the report period (ISO 8601 format)"
        },
        "currency": {
          "type": "string",
          "description": "Currency code for the report (ISO 4217). Uses group's primary currency if omitted."
        },
        "include_charts_data": {
          "type": "boolean",
          "description": "If true, includes data formatted for chart visualization (timeline, pie chart). Default: false.",
          "default": false
        }
      },
      "required": ["group_id", "start_date", "end_date"]
    }
  }
}
```

**Walidacja i obsługa błędów:**
- `start_date` < `end_date` (wymagane)
- Maksymalny okres raportu: 365 dni
- Brak transakcji → generuje raport z wartościami 0 + komunikat
- Zbyt duży zakres → ostrzeżenie o czasie generowania

---

### Epic 3: Utility Functions (kontekst i meta)

#### 8. `get_group_context`

**Przeznaczenie:** Pobieranie podstawowych informacji o grupie (metadane)

**Opis funkcji:**
Zwraca podstawowe informacje o grupie: nazwę, członków, główną walutę, listę wspieranych walut.

**Schemat JSON:**

```json
{
  "type": "function",
  "function": {
    "name": "get_group_context",
    "description": "Retrieves basic group information: name, members, primary currency, supported currencies, creation date.",
    "parameters": {
      "type": "object",
      "properties": {
        "group_id": {
          "type": "string",
          "description": "The unique identifier of the group (UUID format)"
        }
      },
      "required": ["group_id"]
    }
  }
}
```

**Walidacja i obsługa błędów:**
- `group_id` musi istnieć
- Grupa zarchiwizowana → zwraca dane + flag `is_archived: true`

---

#### 9. `get_currency_exchange_rates`

**Przeznaczenie:** Pobieranie kursów wymiany walut dla grupy

**Opis funkcji:**
Zwraca aktualne kursy wymiany dla walut używanych w grupie (jeśli grupa jest multi-currency).

**Schemat JSON:**

```json
{
  "type": "function",
  "function": {
    "name": "get_currency_exchange_rates",
    "description": "Returns current exchange rates for currencies used in the group. Useful for multi-currency groups.",
    "parameters": {
      "type": "object",
      "properties": {
        "group_id": {
          "type": "string",
          "description": "The unique identifier of the group (UUID format)"
        },
        "base_currency": {
          "type": "string",
          "description": "Optional. Base currency for exchange rates (ISO 4217). If omitted, uses group's primary currency."
        }
      },
      "required": ["group_id"]
    }
  }
}
```

**Walidacja i obsługa błędów:**
- Jeśli grupa używa tylko jednej waluty → zwraca kurs 1:1
- `base_currency` (jeśli podana) musi być wspierana w grupie

---

## 🔐 Walidacja i Bezpieczeństwo

### Wspólne reguły walidacji dla wszystkich funkcji:

1. **Autoryzacja:**
   - Użytkownik musi być członkiem grupy o `group_id`
   - Token JWT weryfikowany na poziomie API endpoint

2. **Walidacja `group_id`:**
   - Format UUID v4
   - Grupa musi istnieć i nie być usunięta
   - Użytkownik musi mieć dostęp do grupy

3. **Walidacja dat:**
   - Format ISO 8601 (YYYY-MM-DD)
   - `start_date` zawsze <= `end_date`
   - Daty nie mogą być w przyszłości (ostrzeżenie)

4. **Walidacja kwot:**
   - Zawsze >= 0
   - Maksymalna precyzja: 2 miejsca po przecinku
   - `min_amount` <= `max_amount`

5. **Walidacja walut:**
   - Format ISO 4217 (3-literowy kod)
   - Waluta musi być wspierana w grupie
   - Jeśli brak, używana jest główna waluta grupy

6. **Rate Limiting:**
   - Maksymalnie 100 zapytań/grupa/dzień (MVP)
   - Header `X-RateLimit-Remaining` w odpowiedziach
   - HTTP 429 przy przekroczeniu limitu

7. **Obsługa błędów:**
   - HTTP 400: Nieprawidłowe parametry (z opisem błędu)
   - HTTP 401: Brak autoryzacji
   - HTTP 403: Brak dostępu do grupy
   - HTTP 404: Grupa nie istnieje
   - HTTP 429: Przekroczenie rate limitu
   - HTTP 500: Błąd serwera

---

## 📊 Przykładowe odpowiedzi Functions

### Przykład: `get_member_balances`

**Request:**
```json
{
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "member_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Response:**
```json
{
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "currency": "PLN",
  "balances": [
    {
      "member_id": "660e8400-e29b-41d4-a716-446655440001",
      "member_name": "Ania",
      "owes_to": [
        {
          "member_id": "770e8400-e29b-41d4-a716-446655440002",
          "member_name": "Tomek",
          "amount": 150.50
        }
      ],
      "owed_by": [
        {
          "member_id": "880e8400-e29b-41d4-a716-446655440003",
          "member_name": "Kasia",
          "amount": 75.00
        }
      ],
      "net_balance": -75.50
    }
  ],
  "summary": "Ania jest winna 150.50 PLN Tomkowi i Kasia jest jej winna 75.00 PLN. Łączne saldo: -75.50 PLN."
}
```

---

### Przykład: `search_expenses`

**Request:**
```json
{
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "keyword": "pizza",
  "start_date": "2025-12-01",
  "limit": 5
}
```

**Response:**
```json
{
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_found": 12,
  "returned": 5,
  "expenses": [
    {
      "expense_id": "e1234567-e29b-41d4-a716-446655440010",
      "description": "Pizza domowa - 4 rodzaje",
      "amount": 89.90,
      "currency": "PLN",
      "date": "2025-12-15",
      "payer": {
        "member_id": "660e8400-e29b-41d4-a716-446655440001",
        "member_name": "Ania"
      }
    },
    {
      "expense_id": "e2234567-e29b-41d4-a716-446655440011",
      "description": "Pizza na mieście",
      "amount": 120.00,
      "currency": "PLN",
      "date": "2025-12-08",
      "payer": {
        "member_id": "770e8400-e29b-41d4-a716-446655440002",
        "member_name": "Tomek"
      }
    }
  ],
  "suggestion": "Znaleziono 12 wyników. Użyj parametru 'limit' aby zobaczyć więcej."
}
```

---

## 🚀 Implementacja

### Endpoint Backend

**Endpoint:** `POST /api/groups/[groupId]/ai-chat`

**Body:**
```json
{
  "message": "Ile wydaliśmy w grudniu?",
  "conversation_history": [...] // opcjonalnie
}
```

**Process:**
1. Weryfikacja autoryzacji (JWT)
2. Pobranie kontekstu grupy (`get_group_context`)
3. Wysłanie do LLM z:
   - System prompt (rola Financial Analyst)
   - Kontekst grupy
   - Dostępne tools (funkcje powyżej)
   - User message
4. LLM wybiera funkcję → Backend wykonuje
5. Wynik zwracany do LLM → Generuje odpowiedź
6. Response streamowany do frontendu


---

## 💡 Przykłady użycia: Generic vs Specialized

### Scenariusz 1: Proste pytanie - "Ile wydaliśmy w grudniu?"

**✅ Wybór AI: Specialized Tool**

```
Użyj: get_expenses_summary(
  group_id="550e...",
  start_date="2025-12-01",
  end_date="2025-12-31"
)
```

**Dlaczego?**
- Typowe pytanie (80% przypadków)
- Backend zwraca gotową sumę w 1 wywołaniu
- ~500 tokenów (mała odpowiedź)
- **Szybko i tanio**

---

### Scenariusz 2: Złożone pytanie - "Pokaż wydatki które są wyższe niż średnia z ostatnich 3 miesięcy"

**✅ Wybór AI: Generic Tool (multiple calls)**

**Krok 1:** Pobierz wszystkie wydatki z ostatnich 3 miesięcy
```
get_expenses(
  group_id="550e...",
  start_date="2025-09-20",
  end_date="2025-12-20",
  page=1,
  limit=100
)
```

**Krok 2:** AI oblicza średnią samodzielnie
```javascript
// W kontekście AI
średnia = sum(expenses.map(e => e.amount)) / expenses.length
```

**Krok 3:** AI filtruje i formatuje odpowiedź
```
Wydatki >  średniej (89.50 PLN):
1. Hotel Ateny - 450.00 PLN (Tomek)
2. Bilety lotnicze - 320.00 PLN (Ania)
...
```

**Dlaczego Generic?**
- Specialized tool nie ma funkcji "wydatki > średniej"
- AI musi sam policzyć średnią
- ~3000 tokenów (100 transakcji + analiza)
- **Droższe, ale elastyczne**

---

### Scenariusz 3: Hybrid - "Pizza i piwo wczoraj?"

**✅ Wybór AI: Może użyć obu**

**Opcja A (Specialized):**
```
search_expenses(
  group_id="550e...",
  keyword="pizza",
  start_date="2025-12-19",
  end_date="2025-12-19",
  limit=10
)
// Potem drugie wywołanie:
search_expenses(
  keyword="piwo",
  ...
)
```

**Opcja B (Generic - może być lepsza):**
```
get_expenses(
  group_id="550e...",
  start_date="2025-12-19",
  end_date="2025-12-19",
  limit=50
)
// AI sam filtruje po "pizza" AND "piwo" w opisie
```

**AI wybierze opcję B jeśli:**
- Wczoraj było mało transakcji (<50)
- Chce znaleźć transakcje zawierające OBA słowa kluczowe

---

### Scenariusz 4: Multi-step reasoning - "Czy Tomek płaci więcej niż Ania?"

**✅ Wybór AI: Specialized (ale z dwoma wywołaniami)**

```
// Wywołanie 1:
get_member_statistics(
  group_id="550e...",
  member_id="tomek_id",
  start_date="2025-12-01",
  end_date="2025-12-31"
)
// Odpowiedź: {"total_paid": 1250.00}

// Wywołanie 2:
get_member_statistics(
  group_id="550e...",
  member_id="ania_id",
  start_date="2025-12-01",
  end_date="2025-12-31"
)
// Odpowiedź: {"total_paid": 980.50}

// AI formatuje:
"Tak, Tomek zapłacił 1250.00 PLN, a Ania 980.50 PLN. Tomek płaci 269.50 PLN więcej."
```

**Dlaczego nie Generic?**
- Specialized ma już zsumowane dane per osoba
- 2 wywołania, ale każde zwraca małą odpowiedź (~200 tokenów total)
- Gdyby użyć Generic → musiałby pobrać wszystkie transakcje i sam agregować (>2000 tokenów)

---

### Scenariusz 5: Raport końca miesiąca - "Podsumuj grudzień"

**✅ Wybór AI: Specialized**

```
generate_group_report(
  group_id="550e...",
  start_date="2025-12-01",
  end_date="2025-12-31",
  include_charts_data=true
)
```

**Odpowiedź (jedna funkcja!):**
- ✅ Suma wydatków: 5670.30 PLN
- ✅ Top 5 wydatków
- ✅ Salda między członkami
- ✅ Liczba transakcji
- ✅ Dane do wykresów (timeline, pie chart)

**Dlaczego nie Generic?**
- Generic wymagałby 5-6 wywołań:
  1. `get_expenses` (wszystkie transakcje)
  2. `get_members` (lista członków)
  3. `get_member_balances` (salda)
  4. AI musi sam obliczyć top wydatków, grupować po datach, etc.
- Specialized → **1 wywołanie, backend robi całą robotę**

---

### Podsumowanie strategii wyboru

| Kryterium | Generic Tools | Specialized Tools |
|-----------|---------------|-------------------|
| **Użyj gdy** | Nietypowe pytanie, potrzebujesz elastyczności | Typowe pytanie, przewidziane w schemacie |
| **Przykład** | "Wydatki > średniej z 3 m-cy" | "Ile wydaliśmy w grudniu?" |
| **Koszt** | ~1000-5000 tokenów (surowe dane) | ~200-500 tokenów (agregacje) |
| **Wywołania** | Często 1-3 (paginacja) | Zazwyczaj 1 |
| **Szybkość** | Wolniejsze (AI analizuje) | Szybsze (backend agreguje) |
| **Elastyczność** | ✅✅✅ Bardzo wysoka | ❌ Tylko przewidziane scenariusze |

**Ogólna zasada:**
- **80% zapytań** → Specialized (szybko, tanio)
- **20% edge cases** → Generic (elastycznie)


---

## 📦 Strategia Wdrożenia Tools

### Pytanie: Jak wysyłać tools do LLM?

#### Opcja A: Wszystkie tools w każdym request (✅ **REKOMENDOWANE dla MVP**)

**Implementacja:**
```javascript
// Każdy request do AI zawiera wszystkie 12 funkcji:
const tools = [
  get_expenses,
  get_members, 
  get_group_metadata,
  get_member_balances,
  get_expenses_summary,
  search_expenses,
  analyze_spending_trends,
  get_top_expenses,
  get_member_statistics,
  generate_group_report,
  get_group_context,
  get_currency_exchange_rates
];

// OpenRouter (rekomendowane):
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://billzilla.app', // Optional
    'X-Title': 'Billzilla AI Chat' // Optional
  },
  body: JSON.stringify({
    model: 'openai/gpt-4', // lub 'anthropic/claude-3.5-sonnet'
    messages: [...],
    tools: tools // Wszystkie 12
  })
});

// Alternatywnie OpenAI bezpośrednio:
// const response = await openai.chat.completions.create({
//   model: "gpt-4",
//   messages: [...],
//   tools: tools
// });
```

**Pros:**
- ✅ **Prostsza implementacja** - brak logiki selekcji
- ✅ **Pewność** - AI zawsze ma dostęp do wszystkich narzędzi
- ✅ **Mniejsze ryzyko błędów** - brak ryzyka niepoprawnej klasyfikacji
- ✅ **12 funkcji to niewiele** - GPT-4 radzi sobie z 100+ tools

**Cons:**
- ❌ System prompt większy (~2000 tokenów definicji tools)
- ❌ Droższe za input tokens (ale to stały koszt per request)

**Koszt:**
- ~2000 tokenów definitecje tools = **$0.03 / 1000 zapytań** (GPT-4)
- Akceptowalne dla MVP

---

#### Opcja B: Dynamiczna selekcja tools (Post-MVP optimization)

**Implementacja:**
```javascript
// Backend analizuje pytanie PRZED wysłaniem do LLM:
function selectTools(userMessage, conversationHistory) {
  // Prosta klasyfikacja keyword-based:
  if (userMessage.includes("wydaliśmy") || userMessage.includes("suma")) {
    return [get_expenses_summary, get_group_metadata];
  }
  
  if (userMessage.includes("średni") || userMessage.includes("porównaj")) {
    return [get_expenses, get_members, get_group_metadata]; // Generic
  }
  
  if (userMessage.includes("saldo") || userMessage.includes("wisi")) {
    return [get_member_balances, get_members];
  }
  
  // Default fallback:
  return ALL_TOOLS;
}

const selectedTools = selectTools(userMessage);
await openai.chat.completions.create({
  tools: selectedTools // 3-5 funkcji
});
```

**Pros:**
- ✅ **Mniej tokenów** (~500 vs 2000)
- ✅ **Tańsze wywołania** (oszczędność 30-40%)
- ✅ **AI skupia się tylko na relevantnych tools**

**Cons:**
- ❌ **Bardziej złożona logika** - wymaga classifiera
- ❌ **Ryzyko błędnej klasyfikacji** - co jeśli źle dopasujemy?
- ❌ **Fallback do ALL_TOOLS** przy wątpliwościach (wtedy brak oszczędności)

**Kiedy wdrożyć:**
- Po zebraniu danych z użycia (które tools są używane razem)
- Gdy koszty API staną się znaczące
- Jako optimalizacja post-MVP

---

### Rekomendacja dla Billzilla MVP

**🎯 Start z Opcją A (wszystkie tools)**

**Uzasadnienie:**
1. **Time-to-market** - szybsza implementacja
2. **Niskie ryzyko** - AI zawsze ma co potrzebuje
3. **Koszt akceptowalny** - ~$0.03/1000 requests to niewiele
4. **Data-driven optimization** - zbierz dane, potem optymalizuj

**Migracja do Opcji B później:**
```javascript
// Faza 1 (MVP): Wszędzie ALL_TOOLS
const tools = ALL_TOOLS;

// Faza 2 (Post-MVP): Analiza logów
// Które tools są używane razem? 
// → Buduj patterns

// Faza 3: Wdróż classifier
const tools = smartSelectTools(userMessage, analytics);
```

---

### Przykładowe patterny do przyszłej optymalizacji

Z analizy user stories można przewidzieć:

| Pattern zapytania | Tools needed | Tokens saved |
|------------------|--------------|--------------|
| "Ile wydaliśmy...?" | `get_expenses_summary`, `get_group_metadata` | ~1500 (75%) |
| "Kto komu wisi?" | `get_member_balances`, `get_members` | ~1600 (80%) |
| "Top 5 wydatków" | `get_top_expenses`, `get_group_metadata` | ~1500 (75%) |
| "Podsumuj miesiąc" | `generate_group_report` | ~1800 (90%) |
| "Wydatki > średniej" | ALL_TOOLS (Generic flow) | 0 (fallback) |

**Średnia oszczędność:** ~40% przy dobrym classifierze

---

## 🧪 Testowanie



### Unit Tests
- Walidacja parametrów (pozytywne i negatywne przypadki)
- Autoryzacja (brak tokenu, niewłaściwa grupa)
- Rate limiting
- Edge cases (puste listy, brak transakcji, nieistniejące waluty)

### Integration Tests
- Pełny flow: User → LLM → Function Call → Response
- Multi-step conversations (follow-up questions)
- Obsługa błędów API

### Load Tests
- 100 zapytań równocześnie (rate limiting)
- Długie okresy dat (performance)

---

## 📝 Notatki

### Architektura

- **LLM Provider:** OpenRouter (rekomendowane dla MVP)
  - Agregator dający dostęp do wielu modeli (GPT-4, Claude, Gemini, etc.)
  - Kompatybilny z OpenAI Function Calling API
  - Failover między modelami jeśli jeden niedostępny
  - Start z `openai/gpt-4` lub `anthropic/claude-3.5-sonnet`
- **Hybrid Approach:** Kombinacja Generic (z paginacją) + Specialized tools
  - Generic tools: Elastyczność dla nietypowych zapytań
  - Specialized tools: Optymalizacja dla 80% typowych przypadków
- **Read-Only:** Wszystkie funkcje tylko do odczytu (zgodnie z decyzją A w pytaniu 3)
- **Paginacja:** Generic tools wspierają paginację (max limit potrzeba 100/page)
  - Ochrona przed oversized responses
  - Metadata w response: `has_next_page`, `total_count`, `total_pages`

### Funkcjonalność

- **Brak kategorii:** System nie wspiera jeszcze kategorii wydatków
  - Możliwe przyszłe rozszerzenie: AI może auto-kategoryzować na podstawie opisów
- **Multi-currency:** Wszystkie funkcje obsługują grupy multi-currency
  - Automatyczna konwersja do głównej waluty grupy
  - Osobna funkcja `get_currency_exchange_rates` dla grup z wieloma walutami

### Optymalizacje

- **Streaming:** Preferowane dla lepszego UX (długie odpowiedzi)
  - Server-Sent Events lub WebSockets
  - Progressywne renderowanie odpowiedzi AI
- **Caching:** Rozważyć cache dla często powtarzanych zapytań
  - `get_group_metadata` - metadane grupy (cache 5 min)
  - `get_members` - lista członków (cache do zmiany w grupie)
  - `get_currency_exchange_rates` - kursy walut (cache 1h)
  - **NIE cachować:** `get_expenses`, salda, statystyki (real-time data)

### Koszty i wydajność

- **Token usage estimation:**
  - Generic `get_expenses` (50 items): ~2500 tokenów
  - Specialized `get_expenses_summary`: ~300 tokenów
  - Generic `get_expenses` (100 items): ~5000 tokenów
- **Strategy:** AI preferuje Specialized dla typowych zapytań (80% przypadków)
- **Rate limiting:** 100 zapytań/grupa/dzień chroni przed wysokimi kosztami

### Bezpieczeństwo

- **Paginacja:** Limit 100 items/page zapobiega memory overflow
- **Walidacja:** Wszystkie parametry walidowane przed wysłaniem do DB
- **Authorization:** Group membership sprawdzany przy każdym wywołaniu

---

**Dokument przygotowany:** 2025-12-20  
**Wersja:** 2.0 (Hybrid Approach)  
**Następna aktualizacja:** Po implementacji POC
