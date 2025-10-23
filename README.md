# Billzilla

[![Project Status: WIP](https://img.shields.io/badge/status-work--in--progress-yellow.svg)](https://github.com/wojciech-borek/billzilla) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A web application to simplify managing shared expenses for groups, with a key feature for adding expenses via voice commands.

---

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

---

## Project Description

Billzilla is a responsive web application designed to simplify the management of shared expenses among groups such as friends, roommates, or families. The application allows users to easily track, split, and settle costs. A key distinguishing feature is the ability to add expenses using voice commands, which intelligently processes speech into structured data and fills out the form, requiring only user approval. Authentication is handled exclusively through Google accounts for quick and secure onboarding.

The project aims to solve common problems associated with shared finances, such as manual tracking difficulties, complex calculations for unequal splits, and the risk of misunderstandings due to forgotten expenses.

## Tech Stack

The project is built with a modern tech stack:

- **Framework**: [Astro 5](https://astro.build/)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Component Library**: [Shadcn/ui](https://ui.shadcn.com/)

## Getting Started Locally

To set up and run the project on your local machine, follow these steps:

### Prerequisites

- Node.js version `22.14.0` (as specified in the `.nvmrc` file). We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.

### Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/wojciech-borek/billzilla.git
    cd billzilla
    ```

2.  **Set the Node.js version:**
    If you are using `nvm`, run the following command in the project root:

    ```sh
    nvm use
    ```

3.  **Install dependencies:**

    ```sh
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:

    ```sh
    cp .env.example .env
    ```

    Then, fill in the necessary environment variables in the `.env` file (e.g., database credentials, API keys for Google authentication).

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Available Scripts

The following scripts are available in `package.json`:

| Script             | Description                            |
| ------------------ | -------------------------------------- |
| `npm run dev`      | Starts the development server.         |
| `npm run build`    | Builds the application for production. |
| `npm run preview`  | Previews the production build locally. |
| `npm run astro`    | Runs the Astro CLI.                    |
| `npm run lint`     | Lints the codebase for errors.         |
| `npm run lint:fix` | Fixes linting errors automatically.    |
| `npm run format`   | Formats the code using Prettier.       |

## Project Scope

### Key Features

- **User and Group Management**:
  - Secure sign-up and login exclusively via Google accounts.
  - Create and name new expense groups.
  - Invite others to groups via email.
  - Ability to leave a group at any time (financial data is preserved for final settlements).

- **Expense Management**:
  - Add expenses via a manual form (description, amount, date, currency).
  - **Voice-powered Expense Entry**: Add expenses using natural language voice commands.
  - Support for both "equal" and "specific amount" splits.
  - Real-time validation to ensure split amounts match the total expense.
  - Only the expense creator can edit or delete their entries.

- **Balances and Settlements**:
  - Automatic calculation and updating of balances within each group.
  - Clear summary of who owes whom, presented in the group's base currency.
  - "Settle Up" feature to log full or partial debt repayments.

- **Currency Management**:
  - Define a base currency for each group.
  - Add other currencies with manually set, fixed exchange rates against the base currency.

### Out of Scope (for MVP)

The following features are intentionally excluded from the initial MVP release to focus on core functionality:

- Email and password authentication.
- Automatic fetching of currency exchange rates from external services.
- Complex user roles and permissions within groups.
- Push notifications for new expenses or balance changes.
- Data export functionality.
- Ability to attach images or receipts to expenses.

## Project Status

**Version:** 0.0.1

The project is currently **a work-in-progress**. Core features are under active development.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
