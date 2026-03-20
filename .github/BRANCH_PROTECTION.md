# Branch Protection — `main`

This document describes the branch protection ruleset that **must be enabled** via
[GitHub Repository Settings → Branches](../../settings/branches) to enforce the policies
described below.

---

## Ruleset configuration

| Setting                                        | Value                                              |
| ---------------------------------------------- | -------------------------------------------------- |
| **Branch name pattern**                        | `main`                                             |
| **Restrict creations**                         | ✅ Enabled — only administrators may create `main` |
| **Restrict deletions**                         | ✅ Enabled — `main` cannot be deleted              |
| **Require a pull request before merging**      | ✅ Enabled                                         |
| &nbsp;&nbsp; Required approvals                | **1**                                              |
| &nbsp;&nbsp; Dismiss stale reviews on new push | ✅ Enabled                                         |
| &nbsp;&nbsp; Require review from Code Owners   | ✅ Enabled (`@suraniharsh` — see `CODEOWNERS`)     |
| **Require status checks to pass**              | ✅ Enabled                                         |
| &nbsp;&nbsp; Required checks                   | `Format Check`, `Build`, `Test`                    |
| &nbsp;&nbsp; Require branches to be up to date | ✅ Enabled                                         |
| **Block force pushes**                         | ✅ Enabled                                         |
| **Require linear history**                     | ✅ Enabled — squash or rebase merges only          |

---

## CI status checks

The three required status checks are provided by `.github/workflows/ci.yml`:

| Job name       | What it verifies                           |
| -------------- | ------------------------------------------ |
| `Format Check` | `pnpm format:check` — Prettier formatting  |
| `Build`        | `pnpm build` — TypeScript compiles cleanly |
| `Test`         | `pnpm test:coverage` — all tests pass      |

All three jobs must pass before a PR can be merged into `main`.

---

## How to apply these settings (one-time setup)

1. Go to **Settings → Branches** in this repository.
2. Click **Add branch ruleset** (or **Add classic branch protection rule**).
3. Set **Branch name pattern** to `main`.
4. Enable each setting listed in the table above.
5. Click **Save changes**.

> **Note:** After the CI workflow has run at least once, the job names
> (`Format Check`, `Build`, `Test`) will appear in the status-check drop-down
> so you can select them as required checks.
