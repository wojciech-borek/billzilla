# Billzilla – Wytyczne Wizualne

Szczegółowy opis schematu kolorów, typografii oraz kierunku wizualnego aplikacji opartej o **Shadcn/UI** i **Tailwind CSS v4**.

---

## 🎨 Paleta kolorów

| Rola w UI        | Kolor                     | Hex       | Tailwind (zmienna)               | Opis                                             |
| ---------------- | ------------------------- | --------- | -------------------------------- | ------------------------------------------------ |
| **Primary**      | Zielony dinozaura         | `#49A067` | `--primary: #49A067;`            | Kolor akcentowy – przyciski, linki, ikony akcji. |
| **Primary Dark** | Ciemnozielony kontur      | `#0E2E24` | `--primary-foreground: #0E2E24;` | Dla ciemniejszych tonów i hoverów.               |
| **Secondary**    | Jasna zieleń              | `#6DBE83` | `--secondary: #6DBE83;`          | Dla delikatnych elementów UI (np. tła kart).     |
| **Accent**       | Pomarańczowo-różowy język | `#F49B7A` | `--accent: #F49B7A;`             | Używać oszczędnie – np. badge, highlight.        |
| **Neutral Dark** | Ciemny granat             | `#0C2231` | `--foreground: #0C2231;`         | Główny kolor tekstu.                             |
| **Background**   | Jasnoszary                | `#f9fafb` | `--background: #f9fafb;`         | Tło aplikacji – jasnoszare (gray-50).            |
| **Card**         | Biały                     | `#ffffff` | `--card: #ffffff;`               | Tło kart – czysto białe dla kontrastu.           |

---

## 🧱 Styl interfejsu

**Ogólny klimat:** Przyjazny, nowoczesny, lekko kreskówkowy, ale profesjonalny.

**Cechy UI:**

- Zaokrąglone rogi (`rounded-2xl` jako standard, `1.5rem`).
- Duże marginesy i przestrzeń (`p-4`, `gap-6`).
- Czyste, płaskie ikony (flat/outline).
- Wyrafinowane cienie (`shadow-sm shadow-gray-100/50` - delikatny, mało przezroczysty).
- Delikatne ramki (`border border-gray-100`).
- Subtelne animacje (`transition-all duration-300 ease-out`).

---

## ✍️ Typografia

| Zastosowanie         | Font                           | Klasa Tailwind                  | Opis                          |
| -------------------- | ------------------------------ | ------------------------------- | ----------------------------- |
| **Nagłówki (H1–H3)** | Inter                          | `font-bold tracking-tight`      | Nowoczesny, czytelny.         |
| **Etykiety ważne**   | Inter                          | `font-semibold tracking-tight`  | Dla ważnych etykiet.          |
| **Tekst główny**     | Inter                          | `font-normal`                   | Neutralny, lekko zaokrąglony. |
| **Logo / Branding**  | Niestandardowy styl cartoonowy | `font-bold tracking-tight`      | Tylko w logotypie.            |

---

## 🧩 Komponenty Shadcn/UI – rekomendacje

| Komponent                | Styl                                                                       | Kolorystyka                                   |
| ------------------------ | -------------------------------------------------------------------------- | --------------------------------------------- |
| **Button**               | `variant="default"`                                                        | `bg-primary text-white hover:bg-primary-dark` |
| **Card**                 | `bg-white border border-gray-100 shadow-sm shadow-gray-100/50 rounded-2xl` | Wewnątrz `text-foreground`.                   |
| **Badge**                | `bg-accent/20 text-accent`                                                 | Do wyróżnień.                                 |
| **Input**                | `border-gray-300 focus:border-primary focus:ring-primary/40`               | Subtelne, ciepłe tonacje.                     |
| **Sidebar / Navigation** | `bg-primary text-white` z `hover:bg-primary-dark`                          | Spójne z motywem.                             |

---

## 🌈 Przykładowy fragment konfiguracji Tailwind

```ts
// tailwind.config.ts
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  theme: {
    extend: {
      colors: {
        background: "#f9fafb", // gray-50 - jasnoszare tło
        foreground: "#0C2231",
        card: "#ffffff", // czysto białe karty
        primary: "#49A067",
        "primary-dark": "#0E2E24",
        secondary: "#6DBE83",
        accent: "#F49B7A",
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
    },
  },
};
```

---

## 🧠 Dodatkowe wskazówki brandingowe

- Używaj ilustracji i ikon z zaokrąglonymi kształtami, podobnych stylistycznie do dinozaura.
- Emocje: **zaufanie, prostota, radość z kontroli nad rachunkami**.
- Unikaj ciemnych motywów – aplikacja powinna być **jasna i optymistyczna**.
- Warto dodać **mikroanimacje** (np. dinozaur w splash screenie lub animacja ładowania).

---

**Autor:** Dokumentacja stylistyczna dla projektu _Billzilla UI Kit_  
**Framework:** Shadcn/UI + Tailwind CSS v4
