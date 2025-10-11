# Dokument wymagań produktu (PRD) - Billzilla

## 1. Przegląd produktu

Billzilla to aplikacja webowa, działająca w oparciu o zasady Responsive Web Design (RWD), zaprojektowana w celu uproszczenia zarządzania wspólnymi wydatkami w grupach, takich jak przyjaciele, współlokatorzy czy rodziny. Aplikacja umożliwia użytkownikom łatwe śledzenie, podział i rozliczanie kosztów. Kluczową funkcją wyróżniającą jest możliwość dodawania wydatków za pomocą poleceń głosowych, które inteligentnie przetwarzają mowę na ustrukturyzowane dane i wypełniają formularz, wymagając jedynie akceptacji użytkownika. Uwierzytelnianie odbywa się wyłącznie za pomocą konta Google, co zapewnia szybkie i bezpieczne wdrożenie.

## 2. Problem użytkownika

Zarządzanie wspólnymi finansami w nieformalnych grupach jest często kłopotliwe i podatne na błędy. Uczestnicy wyjazdów, współlokatorzy czy znajomi regularnie napotykają na problemy takie jak:
- Trudność w manualnym śledzeniu, "kto, za co i ile zapłacił".
- Skomplikowane i czasochłonne obliczanie, "kto komu jest winien pieniądze", zwłaszcza przy nierównych podziałach.
- Ryzyko pomyłek i zapominania o drobnych wydatkach, co prowadzi do nieporozumień.
- Brak jednego, centralnego miejsca do zarządzania rozliczeniami, co zmusza do korzystania z arkuszy kalkulacyjnych, notatek czy komunikatorów.
- Kłopotliwe dodawanie wydatków "w biegu", np. podczas robienia zakupów czy płacenia rachunku w restauracji.

Billzilla adresuje te problemy, oferując proste, zautomatyzowane i scentralizowane rozwiązanie do zarządzania grupowymi finansami.

## 3. Wymagania funkcjonalne

### 3.1. Zarządzanie użytkownikami i grupami
- F-001: Użytkownicy mogą rejestrować się i logować do aplikacji wyłącznie za pomocą swojego konta Google.
- F-002: Użytkownicy mogą tworzyć nowe grupy i nadawać im nazwy.
- F-003: Użytkownicy mogą zapraszać inne osoby do grup poprzez podanie ich adresu e-mail.
- F-004: Jeśli zaproszona osoba posiada już konto w Billzilla, jest automatycznie dodawana do grupy.
- F-005: Jeśli zaproszona osoba nie posiada konta, w systemie tworzony jest dla niej profil "oczekujący".
- F-006: Użytkownik może opuścić grupę w dowolnym momencie.
- F-007: Po opuszczeniu grupy, użytkownik otrzymuje w niej status "Nieaktywny", a jego dane finansowe i salda pozostają w historii grupy w celu umożliwienia końcowych rozliczeń.

### 3.2. Zarządzanie wydatkami
- F-008: Użytkownicy mogą dodawać wydatki za pomocą formularza manualnego, podając opis, kwotę, datę, walutę oraz określając, kto zapłacił i kto uczestniczył w wydatku.
- F-009: Użytkownicy mogą dodawać wydatki za pomocą interfejsu głosowego. Nagranie jest przetwarzane asynchronicznie, a dane wypełniają automatycznie formularz wydatku. System potrafi rozpoznać walutę z polecenia, a w przypadku jej braku, używa waluty bazowej grupy.
- F-010: Każdy wydatek dodany za pomocą głosu musi zostać zweryfikowany i zatwierdzony przez użytkownika przed zapisaniem. Użytkownik ma możliwość edycji pól wypełnionych przez AI.
- F-011: Aplikacja obsługuje dwa sposoby podziału wydatku: "po równo" oraz "każdy ma swoją kwotę".
- F-012: System zapewnia, że suma podziałów wydatku zawsze odpowiada jego całkowitej kwocie. Walidacja odbywa się w czasie rzeczywistym w formularzu, uniemożliwiając zapis, gdy sumy się nie zgadzają.
- F-013: Tylko twórca wydatku ma uprawnienia do jego edycji lub usunięcia.

