# Contributing to Gnolove

Thank you for your interest in contributing to Gnolove! We welcome contributions from developers of all skill levels. This guide will help you get started.

## Prerequisites

Before contributing, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (for frontend package management)
- **Go** (v1.24.0 or higher) - if working on the backend
- **Git**

## Getting Started

### 1. Fork and Clone the Repository

1. Fork the repository by clicking the "Fork" button on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/gnolove.git
   cd gnolove
   ```

### 2. Set Up the Development Environment

#### Frontend Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` file with required variables (see README.md for details)

4. Start the development server:
   ```bash
   pnpm run dev
   ```

#### Backend Setup (Optional)

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` file with required variables (see server/README.md for details)

4. Run the server:
   ```bash
   go run .
   ```

## Making Contributions

### 1. Create a Feature Branch

Create a new branch for your work:
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, maintainable code
- Follow the existing code style and conventions
- Add comments where necessary
- Test your changes thoroughly

### 3. Commit Your Changes

Write clear, concise commit messages:
```bash
git add .
git commit -m "feat: add new contributor statistics feature"
```

Follow conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `refactor:` for code refactoring
- `test:` for test updates
- `chore:` for maintenance tasks

### 4. Push and Submit a Pull Request

1. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request on GitHub
3. Provide a clear description of your changes
4. Reference any related issues
5. Wait for review and address any feedback

## Code Quality

### Linting and Formatting

Before submitting, ensure your code passes all checks:
```bash
pnpm run lint
```

### Type Checking

Ensure TypeScript types are correct:
```bash
pnpm run check-types
```

## Need Help?

- Review the [README.md](README.md) for project setup details
- Check existing issues and pull requests
- Join the Gnoland community discussions

---

Thank you for contributing to Gnolove! :)
