# Szablony e-maili - System zaproszeń

## Data: 2025-11-06
## Status: Zaimplementowane ✅

## 1. Rodzaje e-maili

### 1.1 Zaproszenie dla istniejącego użytkownika (existing-user-invitation)

**Kontekst:** Użytkownik już ma konto w Billzilla, ale nie należy do grupy

**Cel:** Poinformować o zaproszeniu i umożliwić akceptację/odrzucenie

#### Temat:
```
Zaproszenie do grupy "{group_name}" w Billzilla
```

#### Treść HTML:
```html
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zaproszenie do grupy</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 5px; }
        .button.secondary { background-color: #6c757d; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Zaproszenie do grupy</h1>
            <p>Cześć <strong>{user_name}</strong>!</p>
        </div>

        <p><strong>{inviter_name}</strong> zaprosił(a) Cię do grupy <strong>"{group_name}"</strong> w Billzilla.</p>

        <p>W tej grupie możecie wspólnie śledzić wydatki i rozliczenia. Dołącz, aby zobaczyć szczegóły i wziąć udział w rozliczeniach.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{accept_url}" class="button">✅ Akceptuj zaproszenie</a>
            <a href="{decline_url}" class="button secondary">❌ Odrzuć</a>
        </div>

        <p><strong>Co się stanie po akceptacji?</strong></p>
        <ul>
            <li>Zostaniesz członkiem grupy "{group_name}"</li>
            <li>Będziesz mógł/mogła dodawać wydatki i uczestniczyć w rozliczeniach</li>
            <li>Zobaczysz historię dotychczasowych wydatków w grupie</li>
        </ul>

        <p>Jeśli nie chcesz dołączyć do tej grupy, możesz po prostu zignorować tę wiadomość lub kliknąć przycisk "Odrzuć".</p>

        <div class="footer">
            <p>Ten e-mail został wysłany, ponieważ ktoś zaprosił Cię do grupy w Billzilla.</p>
            <p>Jeśli nie chcesz otrzymywać takich powiadomień, możesz zmienić ustawienia w swoim profilu.</p>
            <p>© 2025 Billzilla. Wszystkie prawa zastrzeżone.</p>
        </div>
    </div>
</body>
</html>
```

#### Treść tekstowa (fallback):
```
Zaproszenie do grupy "{group_name}" w Billzilla

Cześć {user_name}!

{inviter_name} zaprosił(a) Cię do grupy "{group_name}" w Billzilla.

W tej grupie możecie wspólnie śledzić wydatki i rozliczenia. Dołącz, aby zobaczyć szczegóły i wziąć udział w rozliczeniach.

Akceptuj zaproszenie: {accept_url}
Odrzuć zaproszenie: {decline_url}

Co się stanie po akceptacji?
- Zostaniesz członkiem grupy "{group_name}"
- Będziesz mógł/mogła dodawać wydatki i uczestniczyć w rozliczeniach
- Zobaczysz historię dotychczasowych wydatków w grupie

Jeśli nie chcesz dołączyć do tej grupy, możesz po prostu zignorować tę wiadomość.

---
Ten e-mail został wysłany, ponieważ ktoś zaprosił Cię do grupy w Billzilla.
Jeśli nie chcesz otrzymywać takich powiadomień, możesz zmienić ustawienia w swoim profilu.
© 2025 Billzilla. Wszystkie prawa zastrzeżone.
```

---

### 1.2 Zaproszenie dla nowego użytkownika (new-user-invitation)

**Kontekst:** Adres e-mail nie istnieje w systemie Billzilla

**Cel:** Zachęcić do rejestracji i dołączenia do grupy

#### Temat:
```
Zaproszenie do grupy "{group_name}" - dołącz do Billzilla!
```

