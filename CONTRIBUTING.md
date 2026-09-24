# Contributing to TinyURL

Thank you for choosing to contribute to TinyURL! We welcome developers of all skill levels to help improve this project.

## 🤝 Community Standards

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## 🛠️ Local Development Setup

### 1. Fork and Clone
- Fork the repository to your own GitHub account.
- Clone your fork locally:
  ```bash
  git clone https://github.com/YOUR_USERNAME/tinyurl-link-shortener.git
  cd tinyurl-link-shortener
  ```

### 2. Configure Remotes
Keep your fork in sync with the main repository:
```bash
git remote add upstream https://github.com/ichshakib/tinyurl-link-shortener.git
```

### 3. Install Dependencies
We use `pnpm` for workspace management:
```bash
pnpm install
```

## 🔄 Workflow

### Step 1: Create a Branch
Always create a new branch for your work:
```bash
git checkout -b feature/your-feature-name
# OR
git checkout -b fix/your-bug-name
```

### Step 2: Develop and Test
- Run `pnpm dev` to see your changes in real-time.
- Ensure all quality checks pass before committing:
  ```bash
  pnpm lint       # Checks for code style issues
  pnpm typecheck  # Verifies TypeScript types
  pnpm build     # Ensures the project compiles
  ```

### Step 3: Commit and Push
Follow [Conventional Commits](https://www.conventionalcommits.org/) for your messages:
- `feat: ...` for new features
- `fix: ...` for bug fixes
- `docs: ...` for documentation
- `style: ...` for formatting/UI changes

```bash
git add .
git commit -m "feat: your descriptive message"
git push origin your-branch-name
```

### Step 4: Open a Pull Request
- Navigate to the original repository on GitHub.
- Click "New Pull Request" and select your branch.
- Provide a clear description of the changes and any related issues.

## 📁 Repository Structure

- `apps/web`: Next.js frontend application.
- `apps/server`: Express API gateway.
- `apps/url-generation-service`: gRPC-based short code generator.
- `packages/*`: Shared configurations and internal libraries (logger, utils, etc.).

## 🧪 Testing Policy
- We use GitHub Actions for CI. Your PR must pass all checks (Lint, Build, Typecheck) before being merged.
