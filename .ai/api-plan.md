# Plan API REST - Billzilla

## 1. Zasoby

Poniżej lista głównych zasobów API wraz z odpowiadającymi im tabelami bazy danych:

| Zasób                | Tabela bazy danych            | Opis                                            |
| -------------------- | ----------------------------- | ----------------------------------------------- |
| **Profiles**         | `profiles`                    | Profile użytkowników, rozszerzenie `auth.users` |
| **Groups**           | `groups`                      | Grupy rozliczeniowe                             |
| **Group Members**    | `group_members`               | Członkowie grup (relacja M:M)                   |
| **Currencies**       | `currencies`                  | Globalna lista walut (ISO 4217)                 |
| **Group Currencies** | `group_currencies`            | Waluty z kursami wymiany w grupie               |
| **Invitations**      | `invitations`                 | Zaproszenia do grup                             |
| **Expenses**         | `expenses` + `expense_splits` | Wydatki i ich podziały                          |
| **Settlements**      | `settlements`                 | Rozliczenia długów między użytkownikami         |
| **Balances**         | _obliczane dynamicznie_       | Salda użytkowników w grupie                     |

---

## 2. Punkty końcowe

### 2.1. Uwierzytelnianie

#### POST /api/auth/signup

**Opis:** Rejestracja nowego użytkownika za pomocą adresu e-mail i hasła. Wysyła e-mail weryfikacyjny.

**Wymagane nagłówki:**

- `Content-Type: application/json`

**Struktura żądania:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "Jan Kowalski"
}
```

**Struktura odpowiedzi (sukces):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": null,
    "created_at": "2025-01-01T00:00:00Z"
  },
  "message": "Rejestracja pomyślna. Sprawdź swoją skrzynkę e-mail, aby potwierdzić adres."
}
```

**Kody odpowiedzi:**

- `201 Created` - Rejestracja pomyślna, e-mail weryfikacyjny wysłany
- `400 Bad Request` - Nieprawidłowe dane wejściowe
- `422 Unprocessable Entity` - Błąd walidacji (np. hasło za krótkie, e-mail już istnieje)

**Walidacja:**

- `email` - wymagane, prawidłowy format e-mail, unikalny
- `password` - wymagane, min. 8 znaków
- `full_name` - opcjonalne, max. 100 znaków

---

#### POST /api/auth/login

**Opis:** Logowanie użytkownika za pomocą adresu e-mail i hasła.

**Wymagane nagłówki:**

- `Content-Type: application/json`

**Struktura żądania:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Struktura odpowiedzi (sukces):**

```json
{
  "access_token": "jwt_token_string",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_string",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": "2025-01-01T12:00:00Z",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Kody odpowiedzi:**

- `200 OK` - Logowanie pomyślne
- `400 Bad Request` - Nieprawidłowe dane wejściowe
- `401 Unauthorized` - Nieprawidłowy e-mail lub hasło
- `403 Forbidden` - E-mail nie został potwierdzony

---

#### POST /api/auth/google

**Opis:** Inicjuje proces logowania/rejestracji przez Google OAuth. Przekierowuje do Google.

**Struktura odpowiedzi (sukces):**

```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Kody odpowiedzi:**

- `200 OK` - URL do przekierowania zwrócony

---

#### POST /api/auth/callback

**Opis:** Callback po uwierzytelnieniu Google OAuth. Obsługiwany przez Supabase Auth.

**Parametry zapytania:**

- `code` (string, wymagany) - Kod autoryzacyjny z Google

**Struktura odpowiedzi (sukces):**

