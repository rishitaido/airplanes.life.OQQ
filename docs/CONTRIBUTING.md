# Contributing to My AI 3D Viewer

Thank you for your interest in contributing! By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. **Fork** the repository on GitHub.

2. **Clone** your fork locally:

   ```bash
   git clone https://github.com/<your-username>/my-ai-3d-viewer.git
   cd my-ai-3d-viewer
   ```
3. **Install dependencies** in a virtual environment:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
4. Copy or rename `.env.example` to `.env` and fill in any required API keys or configuration values.

## Branching & Workflow

* Work on **feature branches** off of `main`.
* Naming convention:

  * `feature/<short-description>` for new features
  * `bugfix/<short-description>` for bug fixes
  * `docs/<short-description>` for documentation changes
* Keep your branch up to date:

  ```bash
   git fetch upstream
   git rebase upstream/main
  ```

## Code Style & Quality

* **Python**: Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)

  * Run `flake8` or `black .` before committing.
* **JavaScript**: Follow ESLint rules defined in `.eslintrc.js`.

  * Run `npm run lint` (or `yarn lint`) in `templates/index.html` and static scripts if added.
* **CSS**: Use the existing style conventions in `static/style.css`. Keep dark theme variables consistent.

## Testing

* Add or update **unit tests** in the `tests/` folder.
* Run the full test suite with:

  ```bash
   pytest --maxfail=1 --disable-warnings -q
  ```

## Submitting Changes

1. **Commit messages**

   * Use the format: `<type>(<scope>): <short description>`
   * Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
   * Example: `feat(chat): add user message alignment`
2. **Push** your branch to your fork:

   ```bash
   git push origin feature/my-new-feature
   ```
3. **Open a Pull Request** against the `main` branch of the upstream repository.

   * Reference any related issue or ticket.
   * Describe **what** you’ve changed and **why**.
   * Include screenshots or logs if relevant.

## Review & Merging

* Team members will review your PR with feedback or approval.
* Once approved and CI passes, a maintainer will merge your changes.
* After merging, delete your feature branch locally and on GitHub.

## Joining the Community

* Check out our [Discord/Matrix](#) channel to ask questions or hang out.
* Report bugs or request features by opening an [issue](https://github.com/your-org/my-ai-3d-viewer/issues).

Thank you for helping us improve My AI 3D Viewer! We look forward to your contributions.\`\`\`