### 3.3. System sald i rozliczeń
- F-014: Aplikacja automatycznie oblicza i aktualizuje salda wewnątrz każdej grupy po każdej operacji (dodanie wydatku, rozliczenie). Wszystkie wydatki w walutach obcych są przeliczane na walutę bazową grupy według zdefiniowanego w niej kursu.
- F-015: Interfejs użytkownika w czytelny sposób prezentuje podsumowanie, kto komu jest winien pieniądze w ramach grupy, zawsze w walucie bazowej grupy.
- F-016: Funkcja "Rozlicz się" ("Settle up") pozwala użytkownikom rejestrować spłaty długów w walucie bazowej grupy.
- F-017: Rozliczenie może dotyczyć pełnej lub częściowej kwoty długu i jest zapisywane jako oddzielna, niezmienna transakcja w historii grupy.

### 3.4. Zarządzanie walutami w grupie
- F-018: Użytkownik tworzący grupę definiuje dla niej jedną walutę bazową (np. PLN).
- F-019: W ustawieniach grupy można dodawać kolejne waluty (np. EUR, USD) i definiować dla nich stały, ręcznie wprowadzany przelicznik na walutę bazową (np. 1 EUR = 4,50 PLN).
- F-020: Wszystkie salda i podsumowania w grupie są zawsze prezentowane w walucie bazowej.

## 4. Granice produktu

Następujące funkcje i cechy są świadomie wyłączone z zakresu wersji MVP (Minimum Viable Product), aby zapewnić szybkie wdrożenie i skupić się na kluczowej wartości produktu:
- Brak uwierzytelniania za pomocą e-maila i hasła.
- Ograniczona obsługa wielu walut: Aplikacja pozwala na ręczne zdefiniowanie stałych kursów wymiany w ramach grupy. Brak automatycznego pobierania kursów z zewnętrznych serwisów (np. NBP, EBC). Wszystkie salda prowadzone są w jednej, bazowej walucie grupy.
- Brak skomplikowanych ról i uprawnień w grupach (poza zasadą, że tylko autor może edytować/usuwać swój wydatek).
- Brak powiadomień push o nowych wydatkach czy zmianach salda.
- Brak funkcji eksportu danych.
- Brak możliwości dodawania zdjęć/paragonów do wydatków.
- Zaproszenia do grup dla istniejących użytkowników nie wymagają akceptacji.

## 5. Historyjki użytkowników

### Zarządzanie kontem i uwierzytelnianie
- ID: US-001
- Tytuł: Rejestracja i logowanie przez Google
- Opis: Jako nowy użytkownik, chcę móc zarejestrować się i zalogować do aplikacji za pomocą mojego konta Google, aby proces ten był szybki i bezpieczny.
- Kryteria akceptacji:
  - Na ekranie logowania widoczny jest przycisk "Zaloguj się z Google".
  - Po kliknięciu przycisku, użytkownik jest przekierowywany do standardowego okna uwierzytelniania Google.
  - Po pomyślnym uwierzytelnieniu, użytkownik jest zalogowany w aplikacji i tworzone jest dla niego konto (jeśli nie istniało).
  - W przypadku nieudanego uwierzytelnienia, użytkownik widzi stosowny komunikat błędu.

### Zarządzanie grupami
- ID: US-002
- Tytuł: Tworzenie nowej grupy
- Opis: Jako użytkownik, chcę móc stworzyć nową grupę i zaprosić do niej znajomych, abyśmy mogli wspólnie śledzić wydatki.
- Kryteria akceptacji:
  - Użytkownik może zainicjować proces tworzenia nowej grupy.
  - Użytkownik musi podać nazwę dla nowej grupy.
  - Po utworzeniu, użytkownik automatycznie staje się członkiem tej grupy.
  - Użytkownik jest przekierowywany do widoku nowo utworzonej grupy.

- ID: US-003
- Tytuł: Zapraszanie użytkowników do grupy
- Opis: Jako członek grupy, chcę móc zaprosić do niej znajomych poprzez podanie ich adresu e-mail, aby mogli dołączyć i uczestniczyć w rozliczeniach.
- Kryteria akceptacji:
  - W widoku grupy dostępna jest opcja zapraszania nowych członków.
  - Użytkownik może wpisać jeden lub więcej adresów e-mail.
  - Jeśli zaproszony użytkownik istnieje w systemie, jest od razu dodawany do grupy.
  - Jeśli zaproszony użytkownik nie istnieje, otrzymuje status "oczekujący" na liście członków grupy.

