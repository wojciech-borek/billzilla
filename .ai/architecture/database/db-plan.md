# Plan Bazy Danych - Billzilla

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### Typy niestandardowe (ENUMs)

```sql
CREATE TYPE group_role AS ENUM ('creator', 'member');
CREATE TYPE group_member_status AS ENUM ('active', 'inactive');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE group_status AS ENUM ('active', 'archived');
```

---

### Tabela: `profiles`

Przechowuje publiczne dane użytkowników, rozszerzając tabelę `auth.users` od Supabase.

| Nazwa kolumny | Typ danych    | Ograniczenia                                                 | Opis                                          |
| ------------- | ------------- | ------------------------------------------------------------ | --------------------------------------------- |
| `id`          | `uuid`        | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Klucz podstawowy, referencja do `auth.users`. |
| `updated_at`  | `timestamptz` | `NULL`                                                       | Data ostatniej aktualizacji profilu.          |
| `full_name`   | `text`        | `NULL`                                                       | Pełna nazwa użytkownika.                      |
| `avatar_url`  | `text`        | `NULL`                                                       | URL do awatara użytkownika.                   |
| `email`       | `text`        | `NOT NULL`, `UNIQUE`                                         | Adres e-mail użytkownika.                     |

---

### Tabela: `groups`

Przechowuje informacje o grupach rozliczeniowych.

| Nazwa kolumny        | Typ danych     | Ograniczenia                                | Opis                                      |
| -------------------- | -------------- | ------------------------------------------- | ----------------------------------------- |
| `id`                 | `uuid`         | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unikalny identyfikator grupy.             |
| `created_at`         | `timestamptz`  | `NOT NULL`, `DEFAULT now()`                 | Data utworzenia grupy.                    |
| `name`               | `text`         | `NOT NULL`                                  | Nazwa grupy.                              |
| `base_currency_code` | `varchar(3)`   | `NOT NULL`, `REFERENCES currencies(code)`   | Kod waluty bazowej dla grupy (np. 'PLN'). |
| `status`             | `group_status` | `NOT NULL`, `DEFAULT 'active'`              | Status grupy (np. 'active', 'archived').  |

---

### Tabela: `group_members`

Tabela łącząca użytkowników (`profiles`) z grupami (`groups`).

| Nazwa kolumny | Typ danych            | Ograniczenia                             | Opis                                                   |
| ------------- | --------------------- | ---------------------------------------- | ------------------------------------------------------ |
| `group_id`    | `uuid`                | `PRIMARY KEY`, `REFERENCES groups(id)`   | Identyfikator grupy.                                   |
| `profile_id`  | `uuid`                | `PRIMARY KEY`, `REFERENCES profiles(id)` | Identyfikator profilu użytkownika.                     |
| `role`        | `group_role`          | `NOT NULL`, `DEFAULT 'member'`           | Rola użytkownika w grupie ('creator' lub 'member').    |
| `status`      | `group_member_status` | `NOT NULL`, `DEFAULT 'active'`           | Status użytkownika w grupie ('active' lub 'inactive'). |
| `joined_at`   | `timestamptz`         | `NOT NULL`, `DEFAULT now()`              | Data dołączenia użytkownika do grupy.                  |

---

### Tabela: `currencies`

Globalna, statyczna tabela przechowująca listę dostępnych walut (ISO 4217).

| Nazwa kolumny | Typ danych   | Ograniczenia  | Opis                             |
| ------------- | ------------ | ------------- | -------------------------------- |
| `code`        | `varchar(3)` | `PRIMARY KEY` | Kod waluty ISO 4217 (np. 'PLN'). |
| `name`        | `text`       | `NOT NULL`    | Pełna nazwa waluty.              |

---

### Tabela: `group_currencies`

Przechowuje zdefiniowane przez użytkownika kursy wymiany dla walut w danej grupie.

