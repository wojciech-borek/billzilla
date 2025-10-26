# Plan testów jednostkowych
@slug: unit-tests
@description: Generuje plan testów jednostkowych dla wskazanego serwisu w formacie test case (Markdown).

Zadanie: Przeanalizuj plik "{input}" i wygeneruj listę **testów jednostkowych** (test cases) możliwych do napisania dla tego [pliku].

Wejście: podaj nazwę pliku

Dla każdego testu zwróć wynik w języku polskim **jednolitym szablonie test case** (Markdown). Szablon musi zawierać:
- **ID** (np. `UT-<moduł>-<numer>`)
- **Nazwa testu** (czytelna, konwencja: `should_<expected>_when_<condition>`)
- **Moduł / funkcja** (gdzie test się odnosi)
- **Cel testu**
- **Wejście / dane testowe**
- **Setup / izolacja**
- **Kroki testowe (Arrange → Act → Assert)**
- **Oczekiwany rezultat**
- **Priorytet**
- **Edge cases**
- **Notatki / uwagi**

Wyjście: zapisz plik markdown w folderze @.ai/test-case z nazwa generowanego serwisu test cases pogrupowaną według modułów (Markdown). Daj też krótkie (1–2 zdania) podsumowanie w języku polskim, które moduły są najważniejsze do pokrycia unit testami. 

Uwaga: Nie dodawaj ogólnych zasad testowania — skup się wyłącznie na generowaniu konkretnych test case’ów i ich danych/oczekiwanych rezultatach.
