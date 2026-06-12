# Pipewright

> Scaffold CI/CD pipelines and project boilerplates — interactively, in seconds.

[![CI](https://github.com/BielQuirino/pipewright/actions/workflows/ci.yml/badge.svg)](https://github.com/BielQuirino/pipewright/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/pipewright)](https://www.npmjs.com/package/pipewright)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## The Problem

Every new project starts the same way: copy-paste a `Dockerfile` from the last repo, tweak a GitHub Actions YAML until the indentation stops breaking, set up ESLint again, configure TypeScript again. This is 30–60 minutes of mechanical work that adds zero business value.

**Pipewright eliminates that.**

---

## Demo

```
$ pipewright init my-api

? Framework: NestJS
? Package manager: pnpm
? Add CI/CD pipeline? Yes
? CI/CD provider: GitHub Actions
? Node version for CI: 20
? Include Dockerfile? Yes
? Include release pipeline? No

✔ Files generated

  create  package.json
  create  tsconfig.json
  create  tsconfig.build.json
  create  nest-cli.json
  create  .gitignore
  create  .eslintrc.js
  create  .prettierrc
  create  src/main.ts
  create  src/app.module.ts
  create  src/app.controller.ts
  create  src/app.service.ts
  create  src/app.controller.spec.ts
  create  test/app.e2e-spec.ts
  create  test/jest-e2e.json
  create  Dockerfile
  create  .dockerignore
  create  .github/workflows/ci.yml

✔ Project my-api created at /projects/my-api

  cd my-api
  pnpm install
```

---

## Installation

```bash
npm install -g pipewright
```

```bash
pnpm add -g pipewright
```

```bash
yarn global add pipewright
```

Or use without installing:

```bash
npx pipewright init my-project
```

---

## Commands

### `pipewright init [project-name]`

Scaffolds a complete project from scratch — framework files, config files, and CI/CD pipeline.

```
Options:
  -f, --framework <framework>     nestjs | vue
  -p, --provider <provider>       github | azure | gitlab
  -m, --package-manager <pm>      npm | pnpm | yarn        (default: npm)
      --node <version>            Node version for CI      (default: 20)
      --docker                    Include Dockerfile
      --release                   Include release/publish pipeline
      --git                       Run git init after scaffold
      --install                   Run dependency install after scaffold
      --no-pipeline               Scaffold app only, skip CI/CD
```

**Examples:**

```bash
# Interactive (recommended for first use)
pipewright init

# NestJS + GitHub Actions + Docker, no prompts
pipewright init my-api --framework nestjs --provider github --docker --yes

# Vue 3 + Azure DevOps, pnpm
pipewright init my-frontend --framework vue --provider azure --package-manager pnpm

# App only, no pipeline
pipewright init my-app --framework nestjs --no-pipeline

# Preview what would be created without writing files
pipewright init my-api --framework nestjs --provider github --dry-run
```

---

### `pipewright add pipeline`

Adds a CI/CD pipeline to an **existing** project. Auto-detects the framework and package manager from `package.json`.

```
Options:
  -p, --provider <provider>   github | azure | gitlab
      --node <version>        Node version               (default: detected/20)
      --docker                Include Docker publish job
      --release               Include release pipeline
```

**Examples:**

```bash
# Interactive — prompts for provider
pipewright add pipeline

# Non-interactive
pipewright add pipeline --provider github --docker

# Different working directory
pipewright add pipeline --provider gitlab --cwd /path/to/project
```

---

### `pipewright add dockerfile`

Adds an optimized **multi-stage Dockerfile** to an existing project. Auto-detects framework.

```
Options:
  -f, --framework <framework>   nestjs | vue   (auto-detected if omitted)
      --port <port>             Exposed port    (default: 3000 NestJS / 80 Vue)
      --node <version>          Base image Node version (default: 20)
```

**Examples:**

```bash
# Auto-detect framework
pipewright add dockerfile

# Explicit
pipewright add dockerfile --framework nestjs --port 3000 --node 20

# Vue with custom port
pipewright add dockerfile --framework vue --port 8080
```

---

## Global Options

These options work on every command:

| Option | Description |
|---|---|
| `-c, --cwd <dir>` | Set the working directory |
| `-y, --yes` | Accept all defaults, skip prompts |
| `--dry-run` | Show what would be created without writing |
| `-F, --force` | Overwrite existing files |
| `--silent` | Only output errors |
| `--no-spinner` | Disable spinners (auto-disabled in CI) |

---

## What Gets Generated

### NestJS Project (`pipewright init --framework nestjs`)

```
my-app/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.controller.spec.ts
│   └── app.service.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── .eslintrc.js
├── .prettierrc
└── .gitignore
```

### Vue 3 Project (`pipewright init --framework vue`)

```
my-app/
├── src/
│   ├── main.ts
│   ├── App.vue
│   └── env.d.ts
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── .gitignore
```

### GitHub Actions Pipeline (`--provider github`)

```
.github/
└── workflows/
    ├── ci.yml              # Build, lint, typecheck, test (matrix: multiple Node versions)
    ├── docker-publish.yml  # Build & push to GHCR (only with --docker)
    └── release.yml         # Changesets-based release (only with --release)
```

### Azure DevOps Pipeline (`--provider azure`)

```
azure-pipelines.yml         # Stages: install → lint → build → test → docker (optional)
```

### GitLab CI Pipeline (`--provider gitlab`)

```
.gitlab-ci.yml              # Stages: install → lint → build → test → docker (optional)
```

### Dockerfile (`--docker` or `pipewright add dockerfile`)

Both NestJS and Vue generate production-ready **multi-stage** Dockerfiles:

- **NestJS**: `deps` stage (prod deps) + `build` stage + minimal `runner` stage
- **Vue**: `build` stage + `nginx:stable-alpine` runner

---

## Supported Combinations

| Framework | GitHub Actions | Azure DevOps | GitLab CI | Dockerfile |
|---|:---:|:---:|:---:|:---:|
| NestJS | ✅ | ✅ | ✅ | ✅ |
| Vue 3 | ✅ | ✅ | ✅ | ✅ |

---

## Requirements

- **Node.js** `>=18.17`
- **npm** / **pnpm** / **yarn**

---

## CI/CD Features

### GitHub Actions (`ci.yml`)

- Runs on `push` to `main`/`develop` and all `pull_request` to `main`
- Matrix strategy: configurable Node version
- Steps: checkout → setup Node (with cache) → install → lint → typecheck → build → test
- Optional Docker build-check job

### GitHub Actions (`release.yml`, with `--release`)

- Powered by [Changesets](https://github.com/changesets/changesets)
- Pushes to `main` create a "Release PR" or publish to npm automatically
- Requires `NPM_TOKEN` secret

### Azure DevOps (`azure-pipelines.yml`)

- Stages: Build → (optional) Docker
- Caches `node_modules`
- Only runs Docker stage on `main` branch

### GitLab CI (`.gitlab-ci.yml`)

- Stages: install → lint → build → test → (optional) docker → (optional) release
- Uses `node:<version>-alpine` image
- Artifact passing between stages

---

## License

MIT — see [LICENSE](LICENSE).

---

## Acknowledgements

Inspired by [create-t3-app](https://github.com/t3-oss/create-t3-app) and the [Nest CLI](https://github.com/nestjs/nest-cli).