| Nazwa kolumny   | Typ danych       | Ograniczenia                                 | Opis                                                                                   |
| --------------- | ---------------- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `group_id`      | `uuid`           | `PRIMARY KEY`, `REFERENCES groups(id)`       | Identyfikator grupy.                                                                   |
| `currency_code` | `varchar(3)`     | `PRIMARY KEY`, `REFERENCES currencies(code)` | Kod waluty.                                                                            |
| `exchange_rate` | `numeric(10, 4)` | `NOT NULL`, `CHECK (exchange_rate > 0)`      | Kurs wymiany w stosunku do waluty bazowej grupy (np. 4.50 dla EUR, gdy bazą jest PLN). |

---

### Tabela: `invitations`

Przechowuje zaproszenia do grup dla osób, które nie mają jeszcze konta.

| Nazwa kolumny | Typ danych          | Ograniczenia                                | Opis                                                |
| ------------- | ------------------- | ------------------------------------------- | --------------------------------------------------- |
| `id`          | `uuid`              | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unikalny identyfikator zaproszenia.                 |
| `group_id`    | `uuid`              | `NOT NULL`, `REFERENCES groups(id)`         | Identyfikator grupy, do której wysłano zaproszenie. |
| `email`       | `text`              | `NOT NULL`                                  | Adres e-mail zaproszonej osoby.                     |
| `status`      | `invitation_status` | `NOT NULL`, `DEFAULT 'pending'`             | Status zaproszenia.                                 |
| `created_at`  | `timestamptz`       | `NOT NULL`, `DEFAULT now()`                 | Data wysłania zaproszenia.                          |

---

### Tabela: `expenses`

Główna tabela przechowująca informacje o wydatkach.

| Nazwa kolumny   | Typ danych       | Ograniczenia                                | Opis                               |
| --------------- | ---------------- | ------------------------------------------- | ---------------------------------- |
| `id`            | `uuid`           | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unikalny identyfikator wydatku.    |
| `group_id`      | `uuid`           | `NOT NULL`, `REFERENCES groups(id)`         | Grupa, do której należy wydatek.   |
| `created_by`    | `uuid`           | `NOT NULL`, `REFERENCES profiles(id)`       | Użytkownik, który dodał wydatek.   |
| `description`   | `text`           | `NOT NULL`                                  | Opis wydatku.                      |
| `amount`        | `numeric(10, 2)` | `NOT NULL`, `CHECK (amount > 0)`            | Całkowita kwota wydatku.           |
| `currency_code` | `varchar(3)`     | `NOT NULL`, `REFERENCES currencies(code)`   | Waluta, w której dokonano wydatku. |
| `expense_date`  | `timestamptz`    | `NOT NULL`, `DEFAULT now()`                 | Data poniesienia wydatku.          |
| `created_at`    | `timestamptz`    | `NOT NULL`, `DEFAULT now()`                 | Data dodania wpisu do systemu.     |

---

### Tabela: `expense_splits`

Przechowuje szczegóły podziału wydatku na poszczególnych uczestników.

| Nazwa kolumny | Typ danych       | Ograniczenia                             | Opis                                                     |
| ------------- | ---------------- | ---------------------------------------- | -------------------------------------------------------- |
| `expense_id`  | `uuid`           | `PRIMARY KEY`, `REFERENCES expenses(id)` | Identyfikator wydatku.                                   |
| `profile_id`  | `uuid`           | `PRIMARY KEY`, `REFERENCES profiles(id)` | Użytkownik (uczestnik), na którego przypada część kwoty. |
| `amount`      | `numeric(10, 2)` | `NOT NULL`, `CHECK (amount > 0)`         | Kwota przypadająca na danego uczestnika.                 |

---

### Tabela: `settlements`

Rejestruje transakcje rozliczeniowe (spłaty długów) między użytkownikami.