- ID: US-004
- Tytuł: Opuszczanie grupy
- Opis: Jako członek grupy, chcę móc ją opuścić, jeśli nie chcę już uczestniczyć w jej rozliczeniach.
- Kryteria akceptacji:
  - Użytkownik ma możliwość opuszczenia każdej grupy, do której należy.
  - Przed opuszczeniem grupy, użytkownik widzi komunikat z prośbą o potwierdzenie.
  - Po opuszczeniu grupy, użytkownik nie widzi jej już na swojej liście grup.
  - W widoku grupy dla pozostałych członków, użytkownik, który ją opuścił, ma status "Nieaktywny".
  - Salda związane z nieaktywnym użytkownikiem pozostają niezmienione i wciąż można się z nim rozliczyć.

### Zarządzanie wydatkami
- ID: US-005
- Tytuł: Ręczne dodawanie wydatku z podziałem "po równo"
- Opis: Jako członek grupy, chcę ręcznie dodać wydatek, podając kwotę, opis, walutę i uczestników, z podziałem "po równo", aby szybko zarejestrować wspólny koszt.
- Kryteria akceptacji:
  - Formularz dodawania wydatku pozwala na wpisanie opisu, kwoty, daty i wybranie waluty z listy zdefiniowanej dla grupy.
  - Użytkownik może wybrać, kto zapłacił za wydatek (domyślnie on sam).
  - Użytkownik może wybrać z listy członków grupy, kto uczestniczył w wydatku.
  - Po wybraniu opcji "po równo", kwota jest automatycznie dzielona na wybranych uczestników.
  - Po zapisaniu, salda wszystkich uczestników są poprawnie aktualizowane.

- ID: US-006
- Tytuł: Ręczne dodawanie wydatku z podziałem "każdy ma swoją kwotę"
- Opis: Jako członek grupy, chcę ręcznie dodać wydatek, przypisując konkretne kwoty poszczególnym osobom, aby precyzyjnie odzwierciedlić złożony rachunek.
- Kryteria akceptacji:
  - W formularzu dodawania wydatku dostępna jest opcja podziału "każdy ma swoją kwotę".
  - Po jej wybraniu, użytkownik może wpisać indywidualne kwoty dla każdego z wybranych uczestników.
  - Formularz na bieżąco wyświetla sumę wpisanych kwot oraz kwotę pozostałą do rozdzielenia.
  - Przycisk "Zapisz" jest nieaktywny, dopóki suma kwot cząstkowych nie będzie równa całkowitej kwocie wydatku.
  - Po zapisaniu, salda wszystkich uczestników są poprawnie zaktualizowane zgodnie z przypisanymi kwotami.

- ID: US-007
- Tytuł: Dodawanie wydatku za pomocą głosu
- Opis: Będąc w pośpiechu, chcę powiedzieć do aplikacji np. "Ja zapłaciłem 50 euro za lunch dla mnie i Ani", aby system automatycznie przeliczył to na walutę bazową grupy i dodał wydatek bez ręcznego wypełniania formularza.
- Kryteria akceptacji:
  - Aplikacja posiada interfejs do nagrywania polecenia głosowego.
  - W trakcie przetwarzania polecenia, użytkownik widzi wskaźnik ładowania.
  - Po przetworzeniu, formularz wydatku jest automatycznie wypełniony danymi: kwota (50), waluta (EUR), płacący (ja), uczestnicy (ja, Ania), opis (lunch).
  - Użytkownik może poprawić każde z pól przed zatwierdzeniem.
  - Po zatwierdzeniu, wydatek jest dodawany, a salda (wyrażone w walucie bazowej grupy) są poprawnie aktualizowane.

- ID: US-008
- Tytuł: Edycja własnego wydatku
- Opis: Jako autor wydatku, chcę mieć możliwość jego edycji, aby poprawić ewentualne błędy.
- Kryteria akceptacji:
  - Użytkownik może otworzyć do edycji tylko te wydatki, które sam dodał.
  - Formularz edycji jest tożsamy z formularzem dodawania wydatku i pozwala na zmianę wszystkich pól.
  - Po zapisaniu zmian, salda wszystkich zaangażowanych użytkowników są przeliczane i aktualizowane.
  - Użytkownik nie widzi opcji edycji przy wydatkach dodanych przez inne osoby.

