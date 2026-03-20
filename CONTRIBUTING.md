# Contributing to Ritual

Thank you for your interest in contributing to Ritual! This document outlines the process for contributing to this project and how to get your development environment set up.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and welcoming environment for everyone. Please be kind and constructive in all interactions.

## Getting Started

### Prerequisites

- **Node.js** v16 or higher
- **pnpm** (preferred package manager)

### Fork & Clone

1. Fork the repository on GitHub.
2. Clone your fork locally:

   ```bash
   git clone https://github.com/<your-username>/ritual-tui.git
   cd ritual-tui
   ```

3. Add the upstream remote so you can keep your fork up to date:

   ```bash
   git remote add upstream https://github.com/suraniharsh/ritual-tui.git
   ```

### Install Dependencies

```bash
pnpm install
```

### Environment Setup

Copy the example environment file and fill in any required values:

```bash
cp .env.example .env
```

### Run in Development Mode

```bash
pnpm dev
```

## Development Workflow

1. **Sync with upstream** before starting new work:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

   Use one of the following prefixes:

   | Prefix | Purpose |
   |--------|---------|
   | `feat/` | New feature |
   | `fix/` | Bug fix |
   | `docs/` | Documentation changes |
   | `refactor/` | Code refactoring |
   | `test/` | Adding or updating tests |
   | `chore/` | Maintenance tasks |

3. **Make your changes** and commit them (see [Code Style](#code-style)).

4. **Push** your branch and open a Pull Request.

## Project Structure

```
ritual-tui/
├── src/
│   ├── components/       # React/Ink UI components
│   │   ├── calendar/     # Calendar pane
│   │   ├── tasks/        # Task list and items
│   │   ├── timeline/     # Timeline pane
│   │   └── common/       # Shared components (HelpDialog, etc.)
│   ├── contexts/         # React contexts (Theme, Storage, App)
│   ├── services/         # Business logic (task, timeline, calendar, storage)
│   ├── themes/           # Built-in and community themes
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility helpers (date, tree, validation)
├── __tests__/            # Test files
├── server/               # Cross-machine sync server (Express + Redis)
└── scripts/              # Build and deployment scripts
```

## Code Style

This project uses **Prettier** for automatic code formatting. Formatting is applied automatically on every commit via a Husky pre-commit hook.

To manually format all files:

```bash
pnpm format
```

To check formatting without modifying files:

```bash
pnpm format:check
```

### General Guidelines

- Use **TypeScript** for all source files.
- Prefer **functional React components** and hooks.
- Keep components focused and single-purpose.
- Add types/interfaces to `src/types/` when introducing new data structures.
- Follow the existing patterns for services, contexts, and components.

## Testing

Tests are written with **Vitest**. Please add or update tests when changing business logic.

```bash
# Run tests in watch mode
pnpm test

# Run tests once (CI mode)
pnpm test:run

# Run tests with coverage report
pnpm test:coverage
```

Test files live in `__tests__/`. Follow the existing naming convention: `<module>.test.ts`.

## Submitting a Pull Request

1. Ensure all tests pass:

   ```bash
   pnpm test:run
   ```

2. Ensure code is properly formatted:

   ```bash
   pnpm format:check
   ```

3. Push your branch to GitHub and open a Pull Request against `main`.

4. Fill in the PR template (if provided) with a clear description of what changed and why.

5. Be responsive to review feedback — update your branch and push new commits as needed.

### Commit Message Format

Use clear, concise commit messages in the imperative mood:

```
feat: add recurring task support
fix: correct timeline timestamp display
docs: update keyboard shortcuts in README
```

## Reporting Bugs

Open an issue at <https://github.com/suraniharsh/ritual-tui/issues> and include:

- A clear description of the bug
- Steps to reproduce
- Expected vs. actual behavior
- Your OS, Node.js version, and terminal emulator

## Suggesting Features

Open an issue and prefix the title with `[Feature Request]`. Describe:

- The problem you are trying to solve
- Your proposed solution
- Any alternatives you considered

---

Questions? Reach out to the maintainer at [harshsurani00@gmail.com](mailto:harshsurani00@gmail.com).
