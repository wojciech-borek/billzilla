## Zadanie dla Ciebie (Cursor / AI Dev Assistant)

Twoim zadaniem jest uruchomienie ESLinta i naprawienie błędów w konkretnym folderze projektu.

### Zakres
- Poprawiaj **tylko pliki we wskazanym przeze mnie folderze**.
- Nie modyfikuj plików poza tym folderem bez pytania.

###Co masz zrobić krok po kroku:

1. Przeanalizuj konfigurację ESLinta w repo (`.eslintrc*` lub `eslintConfig` w `package.json`).
2. Uruchom ESLint na folderze:  
   - Komenda (przykład, dostosuj do managera pakietów):  
     ```
     npx eslint "<TU_WSTAW_FOLDER>/**/*.{js,jsx,ts,tsx}" --fix
     ```
3. Popraw wszystkie błędy i ostrzeżenia ESLint. Bądź zgodny z zasadami w .cursor/rules/shared.mdc.
4. Pokaż mi listę wprowadzonych zmian (diff lub podsumowanie).
5. Uruchom testy projektu po poprawkach (np. `npm test` / `yarn test` / `pnpm test`) i sprawdź, czy nic nie zostało popsute.
6. Przygotuj **raport końcowy** w języku polskim zawierający:
   - Co zostało poprawione
   - Lista zmienionych plików
   - Wynik testów po zmianach
   - Czy coś wymaga ręcznej poprawy
   - Sugestie co można zrobić lepiej w przyszłości (opcjonalnie)

### Wymagania dodatkowe:
- Nie wyłączaj reguł ESLinta bez powodu.
- Jeśli zmiana może wpłynąć na logikę działania — poinformuj mnie o tym.
- Jeśli ESLint nie jest poprawnie skonfigurowany, powiedz jak go skonfigurować.

### Format odpowiedzi
Zwróć mi wynik w formie czytelnego raportu Markdown.

---