| Nazwa kolumny | Typ danych       | Ograniczenia                                | Opis                                                |
| ------------- | ---------------- | ------------------------------------------- | --------------------------------------------------- |
| `id`          | `uuid`           | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unikalny identyfikator rozliczenia.                 |
| `group_id`    | `uuid`           | `NOT NULL`, `REFERENCES groups(id)`         | Grupa, w ramach której dokonano rozliczenia.        |
| `payer_id`    | `uuid`           | `NOT NULL`, `REFERENCES profiles(id)`       | Użytkownik, który spłaca dług.                      |
| `payee_id`    | `uuid`           | `NOT NULL`, `REFERENCES profiles(id)`       | Użytkownik, który otrzymuje spłatę.                 |
| `amount`      | `numeric(10, 2)` | `NOT NULL`, `CHECK (amount > 0)`            | Kwota rozliczenia (zawsze w walucie bazowej grupy). |
| `settled_at`  | `timestamptz`    | `NOT NULL`, `DEFAULT now()`                 | Data dokonania rozliczenia.                         |

## 2. Relacje między tabelami

- **`auth.users` <-> `profiles` (1:1):** Każdy użytkownik Supabase Auth ma dokładnie jeden profil w aplikacji.
- **`profiles` <-> `group_members` <-> `groups` (M:M):** Użytkownicy i grupy są połączeni przez tabelę `group_members`. Użytkownik może należeć do wielu grup, a grupa może mieć wielu członków.
- **`groups` -> `expenses` (1:M):** Każdy wydatek należy do jednej grupy.
- **`profiles` -> `expenses` (1:M):** Każdy wydatek jest tworzony przez jednego użytkownika.
- **`expenses` -> `expense_splits` (1:M):** Każdy wydatek jest podzielony na co najmniej jedną część w `expense_splits`.
- **`profiles` <-> `expense_splits` <-> `expenses` (M:M):** Użytkownicy i wydatki są powiązani przez tabelę `expense_splits`, która określa udział każdego użytkownika w danym wydatku.
- **`groups` -> `settlements` (1:M):** Każde rozliczenie należy do jednej grupy.
- **`profiles` -> `settlements` (1:M, dwie relacje):** Każde rozliczenie ma jednego płacącego (`payer_id`) i jednego odbiorcę (`payee_id`).
- **`currencies` -> `group_currencies` (1:M):** Każda waluta może być używana w wielu grupach z różnymi kursami.
- **`groups` -> `group_currencies` (1:M):** Każda grupa może mieć zdefiniowane wiele walut z kursami wymiany.
- **`groups` -> `invitations` (1:M):** Każde zaproszenie jest powiązane z jedną grupą.

## 3. Indeksy

Wszystkie klucze obce powinny być automatycznie indeksowane przez PostgreSQL przy ich tworzeniu. Dla pewności i optymalizacji wydajności, należy utworzyć indeksy na następujących kolumnach:

```sql
-- Indeksy dla tabeli profiles
CREATE INDEX ON profiles (email);

-- Indeksy dla tabeli group_members
CREATE INDEX ON group_members (profile_id);

-- Indeksy dla tabeli group_currencies
CREATE INDEX ON group_currencies (currency_code);

-- Indeksy dla tabeli invitations
CREATE INDEX ON invitations (group_id);
CREATE INDEX ON invitations (email);

-- Indeksy dla tabeli expenses
CREATE INDEX ON expenses (group_id);
CREATE INDEX ON expenses (created_by);
CREATE INDEX ON expenses (currency_code);

-- Indeksy dla tabeli expense_splits
CREATE INDEX ON expense_splits (profile_id);

-- Indeksy dla tabeli settlements
CREATE INDEX ON settlements (group_id);
CREATE INDEX ON settlements (payer_id);
CREATE INDEX ON settlements (payee_id);
```

## 4. Zasady PostgreSQL (Row-Level Security)

Poniższe zasady RLS zapewniają, że użytkownicy mają dostęp wyłącznie do danych w grupach, do których należą.

