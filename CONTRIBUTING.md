# Contributing to Camppbl

Welcome! We are excited that you are contributing to Camppbl. To maintain codebase health and coordinate work effectively, please adhere to the following Git workflow and code guidelines.

---

## 1. Branch Naming Conventions

When starting a new task, create a local branch originating from `main`. Use descriptive, lowercase names prefixed with the category of change:

| Prefix | Description | Example Branch Name |
| :--- | :--- | :--- |
| `feature/` | New user-facing features or capabilities | `feature/canteen-diet-filters` |
| `bugfix/` | Fixing a bug or unexpected behavior | `bugfix/mess-menu-overlap` |
| `docs/` | Updates or additions to documentation | `docs/api-endpoints` |
| `chore/` | Maintenance tasks, dependencies, configuration | `chore/update-eslint-rules` |
| `refactor/` | Code change that neither fixes a bug nor adds a feature | `refactor/skillswap-state` |

---

## 2. Commit Message Guidelines

We use **Conventional Commits** to keep our git logs readable and support automated release notes.

### Format
```
<type>(<scope>): <short description>

[optional body describing technical details]
```

### Allowed Types
* **`feat`**: A new user feature.
* **`fix`**: A bug fix.
* **`docs`**: Documentation changes.
* **`style`**: White-space, formatting, missing semi-colons, etc. (no business logic changes).
* **`refactor`**: Restructuring code without changing behavior.
* **`test`**: Adding or updating tests.
* **`chore`**: Updating build scripts, package dependencies, configs.

### Examples
* `feat(frontend): add search filtering and veg/non-veg diet indicators to canteen ordering module`
* `fix(backend): resolve cors issue on token renewal endpoint`
* `chore(git): setup frontend lint workflow github action`

---

## 3. Pull Request (PR) Workflow

1. **Keep PRs Small**: Keep PRs focused on a single logical task or issue.
2. **Push to Remote**: Push your local branch to the remote origin:
   ```bash
   git push -u origin feature/your-branch-name
   ```
3. **Open a PR**: Open a Pull Request from your branch into `main` on GitHub.
4. **Fill out the template**: Describe the changes clearly, list key updates, and outline how you verified them.
5. **Get Review**: Request code review from at least one peer developer.
6. **Merge**: Once approved and all CI checks pass, merge the PR into `main`.

---

## 4. Code Formatting & Quality

Before pushing your branch, ensure your code compiles and follows the project style formatting:
* Use ESLint config rules defined in `packages/frontend/eslint.config.js`.
* Run frontend verification using `npm run lint` if configured.