#### Treść HTML:
```html
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zaproszenie do Billzilla</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .button { display: inline-block; padding: 15px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 5px; font-weight: bold; }
        .feature { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Zaproszenie do Billzilla</h1>
            <p>Zostałeś zaproszony do grupy rozliczeniowej!</p>
        </div>

        <p><strong>{inviter_name}</strong> zaprosił(a) Cię do grupy <strong>"{group_name}"</strong> w aplikacji Billzilla.</p>

        <p>Billzilla to nowoczesne rozwiązanie do wspólnego zarządzania finansami. Razem z przyjaciółmi, rodziną lub współpracownikami możecie łatwo:</p>

        <div class="feature">
            <h3>✨ Co oferuje Billzilla?</h3>
            <ul>
                <li><strong>Śledzenie wydatków:</strong> Zapisujcie wspólne koszty jednym kliknięciem</li>
                <li><strong>Głosowe dodawanie:</strong> Mów "Ja zapłaciłem 50 zł za obiad" - system zrozumie!</li>
                <li><strong>Automatyczne rozliczenia:</strong> Zobacz kto komu jest winien pieniądze</li>
                <li><strong>Wiele walut:</strong> Obsługa PLN, EUR, USD i innych</li>
                <li><strong>Historia transakcji:</strong> Pełne archiwum wszystkich rozliczeń</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{signup_url}?invitation={invitation_token}" class="button">🚀 Dołącz do grupy</a>
        </div>

        <p><strong>Jak dołączyć?</strong></p>
        <ol>
            <li>Kliknij przycisk "Dołącz do grupy" powyżej</li>
            <li>Zarejestruj się za pomocą e-maila lub konta Google</li>
            <li>Automatycznie dołączysz do grupy "{group_name}"</li>
            <li>Zacznij korzystać ze wspólnych rozliczeń!</li>
        </ol>

        <p>Rejestracja jest bezpłatna i zajmuje tylko chwilę. Dołącz do {inviter_name} i innych członków grupy już dziś!</p>

        <div class="footer">
            <p>Ten e-mail został wysłany na adres {email}, ponieważ ktoś zaprosił Cię do grupy w Billzilla.</p>
            <p>Jeśli nie chcesz dołączyć, możesz zignorować tę wiadomość.</p>
            <p>© 2025 Billzilla. Wszystkie prawa zastrzeżone.</p>
        </div>
    </div>
</body>
</html>
```

#### Treść tekstowa (fallback):
```
Zaproszenie do grupy "{group_name}" - dołącz do Billzilla!

{inviter_name} zaprosił(a) Cię do grupy "{group_name}" w aplikacji Billzilla.

Billzilla to nowoczesne rozwiązanie do wspólnego zarządzania finansami. Razem możecie łatwo:
- Śledzić wspólne wydatki
- Dodawać koszty głosowo ("Ja zapłaciłem 50 zł za obiad")
- Automatycznie obliczać rozliczenia
- Obsługiwać różne waluty
- Przechowywać historię transakcji

Jak dołączyć?
1. Kliknij link: {signup_url}?invitation={invitation_token}
2. Zarejestruj się za pomocą e-maila lub konta Google
3. Automatycznie dołączysz do grupy "{group_name}"
4. Zacznij korzystać ze wspólnych rozliczeń!

Rejestracja jest bezpłatna i zajmuje tylko chwilę. Dołącz już dziś!

---
Ten e-mail został wysłany na adres {email}, ponieważ ktoś zaprosił Cię do grupy w Billzilla.
Jeśli nie chcesz dołączyć, możesz zignorować tę wiadomość.
© 2025 Billzilla. Wszystkie prawa zastrzeżone.
```

---

## 2. Zmienne w szablonach

### Wspólne zmienne:
- `{inviter_name}` - Imię/nazwa osoby zapraszającej
- `{group_name}` - Nazwa grupy
- `{email}` - Adres e-mail odbiorcy

### Dla istniejących użytkowników:
- `{user_name}` - Imię zalogowanego użytkownika
- `{accept_url}` - Link do akceptacji zaproszenia (format: `/invitations/{id}/accept`)
- `{decline_url}` - Link do odrzucenia zaproszenia (format: `/invitations/{id}/decline`)

### Dla nowych użytkowników:
- `{signup_url}` - Link do rejestracji (format: `/signup?invitation={token}`)
- `{invitation_token}` - Token zaproszenia do automatycznego dołączenia

---

## 3. Techniczne wymagania

### 3.1 Generowanie linków
- **Accept URL:** `/invitations/{invitation_id}/accept` - wymaga autoryzacji
- **Decline URL:** `/invitations/{invitation_id}/decline` - wymaga autoryzacji
- **Signup URL:** `/signup?invitation={secure_token}` - nie wymaga autoryzacji

### 3.2 Token bezpieczeństwa
- Invitation token powinien być bezpiecznym, jednorazowym tokenem
- Ważność: 30 dni od wysłania
- Zawartość: `invitation_id + timestamp + hash`

### 3.3 Personalizacja
- Używaj imienia użytkownika jeśli jest dostępne (`full_name` z profilu)
- Jeśli imię nie jest dostępne, używaj "Cześć!" zamiast "Cześć {user_name}!"

### 3.4 Responsywność
- Wszystkie szablony powinny być responsywne (mobile-friendly)
- Testować wyświetlanie na różnych klientach e-mail (Gmail, Outlook, Apple Mail)

---

## 4. Testy e-maili

### Scenariusze testowe:
1. ✅ Wysyłanie do Gmail (desktop + mobile)
2. ✅ Wysyłanie do Outlook (desktop + mobile)
3. ✅ Wysyłanie do Apple Mail
4. ✅ Kliknięcie w przyciski akceptacji/odrzucenia
5. ✅ Link rejestracji dla nowych użytkowników
6. ✅ Wyświetlanie bez obrazów (plain text fallback)
7. ✅ Dostępność (screen readers)