- ID: US-009
- Tytuł: Usuwanie własnego wydatku
- Opis: Jako autor wydatku, chcę mieć możliwość jego usunięcia, jeśli został dodany przez pomyłkę.
- Kryteria akceptacji:
  - Użytkownik może usunąć tylko te wydatki, które sam dodał.
  - Przed usunięciem wyświetlany jest monit z prośbą o potwierdzenie.
  - Po usunięciu, wydatek znika z historii grupy, a salda wszystkich zaangażowanych użytkowników są przeliczane i aktualizowane.

### Rozliczenia
- ID: US-010
- Tytuł: Przeglądanie sald w grupie
- Opis: Jako członek grupy, chcę w każdej chwili widzieć proste podsumowanie, kto komu jest winien pieniądze, aby mieć kontrolę nad finansami.
- Kryteria akceptacji:
  - W widoku grupy znajduje się sekcja podsumowująca salda, wyświetlana w walucie bazowej grupy.
  - Podsumowanie jasno pokazuje, którzy użytkownicy mają długi i wobec kogo.
  - Podsumowanie jasno pokazuje, którym użytkownikom inni są winni pieniądze.
  - Użytkownik może zobaczyć swoje całkowite saldo w ramach grupy (ile jest "na plusie" lub "na minusie").

- ID: US-011
- Tytuł: Rejestrowanie spłaty długu
- Opis: Jako użytkownik, chcę zarejestrować, że oddałem Tomkowi 50 zł, które byłem mu winien, aby nasze salda zostały poprawnie zaktualizowane.
- Kryteria akceptacji:
  - Aplikacja udostępnia funkcję "Rozlicz się".
  - Użytkownik może wybrać osobę, z którą się rozlicza.
  - Użytkownik wpisuje kwotę spłaty w walucie bazowej grupy (może być to kwota częściowa lub całkowita).
  - Po zatwierdzeniu, w historii grupy pojawia się nowa transakcja typu "rozliczenie".
  - Salda obu użytkowników biorących udział w rozliczeniu są poprawnie zaktualizowane.

- ID: US-012
- Tytuł: Zarządzanie walutami w grupie
- Opis: Jako administrator grupy, chcę zdefiniować walutę bazową dla grupy oraz dodać inne waluty wraz z ich stałym przelicznikiem, aby umożliwić członkom dodawanie wydatków w różnych walutach.
- Kryteria akceptacji:
  - Podczas tworzenia grupy, jej założyciel wybiera walutę bazową.
  - W ustawieniach grupy istnieje opcja "Zarządzaj walutami".
  - Użytkownik może dodać nową walutę (np. z predefiniowanej listy) i wpisać dla niej stały kurs wymiany na walutę bazową (np. 1 EUR = 4.50 PLN).
  - Użytkownik może edytować lub usuwać dodane kursy wymiany.
  - Waluta bazowa grupy nie może zostać usunięta.

## 6. Metryki sukcesu

- MS-001: Niezawodność kluczowej pętli: Mierzona poprzez odsetek pomyślnie zakończonych sesji użytkownika obejmujących ścieżkę: utworzenie grupy -> zaproszenie członka -> dodanie wydatku (głosem lub manualnie, z uwzględnieniem różnych walut) -> weryfikacja poprawności sald.
- MS-002: Wydajność funkcji głosowej: Średni czas od zakończenia nagrywania polecenia do wyświetlenia wypełnionego formularza. Cel: poniżej 20 sekund.
- MS-003: Skuteczność AI: Odsetek wydatków dodanych głosem, które wymagały ręcznej korekty kluczowych pól (kwota, płacący, uczestnicy, waluta) przez użytkownika przed zatwierdzeniem.
- MS-004: Zaangażowanie użytkowników: Stosunek liczby wydatków dodanych głosem do liczby wydatków dodanych manualnie.
- MS-005: Aktywność: Średnia liczba wydatków dodawanych przez aktywnego użytkownika w tygodniu.
- MS-006: Stabilność: Aplikacja jest na tyle stabilna, że grupa testowa może jej użyć do bezproblemowego rozliczenia realnego scenariusza, np. weekendowego wyjazdu.
