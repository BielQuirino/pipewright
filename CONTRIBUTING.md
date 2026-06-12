# Contributing to Pipewright

Thank you for your interest in contributing. This document covers everything you need to know to open a pull request.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Architecture Patterns](#architecture-patterns)
- [Adding a New CI/CD Provider](#adding-a-new-cicd-provider)
- [Adding a New Framework Generator](#adding-a-new-framework-generator)
- [Adding or Editing Templates](#adding-or-editing-templates)
- [Testing](#testing)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Code Standards](#code-standards)

---

## Development Setup

**Prerequisites:** Node.js `>=18.17`, npm/pnpm/yarn.

```bash
# Fork and clone
git clone https://github.com/YOUR_FORK/pipewright.git
cd pipewright

# Install dependencies
npm install

# Build
npm run build

# Run the CLI locally
node dist/cli.js --help

# Watch mode (rebuilds on save)
npm run dev
```

**Verify your setup:**

```bash
# All tests must pass before submitting a PR
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## Project Structure

```
src/
├── cli.ts                    # Entry point — bootstraps Commander, wires up DI
├── index.ts                  # Public programmatic API barrel
│
├── commands/                 # Command Pattern — one class per CLI command
│   ├── Command.ts            # abstract BaseCommand
│   ├── InitCommand.ts        # pipewright init
│   ├── AddPipelineCommand.ts # pipewright add pipeline
│   ├── AddDockerfileCommand.ts
│   └── index.ts              # registerCommands()
│
├── providers/                # Strategy Pattern — one class per CI/CD provider
│   ├── CiProvider.ts         # re-exports the CiProvider interface
│   ├── ProviderRegistry.ts   # runtime registry: resolve() / list()
│   ├── github/
│   ├── azure/
│   └── gitlab/
│
├── generators/               # One class per scaffold target
│   ├── Generator.ts          # re-exports the Generator interface
│   ├── GeneratorRegistry.ts
│   ├── nestjs/
│   ├── vue/
│   └── dockerfile/
│
├── templates/                # EJS files — copied verbatim to dist/templates/
│   ├── pipelines/
│   │   ├── github/
│   │   ├── azure/
│   │   └── gitlab/
│   ├── frameworks/
│   │   ├── nestjs/
│   │   └── vue/
│   └── docker/
│
├── core/                     # Engine, IO, UX — no business logic
│   ├── TemplateEngine.ts     # renders EJS templates
│   ├── FileWriter.ts         # writes EmittedFile[] to disk
│   ├── Logger.ts             # leveled, chalk-colored output
│   ├── Spinner.ts            # ora wrapper, auto-off in CI
│   ├── Prompter.ts           # inquirer wrapper, honors --yes
│   ├── PathResolver.ts       # resolves template paths cross-env
│   └── errors.ts             # UserError / InternalError hierarchy
│
├── context/
│   └── AppContext.ts         # DI container — wires all dependencies
│
└── types/                    # Pure TypeScript interfaces — no runtime code
    ├── command.types.ts
    ├── provider.types.ts
    ├── generator.types.ts
    ├── template.types.ts
    └── prompt.types.ts

test/
├── unit/                     # Vitest unit tests (mirror of src/)
├── e2e/                      # execa-based tests against the compiled binary
└── helpers/                  # tmpProject.ts, runCli.ts
```

---

## Architecture Patterns

Understanding these two patterns is essential before contributing.

### Command Pattern

Each CLI subcommand is an isolated class that extends `BaseCommand`:

```typescript
export abstract class BaseCommand {
  constructor(protected readonly ctxFactory: () => AppContext) {}

  abstract register(program: Command): void;
  abstract run(opts: unknown): Promise<void>;

  protected get ctx(): AppContext {
    return this.ctxFactory();
  }
}
```

- `register()` — attaches the command to Commander (declares flags, action handler)
- `run()` — contains the actual logic; calls `this.ctx` once to get the DI container

Commands **never** import from each other. Each command is self-contained.

### Strategy Pattern (Providers and Generators)

The `CiProvider` and `Generator` interfaces are the strategy contracts:

```typescript
interface CiProvider {
  readonly id: 'github' | 'azure' | 'gitlab';
  readonly label: string;
  prompts(): PromptSchema;
  generate(ctx: PipelineContext): Promise<EmittedFile[]>;
}

interface Generator {
  readonly id: 'nestjs' | 'vue' | 'dockerfile';
  readonly label: string;
  prompts(): PromptSchema;
  generate(ctx: ScaffoldContext): Promise<EmittedFile[]>;
}
```

`generate()` returns `EmittedFile[]` — an array of `{ relativePath, contents }` pairs. The `FileWriter` handles all disk I/O. Providers and generators produce strings; they never touch the filesystem directly.

This boundary makes them trivially testable and ensures `--dry-run` works for free.

### Dependency Injection (AppContext)

`AppContext` is constructed once per command invocation and holds all dependencies. Commands receive a factory function, not a pre-built context, so global flags (parsed after registration) are applied correctly.

Providers and generators are registered in `cli.ts` — the single wiring point. Adding a new provider requires registering it there.

---

## Adding a New CI/CD Provider

The following walkthrough adds a fictitious `CircleCI` provider.

**1. Create the config file:**

```typescript
// src/providers/circleci/circleci.config.ts
export const CIRCLECI_CONFIG = {
  id: 'circleci' as const,
  label: 'CircleCI',
  outputFile: '.circleci/config.yml',
  templateDir: 'pipelines/circleci',
} as const;
```

**2. Create the provider:**

```typescript
// src/providers/circleci/CircleCiProvider.ts
import type { CiProvider, PipelineContext, EmittedFile, PromptSchema } from '../../types/index.js';
import type { TemplateEngine } from '../../core/TemplateEngine.js';
import type { PathResolver } from '../../core/PathResolver.js';
import { CIRCLECI_CONFIG } from './circleci.config.js';

export class CircleCiProvider implements CiProvider {
  readonly id = CIRCLECI_CONFIG.id;
  readonly label = CIRCLECI_CONFIG.label;

  constructor(
    private readonly engine: TemplateEngine,
    private readonly pathResolver: PathResolver,
  ) {}

  prompts(): PromptSchema {
    return { questions: [] };
  }

  async generate(ctx: PipelineContext): Promise<EmittedFile[]> {
    return [
      {
        relativePath: CIRCLECI_CONFIG.outputFile,
        contents: await this.engine.render(
          this.pathResolver.templatePath(`${CIRCLECI_CONFIG.templateDir}/config.yml.ejs`),
          { ...ctx },
        ),
      },
    ];
  }
}
```

**3. Add the EJS template:**

```yaml
# src/templates/pipelines/circleci/config.yml.ejs
version: 2.1

jobs:
  build:
    docker:
      - image: cimg/node:<%= nodeVersion %>
    steps:
      - checkout
      - run: <%= packageManager %> install
      - run: <%= packageManager %> run build
      - run: <%= packageManager %> run test

workflows:
  build-and-test:
    jobs:
      - build
```

**4. Extend the `ProviderId` union type:**

```typescript
// src/types/prompt.types.ts
export type ProviderId = 'github' | 'azure' | 'gitlab' | 'circleci';
```

**5. Register in `cli.ts`:**

```typescript
import { CircleCiProvider } from './providers/circleci/CircleCiProvider.js';

// inside buildContext():
ctx.providers.register(new CircleCiProvider(ctx.engine, ctx.pathResolver));
```

**6. Add the provider choice in `InitCommand.ts` and `AddPipelineCommand.ts`:**

```typescript
choices: [
  { name: 'GitHub Actions', value: 'github' },
  { name: 'Azure DevOps', value: 'azure' },
  { name: 'GitLab CI', value: 'gitlab' },
  { name: 'CircleCI', value: 'circleci' },  // ← add this
],
```

**7. Write tests:**

```typescript
// test/unit/providers/CircleCiProvider.test.ts
import { CircleCiProvider } from '../../../src/providers/circleci/CircleCiProvider.js';
// ... same pattern as GithubActionsProvider.test.ts
```

---

## Adding a New Framework Generator

The following walkthrough adds a `Fastify` generator.

**1. Create the config:**

```typescript
// src/generators/fastify/fastify.config.ts
export const FASTIFY_CONFIG = {
  id: 'fastify' as const,
  label: 'Fastify',
  templateDir: 'frameworks/fastify',
  defaultPort: 3000,
} as const;
```

**2. Create the generator:**

```typescript
// src/generators/fastify/FastifyGenerator.ts
import type { Generator, ScaffoldContext, EmittedFile, PromptSchema } from '../../types/index.js';
import type { TemplateEngine } from '../../core/TemplateEngine.js';
import type { PathResolver } from '../../core/PathResolver.js';
import { FASTIFY_CONFIG } from './fastify.config.js';

export class FastifyGenerator implements Generator {
  readonly id = FASTIFY_CONFIG.id;
  readonly label = FASTIFY_CONFIG.label;

  constructor(
    private readonly engine: TemplateEngine,
    private readonly pathResolver: PathResolver,
  ) {}

  prompts(): PromptSchema {
    return { questions: [] };
  }

  async generate(ctx: ScaffoldContext): Promise<EmittedFile[]> {
    const tpl = (name: string) =>
      this.pathResolver.templatePath(`${FASTIFY_CONFIG.templateDir}/${name}`);

    return Promise.all(
      [['package.json', 'package.json.ejs'], ['src/app.ts', 'src/app.ts.ejs']].map(
        async ([out, tmpl]) => ({
          relativePath: out,
          contents: await this.engine.render(tpl(tmpl), { ...ctx }),
        }),
      ),
    );
  }
}
```

**3. Create EJS templates** in `src/templates/frameworks/fastify/`.

**4. Extend `GeneratorId`:**

```typescript
// src/types/prompt.types.ts
export type GeneratorId = 'nestjs' | 'vue' | 'dockerfile' | 'fastify';
```

**5. Register in `cli.ts`** and add to the `--framework` choices in `InitCommand.ts`.

---

## Adding or Editing Templates

Templates are EJS files located in `src/templates/`. They are copied verbatim to `dist/templates/` during the build step — they are not bundled or transformed by TypeScript.

**Naming convention:** `<output-filename>.<output-extension>.ejs`

Examples:
- `package.json.ejs` → generates `package.json`
- `node-ci.yml.ejs` → generates `node-ci.yml`
- `gitignore.ejs` → generates `.gitignore` (the dot is added by the generator's output path)

**Available context variables** depend on which provider/generator renders the template. Check the `generate()` method of the corresponding class to see what context object is passed.

**EJS syntax used in this project:**

```ejs
<%= variable %>          Output a variable
<% if (condition) { %>   Conditional block (no output)
<%- unescapedHtml %>     Unescaped output (avoid unless necessary)
```

**After editing a template:**

```bash
npm run build     # copies updated templates to dist/
npm run test      # verify nothing broke
```

Templates are human-readable in `dist/` — you can inspect the rendered output of any template without running the CLI.

---

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# E2E tests (requires a build first)
npm run build && npm run test:e2e
```

### Unit test conventions

Unit tests live in `test/unit/` and mirror the `src/` structure. Each test file tests one class.

- Providers and generators are tested with a real `TemplateEngine` and `PathResolver` (they hit the actual `.ejs` files in `src/templates/`). This is intentional — mocking the template engine would hide rendering bugs.
- `FileWriter` is tested with real temporary directories (created and cleaned up per test).
- Use `vi.fn()` only for callbacks or external side effects, not for core infrastructure.

### E2E test conventions

E2E tests run the compiled binary in a temporary directory via `execa`:

```typescript
import { runCli } from '../helpers/runCli.js';

const result = await runCli(['init', 'my-app', '--framework', 'nestjs', '--yes']);
expect(result.exitCode).toBe(0);
```

Always clean up temp directories in `afterEach`.

---

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must follow the pattern:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

| Type | When to use |
|---|---|
| `feat` | New feature (new provider, new generator, new flag) |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `refactor` | Code change that is neither a bug fix nor a feature |
| `chore` | Build scripts, dependencies, tooling |
| `ci` | CI/CD pipeline changes |

**Scopes:** `providers`, `generators`, `commands`, `templates`, `core`, `types`, `cli`, `docs`.

**Examples:**

```
feat(providers): add CircleCI provider
fix(generators): correct NestJS tsconfig paths
docs: update README with Fastify example
test(providers): add GitlabCiProvider unit tests
chore(deps): bump ejs to 3.1.10
```

Commitlint enforces this automatically on commit. The pre-commit hook also runs lint-staged.

---

## Versioning and Releases

This project uses [Changesets](https://github.com/changesets/changesets) for versioning.

If your PR introduces a user-facing change (new feature, bug fix, breaking change), add a changeset:

```bash
npx changeset
```

Follow the prompts — select the bump type (`patch`, `minor`, `major`) and describe the change. Commit the generated file alongside your code changes.

Changesets are consumed automatically by the release pipeline on merge to `main`.

---

## Pull Request Process

1. **Fork** the repository and create a branch from `main`.
2. **Branch naming:** `feat/add-circleci-provider`, `fix/nestjs-tsconfig`, `docs/update-readme`.
3. **Keep PRs focused.** One feature or fix per PR.
4. **All checks must pass:** tests, typecheck, lint.
5. **Add a changeset** if the PR is user-facing.
6. **Update tests.** New providers and generators require unit tests. New commands require e2e tests.
7. **Do not edit `CHANGELOG.md`** — it is generated automatically.

The PR template will guide you through the required checklist.

---

## Code Standards

These are not style preferences — they are enforced by ESLint and the review process.

### No inline comments

Code is written to be read, not explained. Well-named functions and variables are the documentation. The only acceptable comment is one that explains a **non-obvious constraint** or **external quirk** — not what the code does.

```typescript
// Bad
// Loop through each file and write it to disk
for (const file of files) { ... }

// Good (no comment needed — the code is self-explanatory)
for (const file of files) { ... }

// Good (explains a non-obvious constraint)
// existsSync is used here because PathResolver is called in a constructor
// where async is not available, and the template dir must be resolved synchronously.
this.distDir = existsSync(candidate) ? candidate : fallback;
```

Explanations of design decisions, architecture choices, and module contracts belong in this `CONTRIBUTING.md` or in the module's section of the README — not in code comments.

### No premature abstractions

Three similar lines of code are acceptable. A shared abstraction requires at least three real usages with identical behavior. Do not create helper functions or base classes for single-use cases.

### Types, not `any`

`@typescript-eslint/no-explicit-any` is set to `error`. Use `unknown` + type guards, generics, or proper interfaces instead.

### Strict null handling

`exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` are enabled. Do not use `!` non-null assertions — prove to the type system that the value exists.

### Interfaces over classes for types

Types shared between modules live in `src/types/`. They are plain TypeScript `interface` declarations — no runtime code, no constructors.

### The EmittedFile contract

Providers and generators **never** write to disk. They return `EmittedFile[]`. The `FileWriter` is the single write path. This contract must not be broken.