```json
{
  "access_token": "jwt_token_string",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_string",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Kody odpowiedzi:**

- `200 OK` - Uwierzytelnienie pomyślne
- `400 Bad Request` - Nieprawidłowy kod autoryzacyjny
- `401 Unauthorized` - Uwierzytelnianie nieudane

---

#### POST /api/auth/reset-password

**Opis:** Wysyła e-mail z linkiem do resetowania hasła.

**Wymagane nagłówki:**

- `Content-Type: application/json`

**Struktura żądania:**

```json
{
  "email": "user@example.com"
}
```

**Struktura odpowiedzi (sukces):**

```json
{
  "message": "Jeśli podany adres e-mail istnieje w systemie, wysłaliśmy na niego link do resetowania hasła."
}
```

**Kody odpowiedzi:**

- `200 OK` - Żądanie przetworzone (zawsze zwraca sukces ze względów bezpieczeństwa)
- `400 Bad Request` - Nieprawidłowy format e-mail

---

#### POST /api/auth/update-password

**Opis:** Aktualizuje hasło użytkownika po użyciu linku resetującego.

**Wymagane nagłówki:**

- `Content-Type: application/json`
- `Authorization: Bearer {access_token_from_reset_link}`

**Struktura żądania:**

```json
{
  "password": "newSecurePassword123"
}
```

**Struktura odpowiedzi (sukces):**

```json
{
  "message": "Hasło zostało zmienione pomyślnie."
}
```

**Kody odpowiedzi:**

- `200 OK` - Hasło zmienione
- `400 Bad Request` - Nieprawidłowe dane
- `401 Unauthorized` - Nieprawidłowy lub wygasły token
- `422 Unprocessable Entity` - Błąd walidacji (np. hasło za krótkie)

**Walidacja:**

- `password` - wymagane, min. 8 znaków

---

#### POST /api/auth/logout

**Opis:** Wylogowuje użytkownika (unieważnia token).

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Struktura odpowiedzi (sukces):**

```json
{
  "message": "Wylogowano pomyślnie."
}
```

**Kody odpowiedzi:**

- `200 OK` - Wylogowanie pomyślne
- `401 Unauthorized` - Brak lub nieprawidłowy token

---

### 2.2. Profile użytkowników

#### GET /api/profiles/me

**Opis:** Pobiera profil zalogowanego użytkownika.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Struktura odpowiedzi (sukces):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Jan Kowalski",
  "avatar_url": "https://example.com/avatar.jpg",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Kody odpowiedzi:**

- `200 OK` - Sukces
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `404 Not Found` - Profil nie istnieje

**Uwagi:**

- Dane profilu są synchronizowane z Google OAuth przy każdym logowaniu
- Użytkownik nie może edytować profilu - zmiany muszą być dokonane w koncie Google

---

### 2.3. Grupy

#### GET /api/groups

**Opis:** Pobiera listę grup, do których należy użytkownik.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry zapytania:**

- `status` (string, opcjonalny) - Filtruj po statusie: `active`, `archived`. Domyślnie: `active`
- `limit` (number, opcjonalny) - Limit wyników (1-100). Domyślnie: 50
- `offset` (number, opcjonalny) - Przesunięcie dla paginacji. Domyślnie: 0

**Struktura odpowiedzi (sukces):**

```json
{
  "data": [
    {
      "id": "28635650-7151-43e6-a95b-f5c70709734d",
      "name": "Wyjazd w gory",
      "base_currency_code": "PLN",
      "status": "active",
      "created_at": "2025-10-18T11:46:11.229243+00:00",
      "role": "creator",
      "member_count": 1,
      "my_balance": 0,
      "members": [
        {
          "profile_id": "a814cd69-42a9-4154-b97c-4f2565d05b57",
          "full_name": null,
          "avatar_url": null,
          "status": "active"
        }
      ]
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

**Kody odpowiedzi:**

- `200 OK` - Sukces
- `401 Unauthorized` - Brak autoryzacji
- `400 Bad Request` - Nieprawidłowe parametry zapytania

---

#### POST /api/groups

**Opis:** Tworzy nową grupę. Użytkownik automatycznie staje się jej twórcą i pierwszym członkiem. Opcjonalnie można od razu zaprosić członków.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`

**Struktura żądania:**

```json
{
  "name": "Wyjazd do Zakopanego",
  "base_currency_code": "PLN",
  "invite_emails": ["anna@example.com", "piotr@example.com"]
}
```

**Struktura odpowiedzi (sukces):**

```json
{
  "id": "uuid",
  "name": "Wyjazd do Zakopanego",
  "base_currency_code": "PLN",
  "status": "active",
  "created_at": "2025-01-15T10:00:00Z",
  "role": "creator",
  "invitations": {
    "added_members": [
      {
        "profile_id": "uuid",
        "email": "anna@example.com",
        "full_name": "Anna Nowak",
        "status": "active"
      }
    ],
    "created_invitations": [
      {
        "id": "uuid",
        "email": "piotr@example.com",
        "status": "pending"
      }
    ]
  }
}
```

**Kody odpowiedzi:**

- `201 Created` - Grupa utworzona pomyślnie (zaproszenia przetwarzane best-effort)
- `400 Bad Request` - Nieprawidłowe dane wejściowe
- `401 Unauthorized` - Brak autoryzacji
- `422 Unprocessable Entity` - Błąd walidacji (np. nieprawidłowy kod waluty)

**Walidacja:**

- `name` - wymagane, min. 1 znak, max. 100 znaków
- `base_currency_code` - wymagane, musi istnieć w tabeli `currencies`
- `invite_emails` - opcjonalne, tablica, max. 20 elementów, każdy e-mail musi być prawidłowym adresem

**Uwagi:**

- Jeśli `invite_emails` jest puste lub nie podane, tworzona jest tylko grupa
- Grupa jest tworzona w transakcji, ale błędy zaproszeń nie rollbackują utworzenia grupy
- Zaproszenia są przetwarzane analogicznie jak w `POST /api/groups/:groupId/members/invite`

---

#### GET /api/groups/:id

**Opis:** Pobiera szczegóły grupy wraz z listą członków.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `id` (uuid) - Identyfikator grupy

**Struktura odpowiedzi (sukces):**

```json
{
  "id": "uuid",
  "name": "Wyjazd do Zakopanego",
  "base_currency_code": "PLN",
  "status": "active",
  "created_at": "2025-01-01T00:00:00Z",
  "my_role": "creator",
  "members": [
    {
      "profile_id": "uuid",
      "full_name": "Jan Kowalski",
      "email": "jan@example.com",
      "avatar_url": "https://example.com/avatar.jpg",
      "role": "creator",
      "status": "active",
      "joined_at": "2025-01-01T00:00:00Z"
    },
    {
      "profile_id": "uuid",
      "full_name": "Anna Nowak",
      "email": "anna@example.com",
      "avatar_url": "https://example.com/avatar2.jpg",
      "role": "member",
      "status": "active",
      "joined_at": "2025-01-02T10:00:00Z"
    }
  ],
  "pending_invitations": [
    {
      "id": "uuid",
      "email": "invited@example.com",
      "status": "pending",
      "created_at": "2025-01-10T15:00:00Z"
    }
  ]
}
```

**Kody odpowiedzi:**

- `200 OK` - Sukces
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy
- `404 Not Found` - Grupa nie istnieje

---

#### PATCH /api/groups/:id

**Opis:** Aktualizuje dane grupy (tylko nazwa). Dostępne tylko dla twórcy grupy.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`

**Parametry URL:**

- `id` (uuid) - Identyfikator grupy

**Struktura żądania:**

```json
{
  "name": "Nowa nazwa grupy"
}
```

**Struktura odpowiedzi (sukces):**

```json
{
  "id": "uuid",
  "name": "Nowa nazwa grupy",
  "base_currency_code": "PLN",
  "status": "active",
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Kody odpowiedzi:**

- `200 OK` - Aktualizacja pomyślna
- `400 Bad Request` - Nieprawidłowe dane
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest twórcą grupy
- `404 Not Found` - Grupa nie istnieje
- `422 Unprocessable Entity` - Błąd walidacji

**Walidacja:**

- `name` - min. 1 znak, max. 100 znaków

---

#### POST /api/groups/:id/archive

**Opis:** Archiwizuje grupę (soft delete). Dostępne tylko dla twórcy grupy.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `id` (uuid) - Identyfikator grupy

**Struktura odpowiedzi (sukces):**

```json
{
  "id": "uuid",
  "name": "Wyjazd do Zakopanego",
  "base_currency_code": "PLN",
  "status": "archived",
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Kody odpowiedzi:**

- `200 OK` - Grupa zarchiwizowana
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest twórcą grupy
- `404 Not Found` - Grupa nie istnieje

---

#### POST /api/groups/:id/leave

**Opis:** Użytkownik opuszcza grupę. Status członkostwa zmienia się na "inactive", ale dane finansowe są zachowane.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `id` (uuid) - Identyfikator grupy

**Struktura odpowiedzi (sukces):**

```json
{
  "message": "Opuściłeś grupę",
  "group_id": "uuid"
}
```

**Kody odpowiedzi:**

- `200 OK` - Opuszczenie grupy pomyślne
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy lub jest twórcą (twórca nie może opuścić grupy bez jej archiwizacji)
- `404 Not Found` - Grupa nie istnieje

---

### 2.4. Członkowie grup

#### POST /api/groups/:groupId/members/invite

**Opis:** Zaprasza użytkowników do grupy po adresie e-mail. Jeśli użytkownik istnieje, jest dodawany automatycznie. Jeśli nie, tworzone jest zaproszenie.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`

**Parametry URL:**

- `groupId` (uuid) - Identyfikator grupy

**Struktura żądania:**

```json
{
  "emails": ["user1@example.com", "user2@example.com"]
}
```

**Struktura odpowiedzi (sukces):**

```json
{
  "added_members": [
    {
      "profile_id": "uuid",
      "email": "user1@example.com",
      "full_name": "Użytkownik Jeden",
      "status": "active"
    }
  ],
  "created_invitations": [
    {
      "id": "uuid",
      "email": "user2@example.com",
      "status": "pending"
    }
  ]
}
```

**Kody odpowiedzi:**

- `200 OK` - Zaproszenia przetworzone
- `400 Bad Request` - Nieprawidłowe dane (np. pusta lista e-maili)
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy
- `404 Not Found` - Grupa nie istnieje
- `422 Unprocessable Entity` - Błąd walidacji (np. nieprawidłowy format e-mail)

**Walidacja:**

- `emails` - wymagane, tablica, min. 1 element, max. 20 elementów
- każdy e-mail musi być prawidłowym adresem e-mail

---

#### DELETE /api/groups/:groupId/members/:profileId

**Opis:** Usuwa członka z grupy (zmienia status na "inactive"). Członek może usunąć siebie (równoważne z `leave`). Twórca może usuwać innych członków.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `groupId` (uuid) - Identyfikator grupy
- `profileId` (uuid) - Identyfikator profilu do usunięcia

**Struktura odpowiedzi (sukces):**

```json
{
  "message": "Członek usunięty z grupy",
  "profile_id": "uuid",
  "status": "inactive"
}
```

**Kody odpowiedzi:**

- `200 OK` - Członek usunięty
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie ma uprawnień (nie jest twórcą ani nie usuwa siebie)
- `404 Not Found` - Grupa lub członek nie istnieje

---

### 2.5. Waluty w grupie

#### GET /api/groups/:groupId/currencies

**Opis:** Pobiera listę walut dostępnych w grupie wraz z kursami wymiany.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `groupId` (uuid) - Identyfikator grupy

**Struktura odpowiedzi (sukces):**

```json
{
  "base_currency": {
    "code": "PLN",
    "name": "Polski złoty",
    "exchange_rate": 1.0
  },
  "additional_currencies": [
    {
      "code": "EUR",
      "name": "Euro",
      "exchange_rate": 4.5
    },
    {
      "code": "USD",
      "name": "Dolar amerykański",
      "exchange_rate": 4.1
    }
  ]
}
```

**Kody odpowiedzi:**

- `200 OK` - Sukces
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy
- `404 Not Found` - Grupa nie istnieje

---

#### POST /api/groups/:groupId/currencies

**Opis:** Dodaje nową walutę do grupy z określonym kursem wymiany.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`

**Parametry URL:**

- `groupId` (uuid) - Identyfikator grupy

**Struktura żądania:**

```json
{
  "currency_code": "EUR",
  "exchange_rate": 4.5
}
```

**Struktura odpowiedzi (sukces):**

```json
{
  "currency_code": "EUR",
  "name": "Euro",
  "exchange_rate": 4.5
}
```

**Kody odpowiedzi:**

- `201 Created` - Waluta dodana
- `400 Bad Request` - Nieprawidłowe dane
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy
- `404 Not Found` - Grupa nie istnieje lub kod waluty nie istnieje w systemie
- `409 Conflict` - Waluta już istnieje w grupie
- `422 Unprocessable Entity` - Błąd walidacji

**Walidacja:**

- `currency_code` - wymagane, musi istnieć w tabeli `currencies`
- `exchange_rate` - wymagane, liczba > 0, max. 4 miejsca po przecinku
- waluta nie może być taka sama jak waluta bazowa grupy

---

#### PATCH /api/groups/:groupId/currencies/:code

**Opis:** Aktualizuje kurs wymiany waluty w grupie.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`

**Parametry URL:**

- `groupId` (uuid) - Identyfikator grupy
- `code` (string) - Kod waluty (np. "EUR")

**Struktura żądania:**

```json
{
  "exchange_rate": 4.6
}
```

**Struktura odpowiedzi (sukces):**

```json
{
  "currency_code": "EUR",
  "name": "Euro",
  "exchange_rate": 4.6
}
```

**Kody odpowiedzi:**

- `200 OK` - Kurs zaktualizowany
- `400 Bad Request` - Nieprawidłowe dane
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy lub próbuje zmienić walutę bazową
- `404 Not Found` - Grupa lub waluta nie istnieje
- `422 Unprocessable Entity` - Błąd walidacji

**Walidacja:**

- `exchange_rate` - wymagane, liczba > 0, max. 4 miejsca po przecinku

---

#### DELETE /api/groups/:groupId/currencies/:code

**Opis:** Usuwa walutę z grupy. Nie można usunąć waluty bazowej.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `groupId` (uuid) - Identyfikator grupy
- `code` (string) - Kod waluty (np. "EUR")

**Struktura odpowiedzi (sukces):**

```json
{
  "message": "Waluta usunięta z grupy",
  "currency_code": "EUR"
}
```

**Kody odpowiedzi:**

- `200 OK` - Waluta usunięta
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy lub próbuje usunąć walutę bazową
- `404 Not Found` - Grupa lub waluta nie istnieje
- `409 Conflict` - Waluta jest używana w istniejących wydatkach

---

### 2.6. Wydatki

#### GET /api/groups/:groupId/expenses

**Opis:** Pobiera listę wydatków w grupie z możliwością filtrowania i sortowania.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `groupId` (uuid) - Identyfikator grupy

**Parametry zapytania:**

- `limit` (number, opcjonalny) - Limit wyników (1-100). Domyślnie: 50
- `offset` (number, opcjonalny) - Przesunięcie dla paginacji. Domyślnie: 0
- `sort` (string, opcjonalny) - Sortowanie: `date_desc`, `date_asc`, `amount_desc`, `amount_asc`. Domyślnie: `date_desc`
- `from_date` (string ISO 8601, opcjonalny) - Filtruj wydatki od tej daty
- `to_date` (string ISO 8601, opcjonalny) - Filtruj wydatki do tej daty
- `created_by` (uuid, opcjonalny) - Filtruj po twórcy wydatku
- `currency_code` (string, opcjonalny) - Filtruj po walucie

**Struktura odpowiedzi (sukces):**

```json
{
  "data": [
    {
      "id": "uuid",
      "group_id": "uuid",
      "description": "Obiad w restauracji",
      "amount": 250.0,
      "currency_code": "PLN",
      "amount_in_base_currency": 250.0,
      "expense_date": "2025-01-15T18:30:00Z",
      "created_at": "2025-01-15T19:00:00Z",
      "created_by": {
        "id": "uuid",
        "full_name": "Jan Kowalski",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "splits": [
        {
          "profile_id": "uuid",
          "full_name": "Jan Kowalski",
          "amount": 125.0
        },
        {
          "profile_id": "uuid",
          "full_name": "Anna Nowak",
          "amount": 125.0
        }
      ]
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

**Kody odpowiedzi:**

- `200 OK` - Sukces
- `400 Bad Request` - Nieprawidłowe parametry zapytania
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy
- `404 Not Found` - Grupa nie istnieje

---

#### POST /api/groups/:groupId/expenses

**Opis:** Tworzy nowy wydatek w grupie. Wymaga podania szczegółów wydatku oraz dokładnego podziału na uczestników (obliczonego po stronie klienta).

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`

**Parametry URL:**

- `groupId` (uuid) - Identyfikator grupy

**Struktura żądania:**

```json
{
  "description": "Obiad w restauracji",
  "amount": 250.0,
  "currency_code": "PLN",
  "expense_date": "2025-01-15T18:30:00Z",
  "payer_id": "uuid",
  "splits": [
    {
      "profile_id": "uuid1",
      "amount": 83.33
    },
    {
      "profile_id": "uuid2",
      "amount": 83.33
    },
    {
      "profile_id": "uuid3",
      "amount": 83.34
    }
  ]
}
```

**Struktura odpowiedzi (sukces):**

```json
{
  "id": "uuid",
  "group_id": "uuid",
  "description": "Obiad w restauracji",
  "amount": 250.0,
  "currency_code": "PLN",
  "amount_in_base_currency": 250.0,
  "expense_date": "2025-01-15T18:30:00Z",
  "created_at": "2025-01-15T19:00:00Z",
  "created_by": "uuid",
  "splits": [
    {
      "profile_id": "uuid1",
      "amount": 83.33
    },
    {
      "profile_id": "uuid2",
      "amount": 83.33
    },
    {
      "profile_id": "uuid3",
      "amount": 83.34
    }
  ]
}
```

**Kody odpowiedzi:**

- `201 Created` - Wydatek utworzony
- `400 Bad Request` - Nieprawidłowe dane
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy
- `404 Not Found` - Grupa nie istnieje
- `422 Unprocessable Entity` - Błąd walidacji (np. suma podziałów ≠ kwota wydatku)

**Walidacja:**

- `description` - wymagane, min. 1 znak, max. 500 znaków
- `amount` - wymagane, liczba > 0, max. 2 miejsca po przecinku
- `currency_code` - wymagane, musi istnieć w walutach grupy
- `expense_date` - wymagane, format ISO 8601
- `payer_id` - wymagane, musi być członkiem grupy
- `splits` - wymagane, tablica, min. 1 element
  - `splits[].profile_id` - wymagane, musi być członkiem grupy
  - `splits[].amount` - wymagane, liczba > 0, max. 2 miejsca po przecinku
  - **SUMA `splits[].amount` musi być równa `amount`** (walidacja po stronie serwera)

**Logika biznesowa:**

- Operacja wykonywana w transakcji bazodanowej
- Walidacja sumy: `sum(splits[].amount) === amount` (z tolerancją ±0.01 na błędy zaokrągleń)
- Tworzenie rekordu w `expenses`
- Tworzenie rekordów w `expense_splits` dla każdego uczestnika
- Przeliczenie kwoty na walutę bazową grupy zgodnie z kursem
- Po zapisie wysłanie aktualizacji przez Realtime Subscriptions

**Uwagi:**

- Klient (frontend) jest odpowiedzialny za obliczenie podziału kwoty
- Backend tylko waliduje, czy suma się zgadza
- To daje użytkownikowi pełną kontrolę nad dokładnym podziałem (kto dostaje "resztę z dzielenia")

---

#### GET /api/expenses/:id

**Opis:** Pobiera szczegóły pojedynczego wydatku.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `id` (uuid) - Identyfikator wydatku

**Struktura odpowiedzi (sukces):**

```json
{
  "id": "uuid",
  "group_id": "uuid",
  "description": "Obiad w restauracji",
  "amount": 250.0,
  "currency_code": "PLN",
  "amount_in_base_currency": 250.0,
  "expense_date": "2025-01-15T18:30:00Z",
  "created_at": "2025-01-15T19:00:00Z",
  "created_by": {
    "id": "uuid",
    "full_name": "Jan Kowalski",
    "email": "jan@example.com",
    "avatar_url": "https://example.com/avatar.jpg"
  },
  "payer": {
    "id": "uuid",
    "full_name": "Jan Kowalski"
  },
  "splits": [
    {
      "profile_id": "uuid",
      "full_name": "Jan Kowalski",
      "amount": 125.0
    },
    {
      "profile_id": "uuid",
      "full_name": "Anna Nowak",
      "amount": 125.0
    }
  ]
}
```

**Kody odpowiedzi:**

- `200 OK` - Sukces
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy
- `404 Not Found` - Wydatek nie istnieje

---

#### PATCH /api/expenses/:id

**Opis:** Aktualizuje wydatek. Dostępne tylko dla twórcy wydatku.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`

**Parametry URL:**

- `id` (uuid) - Identyfikator wydatku

**Struktura żądania:**

```json
{
  "description": "Obiad w restauracji (zaktualizowany)",
  "amount": 280.0,
  "currency_code": "PLN",
  "expense_date": "2025-01-15T18:30:00Z",
  "payer_id": "uuid",
  "splits": [
    {
      "profile_id": "uuid1",
      "amount": 140.0
    },
    {
      "profile_id": "uuid2",
      "amount": 140.0
    }
  ]
}
```

**Struktura odpowiedzi (sukces):**

```json
{
  "id": "uuid",
  "group_id": "uuid",
  "description": "Obiad w restauracji (zaktualizowany)",
  "amount": 280.0,
  "currency_code": "PLN",
  "amount_in_base_currency": 280.0,
  "expense_date": "2025-01-15T18:30:00Z",
  "created_at": "2025-01-15T19:00:00Z",
  "created_by": "uuid",
  "splits": [
    {
      "profile_id": "uuid1",
      "amount": 140.0
    },
    {
      "profile_id": "uuid2",
      "amount": 140.0
    }
  ]
}
```

**Kody odpowiedzi:**

- `200 OK` - Wydatek zaktualizowany
- `400 Bad Request` - Nieprawidłowe dane
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest twórcą wydatku
- `404 Not Found` - Wydatek nie istnieje
- `422 Unprocessable Entity` - Błąd walidacji (np. suma podziałów ≠ kwota wydatku)

**Walidacja:** Taka sama jak przy tworzeniu wydatku (patrz `POST /api/groups/:groupId/expenses`)

**Logika biznesowa:**

- Operacja wykonywana w transakcji bazodanowej
- Usunięcie starych rekordów z `expense_splits`
- Aktualizacja rekordu w `expenses`
- Utworzenie nowych rekordów w `expense_splits`
- Wysłanie aktualizacji przez Realtime Subscriptions

---

#### DELETE /api/expenses/:id

**Opis:** Usuwa wydatek. Dostępne tylko dla twórcy wydatku.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `id` (uuid) - Identyfikator wydatku

**Struktura odpowiedzi (sukces):**

```json
{
  "message": "Wydatek usunięty",
  "id": "uuid"
}
```

**Kody odpowiedzi:**

- `200 OK` - Wydatek usunięty
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest twórcą wydatku
- `404 Not Found` - Wydatek nie istnieje

**Logika biznesowa:**

- Operacja wykonywana w transakcji bazodanowej
- Usunięcie rekordów z `expense_splits` (CASCADE)
- Usunięcie rekordu z `expenses`
- Wysłanie aktualizacji przez Realtime Subscriptions

---

#### POST /api/expenses/transcribe

**Opis:** Przetwarza nagranie głosowe i zwraca ustrukturyzowane dane wydatku (AI endpoint). Endpoint asynchroniczny - zwraca task_id, który można odpytywać o status.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`
- `Content-Type: multipart/form-data`

**Struktura żądania:**

- `audio` (file) - Plik audio (max. 10MB, formaty: mp3, wav, m4a, webm)
- `group_id` (uuid) - Identyfikator grupy (do kontekstu członków)

**Struktura odpowiedzi (sukces - zadanie utworzone):**

```json
{
  "task_id": "uuid",
  "status": "processing",
  "created_at": "2025-01-15T19:00:00Z"
}
```

**Kody odpowiedzi:**

- `202 Accepted` - Zadanie przyjęte do przetwarzania
- `400 Bad Request` - Nieprawidłowy plik lub parametry
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy
- `413 Payload Too Large` - Plik za duży
- `415 Unsupported Media Type` - Nieobsługiwany format audio

---

#### GET /api/expenses/transcribe/:taskId

**Opis:** Pobiera status i wyniki przetwarzania nagrania głosowego.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `taskId` (uuid) - Identyfikator zadania

**Struktura odpowiedzi (sukces - w trakcie przetwarzania):**

```json
{
  "task_id": "uuid",
  "status": "processing",
  "created_at": "2025-01-15T19:00:00Z"
}
```

**Struktura odpowiedzi (sukces - przetworzono):**

```json
{
  "task_id": "uuid",
  "status": "completed",
  "created_at": "2025-01-15T19:00:00Z",
  "completed_at": "2025-01-15T19:00:15Z",
  "result": {
    "transcription": "Ja zapłaciłem 50 euro za lunch dla mnie i Ani",
    "expense_data": {
      "description": "lunch",
      "amount": 50.0,
      "currency_code": "EUR",
      "payer_id": "uuid_zalogowanego_użytkownika",
      "splits": [
        {
          "profile_id": "uuid_zalogowanego",
          "amount": 25.0
        },
        {
          "profile_id": "uuid_ani",
          "amount": 25.0
        }
      ]
    },
    "confidence": 0.95
  }
}
```

**Struktura odpowiedzi (błąd przetwarzania):**

```json
{
  "task_id": "uuid",
  "status": "failed",
  "created_at": "2025-01-15T19:00:00Z",
  "completed_at": "2025-01-15T19:00:15Z",
  "error": {
    "code": "TRANSCRIPTION_FAILED",
    "message": "Nie udało się przetworzyć nagrania"
  }
}
```

**Kody odpowiedzi:**

- `200 OK` - Status zadania pobrany
- `401 Unauthorized` - Brak autoryzacji
- `404 Not Found` - Zadanie nie istnieje

**Logika biznesowa:**

- Krok 1: Transkrypcja audio na tekst (Whisper przez Openrouter.ai)
- Krok 2: Ekstrakcja danych z tekstu (LLM przez Openrouter.ai)
- Kontekst dla LLM: lista członków grupy, waluta bazowa, dostępne waluty
- Wynik zwracany w formacie JSON gotowym do wypełnienia formularza
- Klucz API Openrouter.ai przechowywany w Edge Function (bezpieczeństwo)

---

### 2.7. Rozliczenia

#### GET /api/groups/:groupId/settlements

**Opis:** Pobiera listę rozliczeń w grupie.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `groupId` (uuid) - Identyfikator grupy

**Parametry zapytania:**

- `limit` (number, opcjonalny) - Limit wyników (1-100). Domyślnie: 50
- `offset` (number, opcjonalny) - Przesunięcie dla paginacji. Domyślnie: 0
- `sort` (string, opcjonalny) - Sortowanie: `date_desc`, `date_asc`. Domyślnie: `date_desc`

**Struktura odpowiedzi (sukces):**

```json
{
  "data": [
    {
      "id": "uuid",
      "group_id": "uuid",
      "payer": {
        "id": "uuid",
        "full_name": "Anna Nowak",
        "avatar_url": "https://example.com/avatar2.jpg"
      },
      "payee": {
        "id": "uuid",
        "full_name": "Jan Kowalski",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "amount": 150.0,
      "settled_at": "2025-01-16T10:00:00Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

**Kody odpowiedzi:**

- `200 OK` - Sukces
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy
- `404 Not Found` - Grupa nie istnieje

---

#### POST /api/groups/:groupId/settlements

**Opis:** Tworzy nowe rozliczenie (spłata długu) w grupie. Kwota zawsze w walucie bazowej grupy.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`

**Parametry URL:**

- `groupId` (uuid) - Identyfikator grupy

**Struktura żądania:**

```json
{
  "payer_id": "uuid",
  "payee_id": "uuid",
  "amount": 150.0
}
```

**Struktura odpowiedzi (sukces):**

```json
{
  "id": "uuid",
  "group_id": "uuid",
  "payer_id": "uuid",
  "payee_id": "uuid",
  "amount": 150.0,
  "settled_at": "2025-01-16T10:00:00Z"
}
```

**Kody odpowiedzi:**

- `201 Created` - Rozliczenie utworzone
- `400 Bad Request` - Nieprawidłowe dane
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy
- `404 Not Found` - Grupa nie istnieje
- `422 Unprocessable Entity` - Błąd walidacji

**Walidacja:**

- `payer_id` - wymagane, musi być członkiem grupy
- `payee_id` - wymagane, musi być członkiem grupy, nie może być taki sam jak `payer_id`
- `amount` - wymagane, liczba > 0, max. 2 miejsca po przecinku

**Logika biznesowa:**

- Kwota zawsze w walucie bazowej grupy
- Rozliczenie jest niemutowalne (nie można edytować ani usuwać)
- Po zapisie wysłanie aktualizacji przez Realtime Subscriptions

---

#### GET /api/groups/:groupId/balances

**Opis:** Oblicza i zwraca podsumowanie sald w grupie. Pokazuje, kto komu jest winien pieniądze. Wszystkie kwoty w walucie bazowej grupy.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `groupId` (uuid) - Identyfikator grupy

**Struktura odpowiedzi (sukces):**

```json
{
  "group_id": "uuid",
  "base_currency_code": "PLN",
  "calculated_at": "2025-01-16T12:00:00Z",
  "member_balances": [
    {
      "profile_id": "uuid",
      "full_name": "Jan Kowalski",
      "avatar_url": "https://example.com/avatar.jpg",
      "balance": 125.5,
      "status": "active"
    },
    {
      "profile_id": "uuid",
      "full_name": "Anna Nowak",
      "avatar_url": "https://example.com/avatar2.jpg",
      "balance": -75.25,
      "status": "active"
    },
    {
      "profile_id": "uuid",
      "full_name": "Piotr Wiśniewski",
      "avatar_url": "https://example.com/avatar3.jpg",
      "balance": -50.25,
      "status": "active"
    }
  ],
  "suggested_settlements": [
    {
      "from": {
        "profile_id": "uuid",
        "full_name": "Anna Nowak"
      },
      "to": {
        "profile_id": "uuid",
        "full_name": "Jan Kowalski"
      },
      "amount": 75.25
    },
    {
      "from": {
        "profile_id": "uuid",
        "full_name": "Piotr Wiśniewski"
      },
      "to": {
        "profile_id": "uuid",
        "full_name": "Jan Kowalski"
      },
      "amount": 50.25
    }
  ]
}
```

**Kody odpowiedzi:**

- `200 OK` - Sukces
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Użytkownik nie jest członkiem grupy
- `404 Not Found` - Grupa nie istnieje

**Logika biznesowa:**

- Salda obliczane dynamicznie na podstawie:
  - Wydatków: kto zapłacił vs. kto uczestniczył (z `expenses` i `expense_splits`)
  - Rozliczeń: spłaty długów (z `settlements`)
- Wszystkie kwoty przeliczane na walutę bazową grupy
- Dodatnie saldo = osoba ma dostać pieniądze
- Ujemne saldo = osoba jest winna pieniądze
- `suggested_settlements` - algorytm minimalizujący liczbę transakcji potrzebnych do wyrównania sald

---

### 2.8. Waluty (globalne)

#### GET /api/currencies

**Opis:** Pobiera listę wszystkich dostępnych walut w systemie (ISO 4217).

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry zapytania:**

- `search` (string, opcjonalny) - Wyszukaj po kodzie lub nazwie waluty

**Struktura odpowiedzi (sukces):**

```json
{
  "data": [
    {
      "code": "PLN",
      "name": "Polski złoty"
    },
    {
      "code": "EUR",
      "name": "Euro"
    },
    {
      "code": "USD",
      "name": "Dolar amerykański"
    }
  ],
  "total": 150
}
```

**Kody odpowiedzi:**

- `200 OK` - Sukces
- `401 Unauthorized` - Brak autoryzacji

---

### 2.9. Zaproszenia

#### GET /api/invitations

**Opis:** Pobiera listę zaproszeń dla zalogowanego użytkownika (po adresie e-mail).

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry zapytania:**

- `status` (string, opcjonalny) - Filtruj po statusie: `pending`, `accepted`, `declined`. Domyślnie: `pending`

**Struktura odpowiedzi (sukces):**

```json
{
  "data": [
    {
      "id": "uuid",
      "group": {
        "id": "uuid",
        "name": "Wyjazd do Zakopanego"
      },
      "email": "user@example.com",
      "status": "pending",
      "created_at": "2025-01-10T15:00:00Z"
    }
  ],
  "total": 3
}
```

**Kody odpowiedzi:**

- `200 OK` - Sukces
- `401 Unauthorized` - Brak autoryzacji

---

#### POST /api/invitations/:id/accept

**Opis:** Akceptuje zaproszenie do grupy. Użytkownik zostaje dodany jako członek grupy.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `id` (uuid) - Identyfikator zaproszenia

**Struktura odpowiedzi (sukces):**

```json
{
  "message": "Zaproszenie zaakceptowane",
  "invitation_id": "uuid",
  "group_id": "uuid",
  "group_name": "Wyjazd do Zakopanego"
}
```

**Kody odpowiedzi:**

- `200 OK` - Zaproszenie zaakceptowane
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Zaproszenie nie jest przeznaczone dla tego użytkownika
- `404 Not Found` - Zaproszenie nie istnieje
- `409 Conflict` - Zaproszenie już zostało przetworzone

**Logika biznesowa:**

- Operacja wykonywana w transakcji bazodanowej
- Zmiana statusu zaproszenia na "accepted"
- Dodanie użytkownika do `group_members` z rolą "member" i statusem "active"

---

#### POST /api/invitations/:id/decline

**Opis:** Odrzuca zaproszenie do grupy.

**Wymagane nagłówki:**

- `Authorization: Bearer {access_token}`

**Parametry URL:**

- `id` (uuid) - Identyfikator zaproszenia

**Struktura odpowiedzi (sukces):**

```json
{
  "message": "Zaproszenie odrzucone",
  "invitation_id": "uuid"
}
```

**Kody odpowiedzi:**

- `200 OK` - Zaproszenie odrzucone
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Zaproszenie nie jest przeznaczone dla tego użytkownika
- `404 Not Found` - Zaproszenie nie istnieje
- `409 Conflict` - Zaproszenie już zostało przetworzone

**Logika biznesowa:**

- Zmiana statusu zaproszenia na "declined"

---

## 3. Uwierzytelnianie i autoryzacja

### 3.1. Mechanizm uwierzytelniania

Aplikacja wykorzystuje **Supabase Auth** z dwoma metodami uwierzytelniania:

#### 3.1.1. Logowanie e-mail i hasło

1. **Proces rejestracji:**
   - Użytkownik wypełnia formularz rejestracji (e-mail, hasło, opcjonalnie imię)
   - Frontend wysyła żądanie `POST /api/auth/signup`
   - Supabase Auth tworzy konto użytkownika i wysyła e-mail weryfikacyjny
   - Automatycznie tworzony jest rekord w tabeli `profiles`
   - Użytkownik musi potwierdzić adres e-mail klikając w link w e-mailu
   - Po potwierdzeniu użytkownik może się zalogować

2. **Proces logowania:**
   - Użytkownik wpisuje e-mail i hasło na stronie logowania
   - Frontend wysyła żądanie `POST /api/auth/login`
   - Supabase Auth weryfikuje dane i zwraca tokeny JWT (access_token i refresh_token)
   - Użytkownik jest przekierowywany na pulpit lub poprzednią stronę

3. **Proces resetowania hasła:**
   - Użytkownik klika "Zapomniałeś hasła?" na stronie logowania
   - Podaje swój adres e-mail w formularzu resetowania
   - Frontend wysyła żądanie `POST /api/auth/reset-password`
   - Supabase wysyła e-mail z linkiem resetującym
   - Użytkownik klika w link i jest przekierowywany na stronę ustawiania nowego hasła
   - Po ustawieniu nowego hasła użytkownik może się zalogować

#### 3.1.2. Logowanie Google OAuth

1. **Proces logowania:**
   - Użytkownik klika "Kontynuuj z Google" na stronie logowania/rejestracji
   - Frontend wysyła żądanie `POST /api/auth/google` lub przekierowuje bezpośrednio
   - Supabase Auth obsługuje flow OAuth z Google
   - Po pomyślnym uwierzytelnieniu, użytkownik jest przekierowywany z powrotem do aplikacji z kodem autoryzacyjnym
   - Kod jest wymieniany na tokeny JWT (access_token i refresh_token)
   - Jeśli użytkownik loguje się po raz pierwszy, automatycznie tworzony jest rekord w tabeli `profiles`
   - Użytkownik jest przekierowywany na pulpit

#### 3.1.3. Ochrona tras

Wszystkie strony aplikacji wymagają uwierzytelnienia, z następującymi wyjątkami:

- `/login` - strona logowania
- `/signup` - strona rejestracji
- `/reset-password` - strona resetowania hasła
- `/about` - strona o aplikacji

Implementacja ochrony tras:

- **Middleware Astro:** Sprawdza obecność ważnego tokenu JWT w nagłówkach lub cookies
- Jeśli token jest nieważny lub nie istnieje, użytkownik jest przekierowywany na `/login`
- Po zalogowaniu użytkownik jest przekierowywany na pierwotnie żądaną stronę (lub `/` jako domyślna)

2. **Format tokenu:**
   - Każde żądanie API wymaga nagłówka: `Authorization: Bearer {access_token}`
   - Token JWT zawiera: `user_id`, `email`, `exp` (czas wygaśnięcia)
   - Czas życia access_token: 1 godzina
   - Refresh token służy do odnowienia access_token

3. **Refresh token:**
   - Endpoint: `POST /api/auth/refresh`
   - Klient automatycznie odnawia token przed wygaśnięciem
   - Po wygaśnięciu refresh token, użytkownik musi zalogować się ponownie

### 3.2. Autoryzacja na poziomie zasobów

Autoryzacja opiera się na **Row-Level Security (RLS)** w PostgreSQL:

1. **Profiles:**
   - Użytkownik może odczytać swój profil
   - Profile są synchronizowane z Google OAuth i nie mogą być edytowane przez API

2. **Groups:**
   - Użytkownik może odczytać tylko grupy, których jest członkiem
   - Użytkownik może tworzyć nowe grupy (staje się automatycznie twórcą)
   - Tylko twórca może aktualizować lub archiwizować grupę

3. **Group Members:**
   - Użytkownik może odczytać członków tylko swoich grup
   - Każdy członek grupy może zapraszać nowych użytkowników
   - Twórca grupy może usuwać członków
   - Każdy członek może sam siebie usunąć (opuścić grupę)

4. **Expenses:**
   - Użytkownik może odczytać wydatki tylko w swoich grupach
   - Każdy członek grupy może tworzyć wydatki
   - Tylko twórca wydatku może go edytować lub usunąć

5. **Settlements:**
   - Użytkownik może odczytać rozliczenia tylko w swoich grupach
   - Każdy członek grupy może tworzyć rozliczenia
   - Rozliczenia są niemutowalne (nie można edytować ani usuwać)

### 3.3. Implementacja w kodzie

- **Frontend:** SDK Supabase (`@supabase/supabase-js`) obsługuje automatyczne dołączanie tokenu do żądań
- **Backend:** Astro API Routes weryfikują token poprzez Supabase middleware
- **Edge Functions:** Wykorzystują `supabase.auth.getUser()` do weryfikacji tokenu
- **RLS:** Polityki bazodanowe używają funkcji `auth.uid()` do identyfikacji zalogowanego użytkownika
- **Funkcja pomocnicza:** `is_group_member(group_id, profile_id)` sprawdza członkostwo w grupie
- **Synchronizacja profili:** Przy każdym logowaniu przez Google OAuth, dane użytkownika (email, full_name, avatar_url) są automatycznie aktualizowane w tabeli `profiles` na podstawie danych z Google

---

## 4. Walidacja i logika biznesowa

### 4.1. Warunki walidacji dla poszczególnych zasobów

#### Profiles

- `email` - wymagane, prawidłowy format e-mail, unikalny (synchronizowane z Google)
- `full_name` - opcjonalne, max. 100 znaków (synchronizowane z Google)
- `avatar_url` - opcjonalne, prawidłowy URL (synchronizowane z Google)
- `updated_at` - automatycznie aktualizowane przy synchronizacji z Google

**Uwaga:** Profile nie mogą być edytowane przez API, tylko synchronizowane z Google OAuth

#### Groups

- `name` - wymagane, min. 1 znak, max. 100 znaków
- `base_currency_code` - wymagane, musi istnieć w tabeli `currencies`, 3 znaki
- `status` - domyślnie `active`, wartości: `active`, `archived`

#### Group Members

- `group_id` - wymagane, musi istnieć
- `profile_id` - wymagane, musi istnieć
- `role` - domyślnie `member`, wartości: `creator`, `member`
- `status` - domyślnie `active`, wartości: `active`, `inactive`

#### Group Currencies

- `currency_code` - wymagane, musi istnieć w tabeli `currencies`
- `exchange_rate` - wymagane, numeric(10, 4), musi być > 0
- nie można dodać waluty bazowej jako dodatkowej waluty
- nie można usunąć waluty, jeśli jest używana w istniejących wydatkach

#### Invitations

- `email` - wymagane, prawidłowy format e-mail
- `group_id` - wymagane, musi istnieć
- `status` - domyślnie `pending`, wartości: `pending`, `accepted`, `declined`

#### Expenses

- `description` - wymagane, min. 1 znak, max. 500 znaków
- `amount` - wymagane, numeric(10, 2), musi być > 0
- `currency_code` - wymagane, musi istnieć w walutach grupy
- `expense_date` - wymagane, format ISO 8601
- `payer_id` - wymagane, musi być członkiem grupy
- `splits` - wymagane, tablica, min. 1 element
  - `splits[].profile_id` - wymagane, musi być członkiem grupy
  - `splits[].amount` - wymagane, numeric(10, 2), musi być > 0
  - suma wszystkich `splits[].amount` musi być równa `amount` (tolerancja ±0.01)

#### Expense Splits

- `expense_id` - wymagane, musi istnieć
- `profile_id` - wymagane, musi być członkiem grupy
- `amount` - wymagane, numeric(10, 2), musi być > 0

#### Settlements

- `group_id` - wymagane, musi istnieć
- `payer_id` - wymagane, musi być członkiem grupy
- `payee_id` - wymagane, musi być członkiem grupy, nie może być taki sam jak `payer_id`
- `amount` - wymagane, numeric(10, 2), musi być > 0, zawsze w walucie bazowej grupy

### 4.2. Implementacja logiki biznesowej

#### 1. Tworzenie grupy (F-002, F-018)

**Endpoint:** `POST /api/groups`

**Logika:**

1. Walidacja danych wejściowych (nazwa, waluta bazowa, opcjonalnie invite_emails)
2. Utworzenie rekordu w tabeli `groups` (w transakcji)
3. Automatyczne dodanie użytkownika do `group_members` z rolą `creator` i statusem `active` (w transakcji)
4. Jeśli podano `invite_emails` (best-effort, poza transakcją główną):
   - Dla każdego e-maila: sprawdzenie czy użytkownik istnieje w `profiles`
   - Jeśli istnieje: dodanie do `group_members` z rolą `member` i statusem `active`
   - Jeśli nie istnieje: utworzenie zaproszenia w `invitations` ze statusem `pending`
5. Zwrócenie szczegółów utworzonej grupy wraz z wynikami zaproszeń

**Transakcja:** Tak dla tworzenia grupy + dodania twórcy. Zaproszenia przetwarzane osobno (best-effort).

---

#### 2. Zapraszanie do grupy (F-003, F-004, F-005)

**Endpoint:** `POST /api/groups/:groupId/members/invite`

**Logika:**

1. Walidacja: czy użytkownik jest członkiem grupy
2. Dla każdego adresu e-mail:
   - Sprawdzenie, czy użytkownik istnieje w systemie (tabela `profiles`)
   - **Jeśli istnieje:** dodanie bezpośrednio do `group_members` z rolą `member` i statusem `active`
   - **Jeśli nie istnieje:** utworzenie zaproszenia w tabeli `invitations` ze statusem `pending`
3. Zwrócenie listy dodanych członków i utworzonych zaproszeń

**Transakcja:** Tak (dla spójności danych)

---

#### 3. Opuszczanie grupy (F-006, F-007)

**Endpoint:** `POST /api/groups/:id/leave`

**Logika:**

1. Walidacja: czy użytkownik jest członkiem grupy
2. Sprawdzenie: czy użytkownik nie jest twórcą grupy (twórca musi najpierw zarchiwizować grupę)
3. Zmiana statusu w `group_members` z `active` na `inactive`
4. Dane finansowe (salda, wydatki, rozliczenia) pozostają nienaruszone
5. Użytkownik nie widzi już grupy na swojej liście (filtr `status = 'active'`)
6. Pozostali członkowie widzą użytkownika ze statusem "Nieaktywny"

**Transakcja:** Nie (pojedyncza operacja UPDATE)

---

#### 4. Dodawanie wydatku (F-008, F-011, F-012)

**Endpoint:** `POST /api/groups/:groupId/expenses`

**Logika:**

1. Walidacja wszystkich danych wejściowych
2. **Walidacja sumy:** suma wszystkich `splits[].amount` musi być równa `amount` (tolerancja ±0.01 na błędy zaokrągleń)
3. Sprawdzenie, czy wszyscy uczestnicy z `splits[]` są członkami grupy
4. Pobranie kursu wymiany dla waluty wydatku (z `group_currencies`)
5. Obliczenie kwoty w walucie bazowej: `amount * exchange_rate`
6. Utworzenie rekordu w `expenses`
7. Utworzenie rekordów w `expense_splits` zgodnie z przekazaną tablicą `splits[]`
8. Wysłanie notyfikacji przez Realtime Subscriptions

**Transakcja:** Tak (tworzenie wydatku + wszystkie splits)

**Podział kwoty:**

- Frontend jest odpowiedzialny za obliczenie podziału (równego lub niestandardowego)
- Użytkownik widzi dokładnie co zostanie zapisane przed submitem
- Backend tylko waliduje, czy suma się zgadza
- To daje użytkownikowi pełną kontrolę (np. decyzja kto dostaje "resztę")

**Przykład - podział równy:** Wydatek 100 PLN na 3 osoby (obliczony przez frontend):

```json
"splits": [
  { "profile_id": "uuid1", "amount": 33.33 },
  { "profile_id": "uuid2", "amount": 33.33 },
  { "profile_id": "uuid3", "amount": 33.34 }
]
```

**Przykład - podział niestandardowy:**

```json
"splits": [
  { "profile_id": "uuid1", "amount": 50.00 },
  { "profile_id": "uuid2", "amount": 30.00 },
  { "profile_id": "uuid3", "amount": 20.00 }
]
```

---

#### 5. Dodawanie wydatku głosem (F-009, F-010)

**Endpoint:** `POST /api/expenses/transcribe`

**Logika - asynchroniczna:**

1. **Request:** Upload pliku audio + group_id
2. **Odpowiedź:** task_id, status: "processing"
3. **Przetwarzanie w tle (Edge Function):**
   - Krok 1: Wysłanie audio do Openrouter.ai (model Whisper)
   - Otrzymanie transkrypcji tekstowej
   - Krok 2: Przygotowanie promptu dla LLM:

     ```
     Kontekst: Grupa "Wyjazd do Zakopanego"
     Członkowie: Jan Kowalski (ja), Anna Nowak, Piotr Wiśniewski
     Waluta bazowa: PLN
     Dostępne waluty: PLN, EUR (4.50), USD (4.10)

     Tekst: "Ja zapłaciłem 50 euro za lunch dla mnie i Ani"

     Wyodrębnij dane wydatku w formacie JSON. Podziel kwotę równo między uczestników.
     ```

   - Krok 3: Wysłanie promptu do Openrouter.ai (model Claude/GPT)
   - Otrzymanie strukturalnego JSON:
     ```json
     {
       "description": "lunch",
       "amount": 50.0,
       "currency_code": "EUR",
       "payer_id": "uuid_jana",
       "splits": [
         { "profile_id": "uuid_jana", "amount": 25.0 },
         { "profile_id": "uuid_ani", "amount": 25.0 }
       ]
     }
     ```
   - Krok 4: Zapis wyniku do pamięci podręcznej (Redis lub tabela pomocnicza)

4. **Odpytywanie:** `GET /api/expenses/transcribe/:taskId`
   - Zwraca status i wynik (jeśli gotowy)
5. **Frontend:** Wypełnia formularz danymi z `result.expense_data`
6. **Użytkownik:** Weryfikuje i ewentualnie edytuje podział (może zmienić kto dostaje resztę)
7. **Zatwierdzenie:** Standardowy `POST /api/groups/:groupId/expenses`

**Bezpieczeństwo:** Klucz API Openrouter.ai przechowywany tylko w Edge Function (środowisko serwerowe)

**Uwaga:** AI dzieli kwotę równo i oblicza splits[], użytkownik może to dostosować przed zapisem

---

#### 6. Edycja wydatku (F-013)

**Endpoint:** `PATCH /api/expenses/:id`

**Logika:**

1. Weryfikacja: czy użytkownik jest twórcą wydatku (`created_by = auth.uid()`)
2. Walidacja nowych danych (taka sama jak przy tworzeniu)
3. Usunięcie starych rekordów z `expense_splits`
4. Aktualizacja rekordu w `expenses`
5. Utworzenie nowych rekordów w `expense_splits`
6. Wysłanie notyfikacji przez Realtime Subscriptions

**Transakcja:** Tak (aktualizacja wydatku + usunięcie + utworzenie splits)

---

#### 7. Usuwanie wydatku (F-013)

**Endpoint:** `DELETE /api/expenses/:id`

**Logika:**

1. Weryfikacja: czy użytkownik jest twórcą wydatku
2. Usunięcie rekordów z `expense_splits` (CASCADE)
3. Usunięcie rekordu z `expenses`
4. Wysłanie notyfikacji przez Realtime Subscriptions

**Transakcja:** Tak (usunięcie expense + splits)

---

#### 8. Obliczanie sald (F-014, F-015, F-020)

**Endpoint:** `GET /api/groups/:groupId/balances`

**Logika - dynamiczne obliczanie:**

1. Pobranie wszystkich wydatków grupy z `expenses` i `expense_splits`
2. Pobranie wszystkich rozliczeń grupy z `settlements`
3. Przeliczenie wszystkich kwot na walutę bazową (z użyciem kursów z `group_currencies`)
4. **Dla każdego członka grupy:**
   ```
   saldo = suma_zapłaconych_wydatków - suma_udziałów_w_wydatkach + suma_otrzymanych_rozliczeń - suma_wysłanych_rozliczeń
   ```
5. **Przykład:**
   - Jan zapłacił: 300 PLN
   - Jan uczestniczył w wydatkach na: 150 PLN
   - Jan otrzymał rozliczenie: 0 PLN
   - Jan wysłał rozliczenie: 0 PLN
   - **Saldo Jana: 300 - 150 = +150 PLN** (Jan ma dostać 150 PLN)
6. Algorytm minimalizacji transakcji dla `suggested_settlements`
7. Zwrócenie pełnego podsumowania

**Cache:** Wyniki mogą być cache'owane na krótki czas (np. 30 sekund) dla wydajności

---

#### 9. Rejestrowanie rozliczenia (F-016, F-017)

**Endpoint:** `POST /api/groups/:groupId/settlements`

**Logika:**

1. Walidacja: czy payer i payee są członkami grupy
2. Walidacja: czy payer ≠ payee
3. Walidacja: kwota > 0, w walucie bazowej grupy
4. Utworzenie rekordu w `settlements`
5. Rozliczenie jest niemutowalne (brak UPDATE/DELETE)
6. Wysłanie notyfikacji przez Realtime Subscriptions

**Transakcja:** Nie (pojedyncza operacja INSERT)

---

#### 10. Zarządzanie walutami w grupie (F-018, F-019, F-020)

**Endpoint:** `POST /api/groups/:groupId/currencies`, `PATCH`, `DELETE`

**Logika:**

- **Dodawanie:**
  1. Walidacja: czy waluta istnieje w `currencies`
  2. Walidacja: czy waluta nie jest walutą bazową
  3. Walidacja: czy waluta nie jest już dodana
  4. Utworzenie rekordu w `group_currencies`
- **Aktualizacja:**
  1. Walidacja: czy waluta istnieje w grupie
  2. Walidacja: czy nie jest walutą bazową
  3. Aktualizacja `exchange_rate`
- **Usuwanie:**
  1. Walidacja: czy waluta nie jest używana w istniejących wydatkach
  2. Usunięcie rekordu z `group_currencies`

**Transakcja:** Nie (pojedyncze operacje)

---

### 4.3. Bezpieczeństwo i wydajność

#### Bezpieczeństwo

1. **Row-Level Security (RLS):** Wszystkie tabele mają włączone RLS z precyzyjnymi politykami
2. **JWT Tokens:** Krótki czas życia (1h), automatyczne odnawianie
3. **Walidacja po stronie serwera:** Wszystkie dane wejściowe walidowane przed zapisem
4. **Ochrona przed SQL Injection:** Parametryzowane zapytania (Supabase SDK)
5. **CORS:** Konfiguracja tylko dla zaufanych domen
6. **Rate Limiting:** Ograniczenie liczby żądań na użytkownika (np. 100/min)
7. **Klucze API:** Openrouter.ai klucz tylko w Edge Functions (server-side)

#### Wydajność

1. **Indeksy bazodanowe:** Wszystkie klucze obce + często używane kolumny
2. **Paginacja:** Wszystkie endpointy listowe (limit/offset)
3. **Realtime Subscriptions:** Aktualizacje push zamiast pollingu
4. **Cache dla sald:** Krótkoterminowy cache (30s) dla obliczeń sald
5. **Optymalizacja zapytań:** Używanie JOINów zamiast N+1 queries
6. **CDN dla statycznych zasobów:** Astro + hosting z CDN

---

## 5. Dodatkowe uwagi

### 5.1. Kody błędów

Aplikacja używa standardowych kodów HTTP oraz dodatkowych kodów błędów w body:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Suma podziałów nie równa się kwocie wydatku",
    "details": {
      "expected": 250.0,
      "actual": 240.0
    }
  }
}
```

**Kody własne:**

- `VALIDATION_ERROR` - Błąd walidacji danych
- `UNAUTHORIZED` - Brak lub nieprawidłowy token
- `FORBIDDEN` - Brak uprawnień do zasobu
- `NOT_FOUND` - Zasób nie istnieje
- `CONFLICT` - Konflikt z istniejącym zasobem
- `SPLITS_SUM_MISMATCH` - Suma splits ≠ kwota wydatku
- `NOT_GROUP_MEMBER` - Użytkownik nie jest członkiem grupy
- `NOT_EXPENSE_CREATOR` - Użytkownik nie jest twórcą wydatku
- `TRANSCRIPTION_FAILED` - Błąd przetwarzania audio
- `CURRENCY_IN_USE` - Waluta jest używana w wydatkach

### 5.2. Versioning

API nie wymaga wersjonowania w MVP (brak `/v1/` w ścieżkach). W przyszłości można dodać wersjonowanie przez:

- Ścieżkę URL: `/api/v2/...`
- Nagłówek: `Accept: application/vnd.billzilla.v2+json`

### 5.3. Dokumentacja API

Dla developerów zewnętrznych (w przyszłości):

- OpenAPI 3.0 specification (Swagger)
- Interaktywna dokumentacja (Swagger UI)
- Przykłady requestów w różnych językach

### 5.4. Monitoring i logi

- Logowanie wszystkich żądań API (timestamp, user_id, endpoint, status, czas wykonania)