```sql
-- Funkcja pomocnicza sprawdzająca członkostwo w grupie
CREATE OR REPLACE FUNCTION is_group_member(p_group_id uuid, p_profile_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM group_members gm
    WHERE gm.group_id = p_group_id AND gm.profile_id = p_profile_id AND gm.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Zasady dla tabeli 'profiles'
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile and profiles of fellow group members"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.profile_id = auth.uid() AND gm2.profile_id = profiles.id
    )
  );
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Zasady dla tabeli 'groups'
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view groups they are members of"
  ON groups FOR SELECT
  USING (is_group_member(id, auth.uid()));
-- Inne operacje (INSERT, UPDATE, DELETE) będą zarządzane przez logikę backendową (np. Edge Functions).

-- Zasady dla tabeli 'group_members'
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view membership of groups they belong to"
  ON group_members FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- Zasady dla tabeli 'expenses'
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view expenses in their groups"
  ON expenses FOR SELECT
  USING (is_group_member(group_id, auth.uid()));
CREATE POLICY "Users can create expenses in their groups"
  ON expenses FOR INSERT
  WITH CHECK (is_group_member(group_id, auth.uid()));
CREATE POLICY "Users can update expenses they created or paid for"
  ON expenses FOR UPDATE
  USING (created_by = auth.uid() OR payer_id = auth.uid());

CREATE POLICY "Users can delete expenses they created or paid for"
  ON expenses FOR DELETE
  USING (created_by = auth.uid() OR payer_id = auth.uid());

-- Pozostałe tabele (expense_splits, settlements, etc.)
-- Analogiczne zasady powinny być zastosowane do pozostałych tabel, ograniczając dostęp do danych w ramach grup użytkownika.
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access splits for expenses in their groups"
  ON expense_splits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id AND is_group_member(expenses.group_id, auth.uid())
    )
  );

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access settlements in their groups"
  ON settlements FOR ALL
  USING (is_group_member(group_id, auth.uid()));
```

## 5. Wszelkie dodatkowe uwagi lub wyjaśnienia dotyczące decyzji projektowych

1.  **Typ danych `NUMERIC`:** Wybrano typ `NUMERIC(10, 2)` (oraz `NUMERIC(10, 4)` dla kursów) do przechowywania wartości pieniężnych, aby uniknąć problemów z precyzją i zaokrągleniami, które występują przy typach `float` lub `double`.
2.  **Dynamiczne obliczanie sald:** Zgodnie z decyzją projektową, salda użytkowników nie są przechowywane w osobnej tabeli. Będą one dynamicznie obliczane po stronie backendu na podstawie sumy wydatków (`expenses`, `expense_splits`) i rozliczeń (`settlements`). To upraszcza logikę, eliminuje ryzyko niespójności danych i jest wystarczające dla MVP.
3.  **Brak fizycznego usuwania grup:** Tabela `groups` zawiera kolumnę `status` (np. 'active', 'archived'), co realizuje mechanizm "soft delete" i pozwala zachować integralność historii finansowej.
4.  **Walidacja w backendzie:** Złożona walidacja, np. sprawdzanie, czy suma `expense_splits` równa się kwocie `expenses`, będzie realizowana w logice backendowej (np. w Astro API Route lub Supabase Edge Function) w ramach transakcji bazodanowej, a nie za pomocą triggerów w bazie danych.
5.  **Role i uprawnienia:** Prosty system ról (`creator`, `member`) w `group_members` pozwala na rozróżnienie uprawnień. Dalsze, bardziej szczegółowe uprawnienia (np. edycja wydatku tylko przez jego autora) są implementowane za pomocą polityk RLS.
6.  **Uwierzytelnianie:** Schemat zakłada integrację z Supabase Auth. Klucz obcy w tabeli `profiles` wskazuje bezpośrednio na `auth.users`, a wbudowana w Supabase funkcja `auth.uid()` jest używana w politykach RLS do identyfikacji zalogowanego użytkownika.
